from io import BytesIO
from types import SimpleNamespace
from unittest.mock import Mock

from PIL import Image
import pytest

from apps.dating_social_professional.media_processing import DatingMomentMediaProcessor, MediaProcessingError
from apps.dating_social_professional.models import DatingMoment


def _png_bytes():
    output = BytesIO()
    Image.new("RGB", (1200, 800), "purple").save(output, format="PNG")
    return output.getvalue()


def test_image_thumbnail_is_jpeg_and_resized():
    result = DatingMomentMediaProcessor._image_thumbnail(_png_bytes())
    with Image.open(BytesIO(result)) as thumbnail:
        assert thumbnail.format == "JPEG"
        assert thumbnail.size == (640, 427)


def test_invalid_image_raises_processing_error():
    with pytest.raises(MediaProcessingError):
        DatingMomentMediaProcessor._image_thumbnail(b"not-an-image")


def test_processor_uploads_thumbnail_and_persists_reference():
    storage = Mock()
    storage.download.return_value = _png_bytes()
    moment = Mock()
    moment.id = "moment-123"
    moment.storage_key = "user-123/photo.png"
    moment.media_type = DatingMoment.MediaType.IMAGE
    job = SimpleNamespace(moment=moment)

    DatingMomentMediaProcessor(storage).process(job)

    storage.upload.assert_called_once()
    request = storage.upload.call_args.args[0]
    assert request.reference.namespace == "dating/moment-thumbnails"
    assert request.reference.key == "moment-123.jpg"
    assert request.content_type == "image/jpeg"
    assert request.content.startswith(bytes([0xFF, 0xD8, 0xFF]))
    assert moment.thumbnail_key == "moment-123.jpg"
    moment.save.assert_called_once_with(update_fields=["thumbnail_key", "updated_at"])
