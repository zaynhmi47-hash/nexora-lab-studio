from django.test import Client, SimpleTestCase, override_settings


class NexverseWebCorsTests(SimpleTestCase):
    @override_settings(
        CORS_ALLOWED_ORIGINS=["http://localhost:8081"],
        CORS_URLS_REGEX=r"^/api/.*$",
    )
    def test_expo_web_authorization_preflight_is_allowed_for_configured_origin(self):
        response = Client().options(
            "/api/v1/nexverse/works/",
            HTTP_ORIGIN="http://localhost:8081",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization",
        )

        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:8081",
        )
        self.assertIn(
            "authorization",
            response.headers.get("Access-Control-Allow-Headers", "").lower(),
        )

    @override_settings(
        CORS_ALLOWED_ORIGINS=["http://localhost:8081"],
        CORS_URLS_REGEX=r"^/api/.*$",
    )
    def test_unlisted_web_origin_does_not_receive_cors_permission(self):
        response = Client().options(
            "/api/v1/nexverse/works/",
            HTTP_ORIGIN="https://untrusted.example",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization",
        )

        self.assertIsNone(response.headers.get("Access-Control-Allow-Origin"))
