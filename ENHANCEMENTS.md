# Enhancement summary

## Product and matching

- Compatibility scores now reward complementary teach/learn skills, location, proficiency, and reputation.
- Recommendations include human-readable reasons and exclude accepted/rejected relationships and blocks.
- People can search, filter by minimum score, save favorites, and show favorites only.
- Swap proposals carry the exact four skill records, message, preferred online/offline mode, and proposed time.

## Learning workflow

- Accepted swaps reliably create a match and chat.
- Either participant can schedule and reschedule a validated learning session.
- Sessions support online links or in-person locations, notes, cancellation, completion, and calendar export.
- Reviews are limited to participants in completed sessions, one review per reviewer/session.
- Users can create learning goals, choose a target skill/date, update progress, and archive or complete goals.
- Dashboard achievements give visible milestones for connections, sessions, and trust.

## Communication

- Notifications arrive live over authenticated STOMP user queues and retain read/unread state.
- Chat supports live messages, typing state, replies, edits, soft deletion, read receipts, image previews, and safe file attachments.
- Voice/video uses authenticated match signalling; ICE servers can be supplied through `VITE_ICE_SERVERS` for TURN support.

## Trust and administration

- Blocking prevents recommendations, new requests, and chat in both directions.
- Reports can reference a message or review and are validated against the reported user.
- Admins can review/dismiss/resolve reports and suspend, reactivate, or deactivate accounts.
- Suspended/deactivated users are rejected by Spring Security during login.
- Registration creates a one-time email verification token; password recovery uses a separate one-hour token.
- Raw account tokens are never stored in the database and generic recovery responses prevent email enumeration.

## Operations

- Authentication and API requests have configurable per-IP rate limits.
- Health is public; metrics/info require an administrator.
- Frontend pages and major libraries are code-split for much smaller initial downloads.
- Dockerfiles, an nginx SPA/WebSocket proxy, MySQL Compose service, health checks, durable volumes, and `.env.example` are included.

## External services to connect before a public launch

The repository contains working local adapters and configuration points, but these operational services require credentials and cannot be provisioned from source code alone:

- Transactional email provider for verification/reset delivery
- TURN service for dependable WebRTC connectivity
- S3-compatible object storage and malware scanning for uploads
- Redis for distributed rate limiting and presence when horizontally scaling
- Push-notification provider if background mobile/browser push is required
- Error tracking, log aggregation, backups, and CI/CD for the chosen hosting platform
