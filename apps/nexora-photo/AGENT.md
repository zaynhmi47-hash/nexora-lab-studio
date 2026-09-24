# Nexora Photo — AGENT.md

## 1. Mission
Nexora Photo is a private image/document utility for compression, resizing, conversion, OCR, image-to-PDF, and document processing.

## 2. Privacy
Local processing is preferred for private media. If cloud processing is introduced, disclose it and obtain the appropriate user action/permission. Never silently upload photos or documents.

## 3. Processing
Preserve originals. Give users control over output format, quality, dimensions, and destination. Heavy work must not freeze the interface. Handle orientation, metadata, large files, and unsupported formats carefully.

## 4. AI-agent instructions
Inspect platform-specific file APIs before implementing new storage code. Avoid duplicating cloud file services from Core. Add tests for large images, corrupted files, EXIF orientation, PDF output, OCR failure, cancellation, and insufficient storage.

## 5. UX
Make import → configure → process → preview → save/share a clear pipeline. Always show processing state and meaningful errors.