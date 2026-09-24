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