# SalesAsist – Product & Technical Specification

**Version:** 1.0  
**Status:** Draft for review  
**Project:** SalesAsist (service company dashboard + rep briefing)

---

## 1. Vision & Goals

SalesAsist is a **multi-tenant** dashboard and briefing system for service companies that use **ServiceTitan**. It:

1. **Pulls customer and job data** from ServiceTitan (customers, jobs, assigned rep, appointments).
2. **Enriches each customer** with web- and AI-sourced data in three categories: **Personal**, **Family**, **Home**.
3. **Generates tips and sales ideas** (upsells, add-ons, talking points) for the field sales rep based on that profile and **job type** (e.g. HVAC vs plumbing).
4. **Delivers the briefing** to the rep before/during the visit via **SMS** (Twilio). In-app delivery to the rep is a later phase.

The system knows **who the customer is** and **who the sales rep is** (from ServiceTitan) and sends the right briefing to the right rep. **ServiceTitan API access** is assumed to be available during implementation; design supports plug-in when credentials are ready (and optional mock/sandbox for development).

---

## 2. Users & Roles

| Role | Description | Primary use |
|------|-------------|-------------|
| **Platform admin (super admin)** | SalesAsist operator; separate login, restricted UI | See all tenants, approve/activate company signups, troubleshoot, usage view. |
| **Company admin** | Single admin per company (one login per tenant) | Connect ServiceTitan, configure enrichment/delivery, view dashboard, trigger sync/send. |
| **Sales rep (field)** | Technician/rep assigned to jobs in ServiceTitan | Receives SMS briefings before visiting the customer. No login to SalesAsist in v1. |
| **System** | Automated pipelines | Hourly sync from ServiceTitan; enrichment; tips generation; send SMS. |

---

## 3. Tenancy & Onboarding

- **Multi-tenant from the start:** One app, many companies; each company has its own admin, ServiceTitan connection, and data isolated by tenant.
- **Onboarding:** **Hybrid.** Companies can sign up (e.g. landing page); platform admin **approves/activates** the tenant before they get full access. No self-serve go-live without approval.

---

## 4. Data Model (Conceptual)

### 4.1 Source of truth: ServiceTitan

- **Customers** – Id, name, address, phone, email, and any other fields we sync.
- **Jobs / appointments** – Job id, customer id, **job type/category** (e.g. HVAC, plumbing), scheduled time, status.
- **Assigned rep (technician)** – Rep id, name, **phone** (preferred from ServiceTitan; admin can set or override in dashboard when missing).

### 4.2 SalesAsist-enriched data (stored in our DB, current state only)

- **Customer profile (enriched)**  
  - **Personal:** profession, interests, age range, etc.  
  - **Family:** household, life stage, family-related signals.  
  - **Home:** property type, age of home, prior work, relevant home attributes.  
  - Metadata: last enriched at, source summary (no unnecessary raw PII from third parties).

- **Briefing**  
  - Customer id, job id, rep id, job type.  
  - Generated tips and sales ideas (text).  
  - Delivery status: created, sent via SMS, failed.  
  - Timestamps (current state; no history retention requirement).

### 4.3 Sync & retention

- **Sync frequency:** Every **1 hour**. Each sync updates data; no requirement to keep history of previous states.
- **Data:** Current state only; overwrite/update on each sync. No historical versions of profiles or briefings required.

### 4.4 Rep identity & phone

- **Rep identity:** ServiceTitan technician id is the canonical rep id.  
- **Rep phone:** Prefer **ServiceTitan** when API provides it; otherwise **admin can set or override** in the dashboard for SMS delivery.

---

## 5. Functional Requirements

### 5.1 ServiceTitan integration

- **FR-ST-1** Authenticate with ServiceTitan (OAuth or API keys per their API; **integration when API access is available**).
- **FR-ST-2** Sync or fetch **customers** (list/detail) for the dashboard and enrichment.
- **FR-ST-3** Sync or fetch **jobs/appointments** (e.g. by date range or job id), including **job type/category**.
- **FR-ST-4** For each job, obtain **assigned technician (rep)** and rep **phone** when available.
- **FR-ST-5** **Hourly sync** (scheduled); data updated each run. Optional manual “Sync now” from dashboard.

### 5.2 Enrichment pipeline

- **FR-EN-1** For a given customer (name, address, etc.), run an enrichment pipeline.
- **FR-EN-2** Populate **Personal Data** from allowed web/AI sources (sources **flexible**: AI-only or dedicated APIs; decide when building).
- **FR-EN-3** Populate **Family Data** from allowed sources.
- **FR-EN-4** Populate **Home Data** from allowed sources.
- **FR-EN-5** Store enrichment results in our DB (current state); timestamps and minimal source attribution.
- **FR-EN-6** Support manual “Enrich this customer” and, later, automatic enrichment when job is created/assigned.

### 5.3 Tips & sales ideas (AI)

- **FR-TIP-1** Generate briefing (tips + sales ideas) from: **enriched profile (Personal, Family, Home) + job type** (e.g. HVAC vs plumbing) so tips are **tailored**.
- **FR-TIP-2** Output consumable in under a minute (bullets, short paragraphs).
- **FR-TIP-3** Include: what to offer (extras, add-ons), how to position, 1–3 conversation starters or tactics.
- **FR-TIP-4** Use **Anthropic (Claude)** for generation; design for their API.
- **FR-TIP-5** Store generated briefing linked to customer id, job id, rep id.

### 5.4 Delivery to rep (SMS)

- **FR-DL-1** Deliver briefing to the **assigned rep** for that job.
- **FR-DL-2** **SMS** delivery via **Twilio** to rep’s phone (from ServiceTitan or admin override).
- **FR-DL-3** **v1: Manual** — admin triggers “Send briefing to rep” from dashboard. **Later:** automatic when job is scheduled/assigned (configurable toggle).
- **FR-DL-4** Record delivery status (sent, failed, channel).

*In-app delivery to rep is a **later phase**; not in v1 scope.*

### 5.5 Dashboard (company admin)

- **FR-DB-1** Connect and disconnect ServiceTitan (credentials stored securely).
- **FR-DB-2** View list of **customers** (from ServiceTitan; filter/search).
- **FR-DB-3** Select a customer; view **enriched profile** (Personal, Family, Home) and last enriched time.
- **FR-DB-4** View **jobs/appointments** (e.g. today/this week) with customer, assigned rep, **job type**.
- **FR-DB-5** For a selected job, view **generated tips/sales ideas** and trigger **Send to rep** (SMS).
- **FR-DB-6** (Optional) View delivery status for recent briefings.
- **FR-DB-7** Set or override **rep phone number** when not provided by ServiceTitan.

### 5.6 Platform admin (super admin)

- **FR-PA-1** Separate login and restricted UI for platform admin.
- **FR-PA-2** View all tenants (companies); approve/activate signups.
- **FR-PA-3** Support/troubleshoot (e.g. view usage or tenant status).

---

## 6. Non-Functional Requirements

- **NFR-1 Security:** ServiceTitan and Twilio (and other) credentials stored securely (env/secrets); no secrets in frontend.
- **NFR-2 Privacy & compliance:** Enrichment and storage designed for disclosure and consent where required (e.g. CCPA/GDPR); avoid storing unnecessary PII from third-party sources.
- **NFR-3 Availability:** Dashboard and sync/send flows reliable; SMS via Twilio with retries.
- **NFR-4 Performance:** Enrichment and AI can be asynchronous; dashboard remains responsive (e.g. background jobs).
- **NFR-5 Audit:** Log sync, enrich, generate, and send events for debugging and compliance.

---

## 7. External Systems & APIs

| System | Purpose | Notes |
|--------|--------|------|
| **ServiceTitan** | Customers, jobs, job type, reps, appointments, rep phone | Primary source; **API when available**; OAuth or API key per their docs. |
| **Twilio** | Send briefing SMS to rep’s phone | Design for Twilio API. |
| **Web/AI for enrichment** | Personal, Family, Home data | **Flexible**: AI-only or dedicated APIs; choose when building. |
| **Anthropic (Claude)** | Generate tips and sales ideas from profile + job type | Design for Claude API. |

---

## 8. Architecture (High Level)

```
[ ServiceTitan ]  -->  [ SalesAsist API ]  <-->  [ SalesAsist DB ]
       (hourly sync)         |                        (per-tenant, current state)
                             |
       +---------------------+---------------------+
       |                     |                     |
  [ Enrichment ]        [ Tips AI ]           [ Delivery ]
  (Web/AI; flexible)   (Claude)               (Twilio SMS)
       |                     |                     |
       +---------------------+---------------------+
                             |
              [ Dashboard: Company Admin ]
              [ Platform Admin UI ]
```

- **SalesAsist API:** Backend (Express + Prisma); multi-tenant; ServiceTitan sync (hourly), enrichment, Claude tips, Twilio SMS, dashboard and platform-admin APIs.
- **SalesAsist DB:** Tenants, company admins, platform admins; synced customers/jobs/reps; enriched profiles; briefings; delivery status. Current state only; no history retention.
- **Dashboard:** React app — company admin flow and (separate) platform admin flow.

---

## 9. Phased Implementation (Reference for Build Order)

| Phase | Scope | Outcome |
|-------|--------|--------|
| **1. Multi-tenant + auth** | Tenants, company admin (1 per tenant), platform admin; signup + approval flow | Companies can sign up; platform admin approves; company admin logs in. |
| **2. ServiceTitan + dashboard** | Connect ST (when available); fetch customers, jobs (with job type), assigned rep; show in dashboard | Admin sees ServiceTitan data in SalesAsist. |
| **3. Rep phone** | Prefer ST; admin override in dashboard | Ready for SMS. |
| **4. Enrichment (one category)** | e.g. Home; flexible source; store in DB | One category visible in dashboard. |
| **5. Enrichment (all three)** | Personal, Family, Home; pipeline and storage | Full enriched profile per customer. |
| **6. Tips generation** | Claude: profile + job type → tips; store briefing | Briefing visible in dashboard. |
| **7. Delivery – SMS** | Twilio; “Send to rep” sends SMS to rep phone | Rep receives briefing by SMS. |
| **8. Hourly sync** | Scheduled job; update customers/jobs/reps every 1 hour | Data stays current. |
| **9. Automation (optional)** | Auto enrich + generate + send when job assigned; configurable | Briefing sent automatically. |
| **10. In-app for rep (later)** | Rep app or in-app view | Rep can open briefing in app. |

All code generation and design decisions should reference this specification and the chosen phase.

---

## 10. Glossary

- **Customer:** The ServiceTitan customer (homeowner or business) for a job.
- **Rep (sales rep):** The ServiceTitan technician/field rep assigned to the job; receives SMS briefing.
- **Job type:** ServiceTitan category for the job (e.g. HVAC, plumbing); used to tailor tips.
- **Enrichment:** Web/AI-sourced data about the customer in Personal, Family, Home.
- **Briefing:** Generated tips and sales ideas for the rep for a specific customer/job.
- **Delivery:** Sending the briefing to the rep via SMS (Twilio). In-app is later.
- **Tenant:** A service company (one org); has one company admin, its own ST connection and data.
- **Platform admin:** SalesAsist operator role; manages tenants and approvals.

---

## 11. Document History

| Version | Date | Changes |
|---------|------|--------|
| 1.0 | 2026-02-16 | Initial spec with finetuned decisions: multi-tenant, single company admin, SMS only (Twilio), Claude, hourly sync/no history, platform admin in-app, hybrid onboarding, job-type tailoring, rep phone from ST + override. |

---

**End of specification.**
