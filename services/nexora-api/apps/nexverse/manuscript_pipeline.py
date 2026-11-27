from __future__ import annotations

from html.parser import HTMLParser
from io import BytesIO
import re
import zipfile
from xml.etree import ElementTree

from django.db import IntegrityError, transaction
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from infrastructure.common.types import ObjectReference
from infrastructure.firebase.registry import FirebaseProviderRegistry

from .assets import NexverseUploadSession
from .models import NexverseChapter, NexverseWork


MAX_CHAPTERS = 200
MAX_CHAPTER_CHARS = 500_000
MAX_TEXT_CHARS = 20_000_000


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.heading_level: int | None = None
        self.headings: list[tuple[str, int]] = []

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag in {"h1", "h2"}:
            self.heading_level = int(tag[1])
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag.lower() in {"h1", "h2"}:
            self.heading_level = None
            self.parts.append("\n")
        elif tag.lower() in {"p", "div", "li", "br"}:
            self.parts.append("\n")

    def handle_data(self, data):
        value = re.sub(r"\s+", " ", data).strip()
        if value:
            if self.heading_level and len(value) <= 255:
                self.headings.append((value, self.heading_level))
            self.parts.append(value + " ")


def _normalise(value: str) -> str:
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n[ \t]+", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def _split_text(text: str) -> list[dict]:
    text = _normalise(text)
    if not text:
        return []
    lines = text.splitlines()
    heading = re.compile(
        r"^\s*(?:(?:BAB|CHAPTER|BAGIAN)\s+(?:[0-9IVXLCDM]+|[A-Z]+)\b.*|"
        r"(?:PROLOG|EPILOG|PENDAHULUAN|PENUTUP)\s*)$",
        re.IGNORECASE,
    )
    sections: list[tuple[str, list[str]]] = []
    current_title = "Bagian 1"
    current: list[str] = []
    found = False
    for line in lines:
        candidate = line.strip()
        if candidate and heading.match(candidate):
            if current:
                sections.append((current_title, current))
            current_title = candidate[:255]
            current = []
            found = True
        else:
            current.append(line)
    if current:
        sections.append((current_title, current))
    if not found:
        sections = [("Naskah", lines)]

    result = []
    for title, body_lines in sections:
        body = _normalise("\n".join(body_lines))
        if not body:
            continue
        result.append({"title": title, "content": body})
    return result


def _epub_sections(data: bytes) -> list[dict]:
    with zipfile.ZipFile(BytesIO(data)) as archive:
        names = set(archive.namelist())
        container = ElementTree.fromstring(archive.read("META-INF/container.xml"))
        rootfile = next((node.attrib.get("full-path") for node in container.iter()
                         if node.tag.endswith("rootfile")), None)
        if not rootfile or rootfile not in names:
            raise ValueError("Dokumen paket EPUB tidak ditemukan.")
        package = ElementTree.fromstring(archive.read(rootfile))
        base = rootfile.rsplit("/", 1)[0] if "/" in rootfile else ""
        manifest = {}
        for node in package.iter():
            if node.tag.endswith("item") and node.attrib.get("id") and node.attrib.get("href"):
                manifest[node.attrib["id"]] = node.attrib["href"]
        spine = next((node for node in package.iter() if node.tag.endswith("spine")), None)
        if spine is None:
            raise ValueError("Urutan bacaan EPUB tidak ditemukan.")
        sections = []
        for itemref in spine:
            item_id = itemref.attrib.get("idref")
            href = manifest.get(item_id)
            if not href:
                continue
            path = (base + "/" + href).lstrip("/")
            if path not in names or ".." in path.split("/"):
                continue
            parser = _TextExtractor()
            parser.feed(archive.read(path).decode("utf-8", errors="replace"))
            body = _normalise("".join(parser.parts))
            if not body:
                continue
            title = parser.headings[0][0] if parser.headings else f"Bagian {len(sections) + 1}"
            sections.append({"title": title[:255], "content": body})
            if len(sections) >= MAX_CHAPTERS:
                break
        return sections


def extract_chapter_proposals(data: bytes, content_type: str, filename: str) -> list[dict]:
    if len(data) > 50 * 1024 * 1024:
        raise ValueError("Manuskrip melebihi batas 50 MB.")
    if content_type == "text/plain" and filename.lower().endswith(".txt"):
        text = data.decode("utf-8-sig")
        if len(text) > MAX_TEXT_CHARS:
            raise ValueError("Manuskrip terlalu panjang untuk diproses sekaligus.")
        proposals = _split_text(text)
    elif content_type == "application/epub+zip" and filename.lower().endswith(".epub"):
        proposals = _epub_sections(data)
    else:
        raise ValueError("Ekstraksi bab saat ini mendukung EPUB dan TXT. PDF perlu modul ekstraksi teks khusus.")
    if not proposals:
        raise ValueError("Tidak ditemukan isi bab yang dapat diimpor.")
    cleaned = []
    for item in proposals[:MAX_CHAPTERS]:
        body = _normalise(item["content"])
        if not body:
            continue
        if len(body) > MAX_CHAPTER_CHARS:
            raise ValueError("Salah satu bagian melebihi batas 500.000 karakter. Pecah manuskrip terlebih dahulu.")
        cleaned.append({"title": item["title"][:255] or f"Bab {len(cleaned) + 1}", "content": body})
    if not cleaned:
        raise ValueError("Tidak ada isi bab yang valid.")
    return cleaned


class NexverseManuscriptExtractView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = NexverseUploadSession.objects.filter(
            pk=session_id, owner=request.user, work__author__user=request.user,
            asset_type=NexverseUploadSession.AssetType.MANUSCRIPT,
            status=NexverseUploadSession.Status.READY, deleted_at__isnull=True,
        ).first()
        if session is None:
            return Response({"detail": "Manuskrip siap ekstraksi tidak ditemukan."}, status=404)
        if session.content_type == "application/pdf":
            return Response({"detail": "Ekstraksi teks PDF belum diaktifkan. Gunakan EPUB atau TXT untuk saat ini.",
                             "code": "PDF_EXTRACTION_UNAVAILABLE"}, status=422)
        reference = ObjectReference(namespace="nexverse", key=session.storage_path.removeprefix("nexverse/"))
        try:
            data = FirebaseProviderRegistry().storage().download(reference)
            proposals = extract_chapter_proposals(data, session.content_type, session.original_filename)
        except (ValueError, UnicodeDecodeError, zipfile.BadZipFile, KeyError, ElementTree.ParseError) as exc:
            return Response({"detail": str(exc), "code": "MANUSCRIPT_EXTRACTION_FAILED"}, status=422)
        except Exception:
            return Response({"detail": "Layanan ekstraksi sementara tidak tersedia.", "code": "MANUSCRIPT_EXTRACTION_UNAVAILABLE"}, status=503)
        return Response({
            "assetId": str(session.id),
            "filename": session.original_filename,
            "format": "EPUB" if session.content_type == "application/epub+zip" else "TXT",
            "proposals": [{"number": i + 1, **item, "characters": len(item["content"])} for i, item in enumerate(proposals)],
            "totalChapters": len(proposals),
        })


class NexverseImportManuscriptChaptersView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        chapters = request.data.get("chapters")
        if not isinstance(chapters, list) or not chapters or len(chapters) > MAX_CHAPTERS:
            return Response({"detail": "Kirim 1 sampai 200 bab untuk disimpan."}, status=400)
        with transaction.atomic():
            session = NexverseUploadSession.objects.select_for_update().filter(
                pk=session_id, owner=request.user, work__author__user=request.user,
                asset_type=NexverseUploadSession.AssetType.MANUSCRIPT,
                status=NexverseUploadSession.Status.READY, deleted_at__isnull=True,
            ).select_related("work").first()
            if session is None:
                return Response({"detail": "Manuskrip siap impor tidak ditemukan."}, status=404)
            work = NexverseWork.objects.select_for_update().filter(
                pk=session.work_id, author__user=request.user
            ).first()
            if work is None:
                return Response({"detail": "Karya tidak ditemukan."}, status=404)
            if work.status != NexverseWork.Status.DRAFT or work.review_status == NexverseWork.ReviewStatus.SUBMITTED:
                return Response({"detail": "Bab hanya dapat diimpor ke karya berstatus draf."}, status=409)
            existing_ids = session.processing_metadata.get("importedChapterIds", [])
            if existing_ids:
                existing = list(work.chapters.filter(id__in=existing_ids).order_by("chapter_number"))
                return Response({"items": [{
                    "id": str(ch.id), "number": ch.chapter_number, "title": ch.title
                } for ch in existing], "alreadyImported": True})
            start = (work.chapters.order_by("-chapter_number").values_list("chapter_number", flat=True).first() or 0) + 1
            created = []
            seen_titles = set()
            for index, item in enumerate(chapters):
                if not isinstance(item, dict):
                    return Response({"detail": "Format bab tidak valid."}, status=400)
                title = str(item.get("title", "")).strip()
                content = str(item.get("content", "")).strip()
                if not title or len(title) > 255 or not content or len(content) > MAX_CHAPTER_CHARS:
                    return Response({"detail": f"Judul atau isi bab ke-{index + 1} tidak valid."}, status=400)
                number = start + index
                base_slug = slugify(title)[:120] or "chapter"
                slug = f"{base_slug}-{session.id.hex[:8]}-{index + 1}"
                if title.casefold() in seen_titles:
                    title = f"{title} ({index + 1})"
                seen_titles.add(title.casefold())
                created.append(NexverseChapter(
                    work=work, chapter_number=number, slug=slug, title=title,
                    content=content, status=NexverseChapter.Status.DRAFT,
                ))
            try:
                saved = NexverseChapter.objects.bulk_create(created)
            except IntegrityError:
                return Response({"detail": "Nomor bab bertabrakan. Muat ulang editor dan coba lagi."}, status=409)
            session.processing_metadata = {
                **session.processing_metadata,
                "importedChapterIds": [str(ch.id) for ch in saved],
            }
            session.save(update_fields=("processing_metadata", "updated_at"))
        return Response({"items": [{
            "id": str(ch.id), "number": ch.chapter_number, "title": ch.title
        } for ch in saved], "alreadyImported": False}, status=status.HTTP_201_CREATED)
