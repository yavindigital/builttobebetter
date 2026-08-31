# Built to Be Better — Development Roadmap

**Document:** Developer roadmap and integration reference
**Audience:** Development team
**Status:** Internal

---

## Table of Contents

1. [Before You Write Code — Decisions](#1-before-you-write-code--decisions)
2. [Cross-Phase Infrastructure](#2-cross-phase-infrastructure)
3. [Phase 1 — Sales Engine (MVP)](#3-phase-1--sales-engine-mvp)
4. [Phase 2 — Fulfillment System](#4-phase-2--fulfillment-system)
5. [Phase 3 — Platform Automation](#5-phase-3--platform-automation)
6. [Phase 4 — Image Health Monitoring](#6-phase-4--image-health-monitoring)
7. [Phase 5 — Agency / Enterprise](#7-phase-5--agency--enterprise)
8. [Email Reference — All Templates](#8-email-reference--all-templates)

---

## 1. Before You Write Code — Decisions

These choices affect every phase. Getting them wrong costs more to fix later than getting them right now.

### Database

**Recommendation: PostgreSQL**

You have 20+ related entities, complex audit queries, and need JSON columns for flexible image metadata. PostgreSQL handles all of it. Do not use SQLite in production.

| Option | Notes |
|---|---|
| **PostgreSQL** ✓ | Recommended |
| MySQL | Works, but fewer JSON features |
| PlanetScale | Serverless MySQL — viable but adds constraints |

### ORM / Query Layer

**Recommendation: Prisma or Drizzle**

Prisma has excellent migration tooling and a type-safe client. Drizzle is lighter and closer to raw SQL. Pick one and commit to its migration workflow from day one.

| Option | Notes |
|---|---|
| **Prisma** ✓ | Most popular, great migrations, strong DX |
| **Drizzle** ✓ | Lighter, closer to SQL, excellent type safety |
| TypeORM | Mature but heavier |
| Knex | Query builder, not a full ORM |

### Background Queue

**Recommendation: BullMQ + Redis, or pg-boss**

Crawling and image analysis must never run inside a web request. BullMQ + Redis is the most capable option. pg-boss runs on Postgres — no Redis required.

| Option | Notes |
|---|---|
| **BullMQ + Redis** ✓ | Mature, supports priorities, concurrency, retries, rate limiting |
| **pg-boss** ✓ | Postgres-native — simpler infra, no Redis dependency |
| Inngest | Cloud-based, good DX, adds vendor dependency |
| Trigger.dev | Similar to Inngest |

### Crawling Approach

**Recommendation: HTTP + Cheerio for MVP**

HTTP + Cheerio is fast and cheap but misses JavaScript-rendered images. Puppeteer/Playwright sees everything but is slower and more expensive at scale. Start with HTTP, document the limitation, and add a headless-browser option as a premium scan tier later.

| Option | Notes |
|---|---|
| **Cheerio + Axios** ✓ | MVP recommendation — fast, cheap, misses JS-rendered content |
| Puppeteer | Sees JS-rendered images, slower, more resource-intensive |
| Playwright | Same trade-offs as Puppeteer, more modern API |
| Crawlee | Wraps Puppeteer/Playwright with crawl management utilities |

### Image Processing

**Recommendation: Sharp**

Sharp handles WebP conversion, resizing, quality optimization, and can probe image dimensions without full decoding. It is fast, runs as a native binary, and is the Node.js standard for image work.

### Authentication

**Recommendation: Custom JWT/Session or Clerk**

For MVP, a simple email/password + JWT or session setup is sufficient and costs nothing. Clerk is excellent DX if you prefer to pay to move faster on auth. Do not roll custom password hashing — use bcrypt.

| Option | Notes |
|---|---|
| **Custom JWT / Session** ✓ | Full control, zero cost |
| **Clerk** ✓ | Hosted auth, faster to build, per-user cost |
| NextAuth / Auth.js | Good if using Next.js |
| Lucia | Lightweight session library |

### File Storage

**Recommendation: Cloudflare R2**

R2 is S3-compatible with zero egress fees — excellent for serving optimized images. AWS S3 has the broadest ecosystem. Backblaze B2 is cheapest at scale.

| Option | Notes |
|---|---|
| **Cloudflare R2** ✓ | Zero egress fees, S3-compatible API |
| AWS S3 | Broadest ecosystem, egress costs at scale |
| Backblaze B2 | Cheapest storage, S3-compatible |

### Report Delivery / PDF Generation

**Recommendation: Puppeteer (HTML → PDF)**

The simplest approach: render your HTML audit report as a PDF with Puppeteer. You already built the report in HTML — this gives you a perfect visual match with no duplicate layout work.

### Hosting

**Recommendation: Railway or Render**

Both support web + worker processes (critical for queue workers) with easy PostgreSQL and Redis add-ons. Do not deploy on a platform that cannot run persistent background workers.

| Option | Notes |
|---|---|
| **Railway** ✓ | Easy setup, supports multi-process, good add-ons |
| **Render** ✓ | Similar to Railway, slightly more mature |
| Fly.io | More control, better for containers |
| AWS ECS | Appropriate at later scale |

---

## 2. Cross-Phase Infrastructure

These services don't belong to one phase — they support all of them. Design the integration points before you need them.

### 📧 Transactional Email
**Required: Phase 1**

Audit delivery, project updates, monitoring alerts, payment receipts. Set up a sending domain with DKIM, SPF, and DMARC before sending the first report. Use a dedicated subdomain (e.g., `mail.builttobebetter.com`). Email reputation takes time to build — start early.

**Provider options:** Resend · Postmark · SendGrid · AWS SES

### ⚡ Background Queue
**Required: Phase 1**

Every crawl, image analysis, report generation, and monitoring scan is a background job. Job states — `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `RETRYING`, `CANCELLED` — must be stored and visible in the admin dashboard, not in server logs.

### 🗄️ File Storage
**Required: Phase 2**

Original image files, optimized files, PDF reports, and CSV exports all need durable object storage. Define the folder structure before Phase 2. Originals must never be in a publicly accessible bucket.

### 💳 Stripe
**Phase 2 (payments) · Phase 4 (subscriptions)**

Set up the Stripe account, webhook endpoint, and test mode at Phase 2. All webhook handlers must be idempotent from the start — Stripe delivers webhooks at-least-once.

### 🔐 Credential Vault
**Required: Phase 2–3**

WordPress logins, SFTP credentials, and hosting API keys must never be stored as plain text in the database. AES-256 encryption at rest, role-scoped access, never logged, never in customer reports. Design the vault interface before Phase 3 automation depends on it.

### 🔭 Error Tracking & Observability
**Recommended: Phase 1**

Sentry covers Phase 1 needs on its free tier. Every failed crawl job needs a structured error: domain, job ID, error type, and a clear action for the operator. Operators must understand why something failed — not just that it did.

---

## 3. Phase 1 — Sales Engine (MVP)

**Prerequisite:** None — build this first
**Goal:** A salesperson can walk out of the system with a report and a prospect.

Everything in Phase 1 exists to answer one question: *"Is there a project worth selling here?"*

### Domain Intake

- **Public submission form** — URL, name, email, company, authorization acknowledgment
- **Internal intake** — admin adds a domain directly, no external form required
- **URL normalization** — strip trailing slashes, resolve www vs. non-www, enforce HTTPS
- **Duplicate detection** — warn if domain already exists in the system
- **Domain → Prospect association** — link to account or prospect record
- **Authorization source recorded** — who submitted, when, what they agreed to

> ⚠️ **URL normalization edge cases:** www vs. non-www, http vs. https, trailing slashes, query parameters, fragment identifiers, and canonical redirects all create duplicate page problems. Test with at least ten real domains before considering this reliable.

### Crawling Engine

- **Page discovery** — follow internal links, find public pages
- **Sitemap detection** — parse `sitemap.xml` if present
- **robots.txt compliance** — respect Disallow directives
- **Configurable limits stored in DB** — max pages discovered, max pages analyzed, crawl depth, concurrency, timeout, retries. Never hardcode these in application logic.
- **Canonical URL deduplication** — normalize before storing
- **Pages discovered vs. analyzed stored separately** — this distinction cannot be conflated
- **Crawl job states** — `QUEUED` → `RUNNING` → `COMPLETED` / `FAILED` / `RETRYING`

> ⚠️ **Rate limiting:** Crawl politely. Add configurable delays between requests. An automotive site can have 50,000+ pages — hammering it without limits risks getting blocked and damaging the relationship with a prospect before they know you exist.

> ⚠️ **Large-site crawl limits are not optional:** Configure them before the first production crawl. One large ecommerce site with no limits can consume all worker capacity and potentially fill the database. Make limits a first-class admin setting from day one.

> ⚠️ **JS-rendered images:** A plain HTTP fetch will not see images injected by JavaScript. This is a real limitation for React, Vue, and many modern inventory systems. Accept it, document it in the audit methodology for MVP, and add a headless-browser option later as a premium scan tier.

### Image Analysis Engine

- **Per-image data collected** — URL, source page, domain, MIME type, file extension
- **File size measurement** — HEAD request + `Content-Length` header
- **Dimensions** — width and height via Sharp probe (no full decode required)
- **First-party vs. third-party classification** — compare image hostname to crawled domain
- **Existing WebP / AVIF detection** — record current format, not just file extension
- **Conversion eligibility flag** — is this image a candidate?
- **Estimated savings calculation** — bytes saved, percentage, projected full-site estimate
- **Images discovered vs. images analyzed stored separately**

> Critical: Never count third-party-hosted images as part of the controllable opportunity.

### Opportunity Scoring

- **Score 0–100** — composite of weighted inputs
- **Scoring inputs** — image volume, legacy format %, current payload, estimated reduction %, oversized asset ratio, first-party control %, site scale, repeat image activity
- **All weights stored in DB** — configurable from the admin panel, never hardcoded
- **Tier classification** — Healthy (0–30) / Moderate (31–60) / High (61–80) / Very High (81–100)
- **Tier thresholds configurable** — stored in DB, not baked into application code

### Customer-Facing Audit Report

- **Executive summary** — opportunity score and one-line verdict
- **Scan scope** — pages discovered vs. analyzed, clearly labeled
- **Image inventory** — format breakdown, first-party vs. third-party
- **Payload analysis** — current weight, estimated optimized payload, potential savings
- **Biggest opportunities** — largest individual assets
- **Recommended next step** — sales CTA at the bottom of every report
- **Methodology disclaimer** — every estimate labeled as estimated; every measurement labeled as measured
- **Shareable URL** — not email-only; linkable from any device

### Admin Dashboard & Sales Pipeline

- **Domain list** — audit status, opportunity score, sales state, assigned salesperson
- **Crawl job monitor** — queue depth, running, failed — displayed in the UI, not server logs
- **Failure surface** — every failed job shows the domain, error reason, and a retry option
- **Sales state machine** — New Domain → Audit Complete → Qualified → Report Sent → Review Scheduled → Proposal Sent → Won / Lost
- **Prospect assignment** — assign domain to salesperson
- **Audit history per domain** — never overwrite; always append
- **Internal campaigns** — group prospecting domains (e.g., "Texas Auto Dealers Q3")
- **CSV export**

### Phase 1 — Integrations

#### 📧 Transactional Email — Required in Phase 1

Email is required in Phase 1 for audit report delivery. Set up a sending domain with DKIM and SPF before sending the first report.

**Providers:** Resend · Postmark · SendGrid · AWS SES
**Recommendation:** Resend (modern API, generous free tier) or Postmark (deliverability reputation)

Templates required at Phase 1:

| Template | Purpose |
|---|---|
| Audit Submitted | Acknowledge receipt, set timing expectations |
| Audit Complete + Report Link | Primary delivery — link to hosted report |
| Internal Sales Alert | Notify assigned salesperson when a High or Very High score audit completes |

#### ⚡ Background Queue — Required Before First Crawl

Every crawl, image analysis, and report generation is a background job. If Redis feels like extra infrastructure, pg-boss runs entirely on your Postgres database.

Job types needed in Phase 1:

| Job Type | Purpose |
|---|---|
| `DOMAIN_DISCOVERY` | Kick off crawl, find pages |
| `PAGE_CRAWL` | Fetch and analyze a single page |
| `IMAGE_FETCH` | Retrieve image metadata |
| `IMAGE_ANALYSIS` | Calculate eligibility, size estimates |
| `SAVINGS_CALCULATION` | Compute opportunity score |
| `REPORT_GENERATION` | Build and store the report |

---

## 4. Phase 2 — Fulfillment System

**Prerequisite:** Phase 1 generating paid projects
**Goal:** Support the optimization project from approval through delivery. Every original asset preserved. Every replacement traceable. Before/after proof generated automatically.

Build Phase 2 after Phase 1 audits are generating paying projects. The goal is to support the work operationally — not automate it. Human technicians still perform platform-specific replacements.

### Optimization Project Management

- **Create project from approved audit** — linked to audit, prospect, and proposal records
- **Project states** — `Created` → `Access Verified` → `Pre-Scan` → `Backup` → `Assets Collected` → `Optimized` → `Quality Review` → `Implementation` → `Site QA` → `Post-Scan` → `Results` → `Report` → `Closed`
- **Three fulfillment modes:**
  - **Direct** — we perform the replacements
  - **Assisted** — we provide optimized files and an implementation map to the customer's team
  - **Third-party limited** — asset is controlled by an outside system, documented as out of scope
- **Track implementer and approver** — who did what, and when
- **Project-level access control** — technicians see only assigned projects

### Pre-Optimization Baseline

- **Run a fresh scan before any changes** — this is what "before" means in the before/after report
- **Baseline metrics stored** — total payload, asset count, average file size, largest image, legacy format count
- **Linked to the project, not the original sales audit** — the sales audit may be weeks old
- **Baseline is immutable** — never updated once stored; it is the permanent reference point

### Asset Collection & Management

- **Download first-party images** — store originals before touching anything on the live site
- **File storage structure** — organized by project, originals and optimized clearly separated
- **Generate optimized versions** — WebP, quality-optimized, resized where oversized
- **Implementation map** — which original URL maps to which replacement file
- **Per-asset approval** — technician reviews quality before any file enters the deployment queue

### Replacement Tracking & Rollback

- **Every replacement logged** — original URL, replacement URL, timestamp, project ID, performed by, approved by
- **Rollback record** — the path back to the original for every changed asset
- **Full project rollback** — restore all originals if something goes badly wrong
- **QA checklist per project** — confirm visual integrity before marking the project complete

> 🔴 **Always store the original before any replacement.** This is not optional. No production asset is modified without the original safely preserved in file storage first. The recovery path is a requirement, not a nice-to-have.

> ⚠️ **Image quality review is not optional.** WebP compression artifacts are real. Build a human review step where a technician approves optimized files before they go into the implementation map. Never ship to a customer's live site without this gate.

### Post-Optimization Proof

- **Post-scan after implementation** — re-crawl and measure the live site
- **Comparison engine** — before baseline vs. post-scan results
- **Calculated improvements** — bytes removed, percentage reduction, assets converted, payload delta
- **Before/after report** — customer-deliverable, not just internal data
- **Remaining issues flagged** — what was not touched and why (third-party, out of scope)

### Phase 2 — Integrations

#### 💳 Stripe — One-Time Payments

Phase 2 is when you first collect money in-system. Stripe Checkout or Payment Links are the fastest path — a full in-app billing UI is not required to start. Set up the webhook endpoint now; you will need it for subscriptions in Phase 4.

> ⚠️ **The first few projects don't need in-app Stripe billing.** A Stripe Payment Link sent via email is fine. Get the project workflow working first, then build the in-app payment flow after running a few real projects through it.

**Setup steps:**
- Create a Stripe customer when an account is created — store `stripe_customer_id` on the Account entity
- Project invoice → Stripe Checkout session or Payment Link
- Store `stripe_payment_intent_id` on every project

**Webhook to handle:**

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Mark project as paid, release to production |

#### 🗄️ File Storage — Define the Structure Before the First File

Originals must never be in a publicly accessible bucket. Optimized files can be served from a CDN-backed public bucket.

```
/accounts/{account_id}/projects/{project_id}/originals/
/accounts/{account_id}/projects/{project_id}/optimized/
/accounts/{account_id}/reports/{audit_id}.pdf
```

**Providers:** Cloudflare R2 (recommended) · AWS S3 · Backblaze B2

#### 🔐 Credential Vault

Needed when technicians require WordPress logins, SFTP, or hosting API keys to perform replacements. Build the vault interface in Phase 2 — the data model must support it before Phase 3 automation depends on it.

- AES-256 encryption at rest — never plain text in the database
- Scoped to project or domain — not globally accessible
- Role-restricted — only assigned technicians can decrypt
- Never logged, never in reports, never in error messages
- Expiration and rotation support built in from the start

---

## 5. Phase 3 — Platform Automation

**Prerequisite:** 10–25 completed manual projects
**Goal:** Automate the most common replacement workflows based on what the first real projects actually revealed — not assumptions.

> 🔴 **Do not build Phase 3 before Phase 1 is generating paying projects.** The automation targets you think you need and the ones real projects actually need are often different. Let manual projects show you where automation pays.

### Platform Detection

- **Detect CMS from crawl data** — response headers, `<meta name="generator">` tags, HTML signatures, cookie names
- **Store platform classification per domain** — not per scan; update if the platform changes
- **Platforms to detect** — WordPress, WooCommerce, Shopify, Webflow, Squarespace, Wix, Drupal, custom
- **Confidence level** — detected with certainty / likely / unknown
- **CDN detection** — Cloudflare, Fastly, AWS CloudFront, KeyCDN — affects the replacement approach

### WordPress / WooCommerce

- **WordPress REST API** — read and update media library entries
- **WP-CLI** — direct CLI operations when server access is available
- **Media library replacement** — update attachment file and metadata
- **Post content references** — update `img src` values in post bodies
- **Cache purging** — Cloudflare, WP Super Cache, W3 Total Cache, LiteSpeed, Nginx FastCGI
- **WooCommerce product images** — API-based replacement with size regeneration

> ⚠️ **WordPress caching is a major source of implementation failures.** Each caching system behaves differently. An automated replacement that doesn't purge the right cache will appear to have failed even when it succeeded. Test explicitly against each cache plugin.

### Shopify & Other Platforms

- **Shopify Admin API** — product image upload, replacement, deletion
- **Shopify theme assets** — logo, banners, background images in theme files
- **Rate limit handling** — Shopify API bucket rate limits require retry-with-backoff logic
- **Rollback via API** — re-upload the original if a replacement causes visual issues
- **Other platforms** — prioritize based on which platforms appeared in real projects, not prior assumptions

> ⚠️ **Automated rollback depends on clean Phase 2 records.** If the replacement logs built in Phase 2 are complete and accurate, automated rollback is straightforward. If they are not, it is dangerous. Phase 2 quality gates matter here.

---

## 6. Phase 4 — Image Health Monitoring

**Prerequisite:** Phase 2 completed projects
**Goal:** Periodically rescan completed projects, detect new issues, and deliver recurring reports. This is the recurring revenue model.

### Scheduled Scan Engine

- **Cron-triggered monitoring scans** — monthly or quarterly per account preference
- **Monitoring Scan entity** — separate from the Audit entity; linked to the project baseline
- **Never overwrite previous scans** — each scan is a new record; the history is the product
- **Scan scope mirrors original project scope** — same pages, same limits
- **Job queue integration** — `MONITOR_SCAN` job type, same states as crawl jobs

### Comparison Engine

- **Current scan vs. last scan** — detect additions, removals, and changes
- **New images detected** — how many, in what formats
- **New legacy-format images** — JPG/PNG added since the last scan
- **Previously optimized images reverted** — CMS reset or CDN issue
- **New estimated payload waste** — measured in bytes, not just image counts
- **Image health score** — recalculated each scan, stored with full trend history

### Alerts & Reports

- **Alert triggers** — new legacy images above threshold, payload spike, regression detected
- **Alert delivery** — email and admin dashboard notification
- **Monthly/quarterly digest report** — "264 new images — 231 healthy, 33 need attention"
- **Health trend visualization** — image count, payload, score over time
- **Thresholds configurable per domain** — stored in DB, never hardcoded
- **Recommendation engine** — surface remediation options when issues are found

### Phase 4 — Stripe Subscriptions

#### What to Build

- Stripe Products + Prices for each monitoring plan (monthly, quarterly)
- Stripe Customer per account — create at account setup, store `stripe_customer_id`
- Stripe Checkout session for subscription signup
- Stripe Customer Portal for self-service plan management and cancellation
- Store per subscription: `stripe_subscription_id`, `stripe_price_id`, `current_period_end`, `status`

#### Webhooks to Handle

| Event | Action |
|---|---|
| `invoice.paid` | Extend monitoring period, queue next scheduled scan |
| `invoice.payment_failed` | Send dunning email, start grace period |
| `customer.subscription.deleted` | Disable monitoring, retain all historical scan data |
| `customer.subscription.updated` | Handle plan changes and proration |

> 🔴 **All webhook handlers must be idempotent.** Stripe delivers webhooks at-least-once, not exactly-once. If `invoice.paid` fires twice, the system must handle it without double-crediting the subscription period.

> ⚠️ **Define a failed-payment policy before launch.** What happens to monitoring scans during a grace period — are they paused, run but not delivered? This decision affects customer trust significantly and needs to be decided before subscriptions go live.

> ⚠️ **Monitoring Scan and Audit are related but distinct entities.** A Monitoring Scan compares against a baseline. An Audit is a first-look analysis. Do not merge them in the data model — you will regret it when generating trend data.

### Phase 4 — Email Templates

| Template | Trigger | Notes |
|---|---|---|
| Monitoring Digest | Monthly / quarterly | Health summary, new issues, score trend, next steps |
| New Issues Detected | Alert threshold crossed | New legacy images or payload spike |
| Regression Detected | Optimized image reverted | Requires immediate attention |
| Payment Failed | `invoice.payment_failed` | Dunning: 1 day, 3 days, 7 days before cancellation |
| Subscription Renewal | Upcoming renewal | Include value summary for the period |
| Quarterly Report | Quarterly | Full trend report with baseline comparison |

---

## 7. Phase 5 — Agency / Enterprise

**Prerequisite:** Proven Phase 4 model, recurring revenue established
**Goal:** Turn Built to Be Better into infrastructure that agencies distribute to their own clients.

One agency with 100 clients is more valuable than 100 individual clients.

### Multi-Account / Organizations

- **Organization entity** — the agency account
- **Subaccounts** — the agency's individual clients
- **Role: Agency** — sees all subaccount domains, audits, and projects
- **Role: Agency Technician** — technical access limited to that agency's clients
- **Role: Read-Only Stakeholder** — report access only
- **Agency dashboard** — all clients in one view, sorted by opportunity score

> ⚠️ **Multi-tenancy data isolation is critical.** Agency A must never be able to see Agency B's clients, audits, or reports. Build and test this at the data layer — not just the UI — before opening agency accounts.

### White-Label Reports

- **Agency branding** — logo, colors, agency name on all reports
- **Built to Be Better branding** — configurable per agency (shown or hidden)
- **Custom sending domain** — reports delivered from the agency's email domain
- **Branded report URL** — optional custom domain support

### Bulk Domain Import & Campaigns

- **CSV import** — domains, vertical classification, assigned contact
- **Campaign grouping** — e.g., "Texas Auto Dealers Q3"
- **Batch audit triggering** — queue all imported domains at once
- **Bulk opportunity ranking** — sorted results across all imported domains
- **Campaign-level reporting** — aggregate scores and conversion stats

### API Access

- **REST API** — submit domains, retrieve audit results, get opportunity scores
- **API keys per organization** — not user-level
- **Rate limiting** — per key, configurable per plan tier
- **Webhook delivery** — audit complete, score change, monitoring alert
- **OpenAPI / Swagger docs** — machine-readable specification
- **Partner pricing tiers** — configurable from admin, never hardcoded

> ⚠️ **API rate limiting must be built before the API is public.** An agency with automation can submit thousands of domains at once. Rate limits protect infrastructure and prevent one account from consuming all crawl capacity.

---

## 8. Email Reference — All Templates

Set up your email provider and sending domain before Phase 1 goes live. DKIM, SPF, and DMARC need time to propagate and build reputation. Do not send audit reports from a domain with no email history.

**Providers:** Resend · Postmark · SendGrid · AWS SES

| Phase | Template | Trigger | Notes |
|---|---|---|---|
| Phase 1 | Audit Submitted | Domain submitted | Acknowledge receipt, set timing expectations |
| Phase 1 | Audit Complete — Report Link | Audit finishes | Primary delivery. Opportunity score in subject line. |
| Phase 1 | Internal Sales Alert | High / Very High score | Notify assigned salesperson immediately |
| Phase 2 | Project Update | Key state changes | Implementation started, QA, complete |
| Phase 2 | Before/After Report Ready | Post-scan complete | Deliver proof report to customer |
| Phase 2 | Invoice / Payment Request | Project approved | Stripe-generated or custom link |
| Phase 4 | Monitoring Digest | Monthly / quarterly | Health summary, new issues, score trend |
| Phase 4 | New Issue Detected | Threshold crossed | New legacy images or payload spike |
| Phase 4 | Regression Alert | Optimized image reverted | Immediate attention required |
| Phase 4 | Payment Failed | `invoice.payment_failed` | Dunning: 1 day, 3 days, 7 days |
| Phase 4 | Subscription Renewal | Upcoming renewal | Value summary makes renewal feel earned |
| Phase 5 | Agency Campaign Complete | Batch audit finishes | Summary of domains scored, top opportunities |

---

## The Only Rule That Matters

> **Does this feature help us find a prospect, prove the opportunity, sell the project, or complete it?**

If yes — it belongs in the current phase. If no — it belongs in a later phase or not at all.

Get the audit and sales engine generating paying projects before investing in automation. Let the first 10–25 paying projects teach you what fulfillment actually needs. The database built by operating the business becomes the long-term competitive advantage.

**Build Phase 1. Run real domains. Sell from the findings.**

---

*Built to Be Better · Development Roadmap · Internal Document · 2026*
*See also: [architecture.html](architecture.html) · [roadmap.html](roadmap.html)*
