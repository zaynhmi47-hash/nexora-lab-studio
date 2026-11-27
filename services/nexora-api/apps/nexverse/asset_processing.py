from __future__ import annotations

from hashlib import sha256
from io import BytesIO
from pathlib import PurePosixPath
import re
import zipfile
from xml.etree import ElementTree

from PIL import Image, UnidentifiedImageError


MAX_DOCUMENT_BYTES = 50 * 1024 * 1024
MAX_ARCHIVE_ENTRIES = 5000
MAX_EXPANDED_BYTES = 200 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000


class AssetValidationError(ValueError):
    """Raised when an uploaded asset does not match its declared format."""


def _base_metadata(data: bytes, content_type: str) -> dict:
    return {
        "verifiedBytes": len(data),
        "sha256": sha256(data).hexdigest(),
        "detectedContentType": content_type,
    }


def _inspect_image(data: bytes, expected_type: str) -> dict:
    try:
        with Image.open(BytesIO(data)) as image:
            detected = Image.MIME.get(image.format)
            width, height = image.size
            if detected != expected_type:
                raise AssetValidationError("Image signature does not match its declared format.")
            if width < 1 or height < 1 or width * height > MAX_IMAGE_PIXELS:
                raise AssetValidationError("Image dimensions exceed the allowed processing limit.")
            image.verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise AssetValidationError("Image file is invalid or unsafe to decode.") from exc
    return {"width": width, "height": height, "format": detected}


def _inspect_epub(data: bytes) -> dict:
    try:
        with zipfile.ZipFile(BytesIO(data)) as archive:
            infos = archive.infolist()
            if len(infos) > MAX_ARCHIVE_ENTRIES:
                raise AssetValidationError("EPUB contains too many archive entries.")
            expanded = 0
            for info in infos:
                path = PurePosixPath(info.filename)
                if path.is_absolute() or ".." in path.parts:
                    raise AssetValidationError("EPUB contains an unsafe archive path.")
                expanded += info.file_size
                if expanded > MAX_EXPANDED_BYTES:
                    raise AssetValidationError("EPUB expands beyond the processing limit.")
                if info.file_size > 0 and info.compress_size == 0:
                    raise AssetValidationError("EPUB contains an invalid compressed entry.")
                if info.compress_size and info.file_size / info.compress_size > 200:
                    raise AssetValidationError("EPUB contains an excessive compression ratio.")

            mimetype = archive.read("mimetype")
            if mimetype != b"application/epub+zip":
                raise AssetValidationError("EPUB mimetype declaration is missing or invalid.")
            container = ElementTree.fromstring(archive.read("META-INF/container.xml"))
            rootfile = next(
                (node.attrib.get("full-path") for node in container.iter()
                 if node.tag.endswith("rootfile")),
                None,
            )
            if not rootfile:
                raise AssetValidationError("EPUB package document is missing.")
            package = ElementTree.fromstring(archive.read(rootfile))
            title = next(
                (node.text.strip() for node in package.iter()
                 if node.tag.endswith("title") and node.text and node.text.strip()),
                "",
            )
            return {
                "format": "EPUB",
                "archiveEntries": len(infos),
                "expandedBytes": expanded,
                "title": title[:255],
            }
    except (zipfile.BadZipFile, KeyError, ElementTree.ParseError, OSError) as exc:
        raise AssetValidationError("EPUB archive structure is invalid.") from exc


def inspect_asset(data: bytes, *, asset_type: str, content_type: str, filename: str) -> dict:
    if not data or len(data) > MAX_DOCUMENT_BYTES:
        raise AssetValidationError("Asset size is outside the processing limit.")

    suffix = PurePosixPath(filename).suffix.lower()
    metadata = _base_metadata(data, content_type)

    if asset_type == "cover" or content_type.startswith("image/"):
        image_metadata = _inspect_image(data, content_type)
        metadata.update(image_metadata)
        metadata["format"] = image_metadata["format"]
        return metadata

    if content_type == "application/pdf":
        if not data.startswith(b"%PDF-"):
            raise AssetValidationError("PDF file signature is invalid.")
        if b"%%EOF" not in data[-2048:]:
            raise AssetValidationError("PDF end marker is missing.")
        metadata.update({"format": "PDF", "hasPdfHeader": True, "hasPdfEndMarker": True})
        return metadata

    if content_type == "application/epub+zip":
        metadata.update(_inspect_epub(data))
        return metadata

    if content_type == "text/plain" and suffix == ".txt":
        try:
            decoded = data.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise AssetValidationError("Text manuscript must use UTF-8 encoding.") from exc
        if any(ord(char) < 32 and char not in "\\n\\r\\t\\f" for char in decoded):
            raise AssetValidationError("Text manuscript contains unsupported control characters.")
        metadata.update({
            "format": "TXT",
            "encoding": "UTF-8",
            "characters": len(decoded),
            "words": len(re.findall(r"\\S+", decoded)),
            "preview": decoded[:500],
        })
        return metadata

    raise AssetValidationError("This asset format is not supported by the processing engine.")
