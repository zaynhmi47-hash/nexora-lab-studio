from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
    CSRF_TRUSTED_ORIGINS=(list, []),
    DATABASE_URL=(str, "sqlite:///db.sqlite3"),
    DATABASE_CONN_MAX_AGE=(int, 0),
    DATABASE_CONN_HEALTH_CHECKS=(bool, True),
    CONTROL_PLANE_BOOTSTRAP_EMAILS=(list, []),
    CONTROL_PLANE_SESSION_AGE=(int, 1800),
    CONTROL_PLANE_LOGIN_RATE_LIMIT=(int, 5),
    CONTROL_PLANE_AUDIT_RETENTION_DAYS=(int, 0),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY", default="django-insecure-development-only")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes", "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "rest_framework", "apps.core", "apps.control_plane", "apps.identity", "apps.organizations", "apps.access", "apps.products", "apps.capabilities", "apps.learning", "apps.quran", "apps.dhikr", "apps.umrah", "apps.profile", "apps.knowledge", "apps.tajwid", "apps.arabic", "apps.fasting", "apps.dua", "apps.calendar", "apps.zakat", "apps.reminders", "apps.places", "apps.ramadan", "apps.finance",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware", "django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware", "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware", "apps.core.middleware.RequestCorrelationMiddleware", "apps.control_plane.middleware.RequestTelemetryMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True, "OPTIONS": {"context_processors": ["django.template.context_processors.request", "django.contrib.auth.context_processors.auth", "django.contrib.messages.context_processors.messages"]}}]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {"default": {**env.db("DATABASE_URL"), "CONN_MAX_AGE": env("DATABASE_CONN_MAX_AGE"), "CONN_HEALTH_CHECKS": env("DATABASE_CONN_HEALTH_CHECKS")}}
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS")
CONTROL_PLANE_BOOTSTRAP_EMAILS = env("CONTROL_PLANE_BOOTSTRAP_EMAILS")
CONTROL_PLANE_SESSION_AGE = env("CONTROL_PLANE_SESSION_AGE")
CONTROL_PLANE_LOGIN_RATE_LIMIT = env("CONTROL_PLANE_LOGIN_RATE_LIMIT")
CONTROL_PLANE_AUDIT_RETENTION_DAYS = env("CONTROL_PLANE_AUDIT_RETENTION_DAYS")

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.identity.authentication.FirebaseIdentityAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["apps.core.permissions.AuthenticatedNexoraUserPermission"],
}

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Strict"
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Strict"
CSRF_COOKIE_SECURE = not DEBUG

if not DEBUG:
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "same-origin"
    X_FRAME_OPTIONS = "DENY"

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
