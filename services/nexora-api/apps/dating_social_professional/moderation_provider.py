from django.conf import settings
from django.utils.module_loading import import_string


class ModerationProviderNotConfigured(RuntimeError):
    pass


def get_content_moderation_provider():
    provider_path = getattr(settings, "DATING_MOMENT_MODERATION_PROVIDER", "")
    if not provider_path:
        raise ModerationProviderNotConfigured(
            "Set DATING_MOMENT_MODERATION_PROVIDER to an installed provider adapter."
        )
    provider_factory = import_string(provider_path)
    provider = provider_factory() if isinstance(provider_factory, type) else provider_factory
    if not callable(getattr(provider, "assess", None)):
        raise TypeError("Moderation provider must implement assess(request).")
    return provider
