# Nexora Office — AGENT.md

## 1. Mission
Nexora Office is the productivity and document workspace of Nexora. It should combine document creation, spreadsheet work, presentations, PDF workflows, scanning, OCR, signatures, conversion, compression, file management, cloud storage, and AI assistance into one coherent product.

## 2. Product areas
- Documents: create, edit, autosave, versioning, comments, export.
- Spreadsheets: cells, formulas, formatting, import/export.
- Presentations: slides, layouts, media, presentation mode.
- PDF: view, merge, split, compress, convert, annotate, sign.
- Scan/OCR: camera/document capture, cleanup, OCR extraction.
- Files: folders, search, recent files, sharing, permissions.
- Conversion/compression: controlled transformations with predictable outputs.
- AI: summarize, rewrite, extract, classify, assist editing.
- Collaboration: optional shared editing/comments in later phases.

## 3. UX principles
Office must feel like one suite, not a collection of disconnected apps. Common file picker, search, account, sharing, settings, and navigation patterns should be reused. Mobile interactions must remain usable; complex desktop editing should have responsive fallbacks.

## 4. Data and security
Files can contain confidential business or personal information. Enforce ownership and sharing permissions server-side. Never expose private storage objects directly. Use signed/temporary access where appropriate. Preserve originals before destructive transformations. Track versions and important sharing/security events.

## 5. AI-agent instructions
First inspect existing file/document primitives in Nexora Core. Never embed provider secrets in clients. Do not implement document parsing independently if a shared service exists. For editing features, preserve user content and autosave guarantees. For converters, test representative inputs and failure/corrupt-file handling. For AI features, clearly separate generated suggestions from committed document content and never silently overwrite user data.

## 6. Development priorities
Build reliable file/document foundations first, then editing modules, then advanced collaboration/AI. Avoid premature real-time collaboration complexity. Every feature should have mobile/web behavior, permission rules, loading/error/empty states, and tests.
# 7. Detailed product concept

Nexora Office is the productivity and document workspace of Nexora. The intended experience is one coherent suite covering documents, spreadsheets, presentations, PDF workflows, scanning/OCR, signatures, conversion/compression, file management and AI assistance.

The product should serve individuals, students, creators, employees, teams and organizations. Mobile must remain useful, while complex editing can use richer web/desktop interfaces.

Office consumes identity, organization, authorization, file/storage and notification primitives from Nexora Core. It must not recreate those foundations.

# 8. Product modules

## Documents
Create/edit documents, templates, rich text, headings, lists, tables, images, attachments, search, autosave, version history, duplicate/copy, export and comments/collaboration where supported. Save state must be visible: saving, saved, local/offline draft or failed-to-save.

## Spreadsheets
Provide grid editing, formulas, references, formatting, row/column operations, sorting/filtering, freeze panes, validation, import/export and charts where supported. Formula behavior must be deterministic and tested.

## Presentations
Provide slide creation, navigator, templates/layouts, text/images/media, positioning, speaker notes, presentation mode and export.

## PDF
Provide viewing, search, page navigation, annotation, merge, split, reorder, compression, conversion, OCR and signing where supported. Transformations should preserve the original by default.

## Scan and OCR
Mobile capture should support page detection/cropping, readability enhancement, PDF creation and OCR. Extracted text must remain reviewable and must not silently replace the source image.

## File management
Provide recent files, favorites, folders, search, filters, sharing, version history and recovery where supported. Use Core's logical file/storage capability rather than a second storage model.

## Conversion/compression
Show input, transformation, progress, result and failure. Large operations should use background processing.

# 9. Office navigation and UX

Suggested shell:
Home, Recent, Files, Documents, Sheets, Presentations, PDF, Scan, Shared, Settings.

Home should emphasize recent files, favorites, templates, quick creation and active processing jobs.

The editor should be responsive. Web/desktop can use full toolbars and panes; mobile should prioritize the content canvas and use contextual toolbars or bottom sheets. Do not force a desktop layout onto small screens.

File selection should use consistent search and permission indicators. Shared/read-only files must be clearly distinguishable.

Sharing views should show who has access, permission level, organization context and link status where applicable. Sharing changes are security-sensitive and auditable.

# 10. Data lifecycle

A normal document lifecycle is Draft → Saved → Versioned → Shared/Collaborated → Exported/Archived. Product-specific states may extend this.

AI, OCR, conversion and compression must preserve originals unless the user explicitly chooses replacement. Outputs must be clearly identified.

# 11. AI behavior

AI may summarize, rewrite, extract, classify, draft documents, assist spreadsheets/presentations and clean OCR output.

Generated content must be distinguishable until accepted. AI must never silently overwrite user data. Provider credentials stay server-side and AI requests use the shared AI boundary.

# 12. Security and privacy

Office may handle confidential business and personal documents. Enforce ownership and sharing server-side. Do not expose private storage objects directly. Use controlled temporary access where needed. Audit permission changes and other privileged file actions. Avoid leaking document contents into logs.

# 13. Agent ownership

Frontend owns Office screens, editor UI, navigation, responsive behavior, local draft UX and API consumption. Backend owns document metadata, persistence, permissions, processing jobs, OCR/conversion orchestration and APIs. Core owns reusable identity, authorization, files and notification primitives.

Do not solve missing backend functionality with permanent mock data. Do not move Office document semantics into Core.

# 14. Definition of done

Every feature must define permission behavior, lifecycle, mobile/web behavior, loading/empty/error states, original-file preservation, API contract, failure handling and tests.
