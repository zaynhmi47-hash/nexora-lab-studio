from __future__ import annotations

from io import BytesIO
import logging
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageOps

from infrastructure.common.types import ObjectReference
from infrastructure.storage.ports.object_storage import UploadRequest

from .models import DatingMoment, DatingMomentMediaJob

logger = logging.getLogger(__name__)


class MediaProcessingError(RuntimeError):
    pass


class DatingMomentMediaProcessor:
    """Creates small feed thumbnails; video transcoding is deliberately out of scope."""

    image_thumbnail_max_size = (640, 640)
    video_thumbnail_namespace = "dating/moment-thumbnails"

    def __init__(self, storage):
        self.storage = storage

    def process(self, job: DatingMomentMediaJob) -> None:
        moment = job.moment
        if not moment.storage_key or moment.media_type not in {DatingMoment.MediaType.IMAGE, DatingMoment.MediaType.VIDEO}:
            raise MediaProcessingError("Moment has no supported uploaded media.")

        source = ObjectReference(namespace="dating/moments", key=moment.storage_key)
        original = self.storage.download(source)
        if moment.media_type == DatingMoment.MediaType.IMAGE:
            thumbnail = self._image_thumbnail(original)
            content_type = "image/jpeg"
            extension = "jpg"
        else:
            thumbnail = self._video_thumbnail(original, moment.storage_key)
            content_type = "image/jpeg"
            extension = "jpg"

        key = f"{moment.id}.{extension}"
        target = ObjectReference(namespace=self.video_thumbnail_namespace, key=key)
        self.storage.upload(UploadRequest(
            reference=target,
            content=thumbnail,
            content_type=content_type,
            metadata={"moment_id": str(moment.id), "purpose": "dating-moment-thumbnail"},
        ))
        moment.thumbnail_key = key
        moment.save(update_fields=["thumbnail_key", "updated_at"])

    @classmethod
    def _image_thumbnail(cls, content: bytes) -> bytes:
        try:
            with Image.open(BytesIO(content)) as image:
                image = ImageOps.exif_transpose(image)
                image.thumbnail(cls.image_thumbnail_max_size, Image.Resampling.LANCZOS)
                if image.mode not in {"RGB", "L"}:
                    image = image.convert("RGB")
                output = BytesIO()
                image.save(output, format="JPEG", quality=82, optimize=True)
                return output.getvalue()
        except Exception as exc:
            raise MediaProcessingError("Image thumbnail generation failed.") from exc

    @staticmethod
    def _video_thumbnail(content: bytes, source_name: str) -> bytes:
        try:
            with tempfile.TemporaryDirectory(prefix="dating-moment-") as directory:
                input_path = Path(directory) / (Path(source_name).name or "source-video")
                output_path = Path(directory) / "thumbnail.jpg"
                input_path.write_bytes(content)
                subprocess.run(
                    [
                        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                        "-ss", "00:00:01", "-i", str(input_path),
                        "-frames:v", "1", "-vf", "scale='min(640,iw)':-2",
                        "-q:v", "4", str(output_path),
                    ],
                    check=True,
                    capture_output=True,
                    timeout=45,
                )
                if not output_path.exists() or output_path.stat().st_size == 0:
                    raise MediaProcessingError("FFmpeg did not produce a video thumbnail.")
                return output_path.read_bytes()
        except FileNotFoundError as exc:
            raise MediaProcessingError("FFmpeg is not installed on this worker.") from exc
        except subprocess.TimeoutExpired as exc:
            raise MediaProcessingError("Video thumbnail generation timed out.") from exc
        except subprocess.CalledProcessError as exc:
            logger.warning("FFmpeg failed to create thumbnail: %s", exc.stderr[-1000:].decode(errors="replace"))
            raise MediaProcessingError("Video thumbnail generation failed.") from exc
