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

# Detailed Product Concept — Nexora Photo

## 1. Product Positioning

Nexora Photo is a privacy-first image and document utility focused on practical processing: compression, resizing, conversion, OCR, scanning, and image-to-PDF workflows.

The product should prefer local processing and must never silently upload user images.

## 2. Core Capabilities

Initial capabilities:
- Import/capture images.
- Preview.
- Crop and rotate.
- Resize.
- Compress.
- Convert supported image formats.
- OCR.
- Scan/document capture where supported.
- Image-to-PDF.
- Batch processing.
- Metadata controls.
- Save/export/share.

Supported formats should be explicit rather than implied. Unsupported formats must fail clearly.

## 3. Original Preservation

The original input is an immutable source by default.

Processing should create a new output artifact unless the user explicitly chooses an overwrite operation and the platform safely supports it.

The UI should communicate:
- Original size.
- Output size.
- Format.
- Quality/compression setting.
- Expected or measured result.

Never silently destroy the source.

## 4. Processing Architecture

Small operations may run locally on-device.

Large or expensive jobs should use appropriate native/background processing so the UI remains responsive.

If cloud processing is ever required:
1. Explain that cloud processing is being used.
2. Obtain appropriate user consent.
3. Upload securely.
4. Process through an authenticated backend job.
5. Limit retention.
6. Delete temporary cloud artifacts according to policy.
7. Never expose raw image content in ordinary logs.

## 5. OCR

OCR should expose confidence/limitations where relevant and preserve the original image.

OCR output is derived data and must not be presented as guaranteed truth. Users should be able to review and edit extracted text.

AI-assisted enhancement can help organize or correct text, but it must not silently replace the original OCR result.

## 6. UX and Navigation

Primary shell:

Home → Recent → Compress → Resize → Convert → OCR → Scan / Image-to-PDF → Batch → Settings

Important states:
- Permission denied.
- No media selected.
- Unsupported format.
- Processing.
- Processing completed.
- Processing failed.
- Cancelled.
- Storage/export failure.
- OCR uncertain/low-confidence result.

Batch processing should show per-item progress where useful.

## 7. Permissions

Request only necessary platform permissions:
- Camera for capture/scan.
- Photo/media library for import/export where required.

Permissions should be requested at the moment of need and explained clearly.

## 8. Backend and Core Relationship

Frontend owns:
- Processing UI.
- Local image transformations.
- Native/platform integration.
- Local temporary state.
- Output selection and export behavior.

Nexora Core/Cloud may provide optional:
- Authenticated cloud storage.
- Cross-device synchronization.
- Cloud processing job infrastructure.
- Notifications for long-running jobs.

Backend owns cloud-job metadata and lifecycle only when cloud processing is actually enabled.

## 9. Privacy and Security

Requirements:
- No silent image upload.
- No raw image data in logs.
- Secure temporary files.
- Explicit cloud-processing consent.
- Clear deletion behavior.
- Least-privilege permissions.
- No unnecessary collection of image metadata.

Sensitive document processing should default to on-device operation whenever feasible.

## 10. Definition of Done

A Photo feature is complete only when original preservation, privacy behavior, output quality/settings, permission handling, processing cancellation/retry, storage/export behavior, accessibility, performance, and platform-specific behavior are tested.
