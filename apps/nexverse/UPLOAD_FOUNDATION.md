# Nexverse Creator Upload Foundation

## Mobile configuration

Nexverse reuses the Firebase default app initialized by Nexora Core. Configure the existing
Expo public Firebase values, including `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, and
`EXPO_PUBLIC_NEXORA_API_URL`. Do not commit service-account credentials or private keys.

Install the Expo SDK 54-compatible document picker from the mobile workspace:

```bash
pnpm --filter nexverse-mobile exec expo install expo-document-picker
pnpm --filter nexverse-mobile typecheck
```

## Django configuration

The API uses the existing lazy Firebase Admin registry. Configure the server environment with
`FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, and either application-default credentials
or a protected `FIREBASE_CREDENTIALS_FILE` path. Never expose the service-account file to the
mobile app or commit it.

Apply migrations from `services/nexora-api` after confirming the migration graph:

```bash
python manage.py showmigrations nexverse
python manage.py migrate nexverse
python manage.py test apps.nexverse
```

## Upload protocol

1. Authenticated creator requests a session from
   `POST /api/v1/nexverse/creator/works/{work_id}/uploads/`.
2. Django checks work ownership, draft state, Firebase identity link, MIME/extension pair,
   file size (maximum 50 MiB), and creates a 20-minute session.
3. The mobile app uploads directly to Firebase Storage at the returned `storagePath`.
4. Mobile calls `POST /api/v1/nexverse/creator/uploads/{session_id}/complete/`.
5. Django reads the object metadata through the provider-neutral Firebase storage adapter and
   marks the session uploaded only when size and content type match.
6. The creator explicitly starts inspection with
   `POST /api/v1/nexverse/creator/uploads/{session_id}/process/`.
7. Django downloads the private object through the storage adapter, validates file signatures,
   checks bounded EPUB archive structure, verifies image decoding/dimensions, and extracts basic
   metadata. The resulting state is `ready`, `rejected`, or retryable `failed`.

The current status `uploaded` means the object has been verified against its session metadata;
it does **not** mean malware scanning, document extraction, moderation, or publication is complete.
Uploaded objects remain private. Reader delivery and publisher access must use a separate
authorization path (for example short-lived signed URLs).

## Manuscript-to-chapter pipeline

After a manuscript reaches `ready`, the creator can request a private extraction preview:

`GET /api/v1/nexverse/creator/uploads/{session_id}/extract/`

- EPUB extraction follows the package spine order and reads bounded XHTML/text content.
- TXT extraction normalizes whitespace and detects common Indonesian/English chapter headings
  (BAB, CHAPTER, BAGIAN, PROLOG, EPILOG, and related headings). If no heading is detected,
  the text is offered as one editable section.
- The preview is a proposal only. It does not create chapters or modify the work.
- The mobile review screen allows editing titles/content, reordering, and removing proposed
  sections before the creator confirms import.
- Confirmed import uses
  `POST /api/v1/nexverse/creator/uploads/{session_id}/chapters/`. It creates draft chapters
  inside one database transaction, assigns numbers after existing chapters, and records imported
  chapter IDs on the upload session to prevent duplicate imports on retry.
- Imported chapters remain draft and are not automatically published or exposed to readers.
- PDF extraction is intentionally unavailable until a dedicated bounded PDF text extraction
  dependency and validation strategy are selected. A PDF passing the structural check is not
  considered text-extractable.

Deploy Storage rules only after confirming the Firebase project and bucket:

```bash
firebase deploy --only storage --project nexora-73cfa
```

## Current limitations

- 50 MiB per file; resumable Firebase Storage upload is enabled on the client.
- Manuscripts: PDF, EPUB, TXT. Covers: JPEG, PNG, WEBP. Attachments: PDF, JPEG, PNG.
- The current processing endpoint is synchronous and creator-triggered, not a background worker.
  It performs structural/type validation and basic metadata extraction; it is **not** antivirus or
  malware scanning, a complete PDF parser/OCR engine, moderation approval, or publication.
- TXT extracts UTF-8 word/character counts and a short private preview; EPUB checks ZIP limits,
  safe paths, the EPUB mimetype/container/package, and title metadata; PDF checks basic header/end
  markers; images are decoded and checked for dimensions.
- Upload Center shows per-asset processing state, metadata, validation errors, retry, and the
  manuscript review action for ready EPUB/TXT files. PDF text extraction, OCR, malware scanning,
  secure preview delivery, and a background job queue remain subsequent work.
