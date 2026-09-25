# Property App — AGENT.md

## 1. Mission
Experimental property platform for discovery, listings, service connections, offers, and potential transaction workflows.

## 2. Concept
The first product may focus on verified listings and discovery rather than trying to become a full property marketplace immediately. Future modules can include agents, services, offers, financing/payment integrations, and transaction support.

## 3. Trust
Separate listing claims, owner identity, verification evidence, offers, and legal/transaction status. Never imply ownership or legal validity from an unverified listing.

## 4. AI-agent instructions
Treat this as experimental. Keep requirements and domain models isolated. Location data must respect privacy. Avoid storing unnecessary precise private addresses. Any payment/legal integration must be provider-neutral and auditable.

## 5. UX
Prioritize search, filters, property details, media, location context, contact, reporting, and verification status. Make uncertainty visible instead of hiding it.

# Detailed Product Concept — Property App

## 1. Product Positioning

Property App is Nexora's property-focused application for discovering, managing, publishing, and operating real-estate or property-related records.

The architecture should support property listings and operational workflows without pretending that every market has identical legal, rental, ownership, or transaction rules.

## 2. Core Domains

Initial domains:
- Properties.
- Units.
- Locations.
- Property media.
- Listings.
- Availability.
- Owners.
- Managers/agents.
- Prospective occupants/buyers.
- Inquiries.
- Viewing appointments.
- Applications.
- Lease/rental references.
- Property documents.
- Maintenance/service references.

Ownership/legal records should be represented only when the product has an appropriate authoritative source and policy.

## 3. Property and Listing Model

Separate:
- Physical property.
- Unit.
- Listing.
- Availability.
- Commercial offer.

A listing may change independently from the underlying property.

Listing lifecycle may include:

Draft → Review → Published → Paused → Updated → Expired/Archived

Every status transition should be auditable.

## 4. Search and Discovery

Users may search by:
- Location.
- Property type.
- Price range.
- Size.
- Number of rooms.
- Availability.
- Features/amenities.
- Other supported attributes.

Search must respect listing visibility and authorization.

## 5. Inquiries and Viewing

Typical flow:

Discovery → Inquiry → Conversation/Follow-up → Viewing → Application/Next Step

Notifications should be generated only for authorized participants.

## 6. UX and Navigation

Public/consumer shell:

Home → Search → Map/Listings → Favorites → Messages/Inquiries → Viewings → Profile

Owner/manager shell:

Dashboard → Properties → Units → Listings → Inquiries → Viewings → Applications → Documents → Maintenance → Reports → Settings

## 7. Backend Relationship

Property backend owns property/listing domain records and workflows.

Nexora Core owns identity, organizations, authorization, files, notifications, and audit primitives.

Finance remains authoritative for financial transactions, payments, invoices, and ledger data. Property may hold commercial references but must not create a competing financial ledger.

CRM may own broader customer relationship semantics; Property owns property-specific inquiry/listing workflows.

## 8. Privacy and Security

Requirements:
- Private owner/manager records.
- Controlled contact information.
- Secure property documents.
- Role-scoped property management.
- Audit of listing and ownership-sensitive changes.
- Protection against unauthorized scraping or bulk export where applicable.

Do not expose private addresses or personal contact data merely because a property is publicly listed.

## 9. AI

AI may assist with:
- Listing description drafts.
- Search assistance.
- Property information summaries.
- Image/document metadata extraction.
- Inquiry summarization.

AI must not invent property features, legal status, ownership, pricing, availability, or contractual terms.

## 10. Definition of Done

A Property feature is complete only when listing/property separation, visibility, authorization, lifecycle transitions, inquiry permissions, document security, financial integration boundaries, and tests are addressed.
