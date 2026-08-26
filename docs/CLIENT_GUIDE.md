# Fly Masters — Client Guide

**How the platform works (public website + AI counselor + student/counselor/admin dashboards + travel agency)**

This document explains the Fly Masters system in plain language so you can walk a client through what it does, how the pieces connect, and what happens at each step. It is based on a complete reading of the current codebase, not marketing copy alone.

---

## 1. What is Fly Masters?

Fly Masters is an **AI-powered study-abroad consultancy platform** with an attached **travel agency**. The same codebase uses three names:

| Name | Where it appears |
|------|------------------|
| **Fly Masters** | Homepage, SEO, chat greeting, travel (“Fly Masters Travels”), default branding, emails `@flymasters.in` |
| **Fly AI Pathfinder** | Login screen, dashboard heading, PWA full name |
| **FlyMasters** | Mobile header, PWA short name, OTP SMS sender text |

Use **Fly Masters** with clients. One product serves these audiences:

| Experience | Who uses it | Purpose |
|------------|-------------|---------|
| **Public website** | Prospective students and families | Brand, services, country guides, university search, travel packages, AI chat |
| **University Advisor AI** | Visitors (no login required) | Guided conversation that qualifies the student and creates a lead |
| **Student Portal** | Enrolled students | Profile, shortlists, documents, applications, counselor chat |
| **Counselor Dashboard** | Education counselors | Assigned leads, follow-ups, university shortlisting, attendance/leave/salary |
| **Admin Panel** | Admins and Super Admins | Users, leads, documents, CMS, marketing, university outreach, travel operations, HR |

**Key selling point:** A visitor chats with the AI advisor. When the profile is complete, a **student lead is created automatically**, an **active counselor is assigned**, and **admins/counselors are notified** — without a manual form import.

---

## 2. System architecture (big picture)

```
┌──────────────────────────┐     ┌──────────────────────────────┐
│  Public Website + Chat   │     │  Role-based Dashboards        │
│  (React / Vite / PWA)    │     │  Student | Counselor | Admin  │
└────────────┬─────────────┘     └──────────────┬───────────────┘
             │                                  │
             │         HTTPS / JSON             │
             └────────────────┬─────────────────┘
                              ▼
                ┌─────────────────────────────┐
                │  Supabase                    │
                │  Auth + Postgres + Storage   │
                │  Row Level Security          │
                └──────────────┬──────────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
    │ chat-ai      │  │ send-otp     │  │ get-universities │
    │ (Gemini 2.5) │  │ verify-otp   │  │ reset-password   │
    └──────────────┘  └──────────────┘  └──────────────────┘
```

**In production**, the frontend is a Vite/React single-page app. Backend data, login, and file storage live in **Supabase**. AI counseling runs as a **Supabase Edge Function** calling **Google Gemini 2.5 Flash** through the Lovable AI gateway. Phone verification uses **Twilio SMS**. Travel bookings store Stripe customer/payment IDs in the database, but there is **no Stripe (or other payment) SDK** in the app yet — inquiries are captured, charges are not.

---

## 3. Who the product is for

### 3.1 Four roles

Roles are stored in `user_roles` and resolved by hierarchy (highest wins if a user has more than one):

| Role | Access |
|------|--------|
| **Student** | Student Portal only |
| **Counselor** | Counselor dashboard: leads, students, shortlists, HR self-service |
| **Admin** | Full admin panel (students, content, travel, marketing, HR) |
| **Super Admin** | Same as Admin, plus all permission checks pass |

Default for a new signup with no role row: **student**.

### 3.2 Authentication

- Email + password sign up and sign in (Supabase Auth)
- Email confirmation after registration
- Forgot-password flow (`/auth?type=recovery`)
- Registration can be **turned off** from `system_settings` (`registration_enabled`), with an optional admin phone / WhatsApp / email message shown to visitors
- There is **no Google/social login** in the current auth screen
- After login, every role is sent to `/dashboard`, which then picks the correct layout

---

## 4. The public website

Live routes wired in the app:

| URL | Page |
|-----|------|
| `/` | Marketing homepage |
| `/chat` | University Advisor AI |
| `/universities` | Searchable university + course catalog |
| `/travel` | Travel agency storefront |
| `/destinations/:slug` | Country study guide |
| `/auth` | Sign in / Sign up / Reset password |
| `/dashboard/*` | Authenticated dashboards |
| `/student/*` | Same dashboard entry (student layout) |
| `/admin/*` | Admin panel (also nested under `/dashboard/admin`) |

Homepage navigation: How it Works, Features, Universities, Travel Agency, AI Chat, About.

### 4.1 Homepage sections (in order)

1. **3D hero** — primary brand and call-to-action  
2. **CMS-driven CTA** (`cta_section_1`)  
3. **Feature highlights** — AI matching, global network, chat, verified data, instant results, success tracking  
4. **Stats**  
5. **Services** — loaded from `service_offerings` (CMS)  
6. **Country guides** — study destinations  
7. **Company experience timer**  
8. **Second CTA** (`cta_section_2`)  
9. **Written testimonials**  
10. **Student gallery**  
11. **Founders**  
12. **Video testimonials**  
13. **YouTube videos**  
14. **Chat demo**  
15. **Social links**  
16. **Contact**  
17. **Sticky WhatsApp button** (number and message from `website_content.whatsapp_config`)

Site name, logo, and tagline are **CMS-driven** via `useSiteBranding` / `website_content`.

If the visitor is already logged in, a banner at the top takes them to their dashboard.

### 4.2 University catalog (`/universities`)

- Lists **active** universities ordered by ranking  
- Each university is joined with its **active courses**  
- Filters: search (name, city, course, field), country, degree type, field of study, max budget  
- Course cards show tuition (USD), duration, IELTS/TOEFL, GRE, scholarships, visa sponsorship  
- Tie-up universities are flagged (`is_tie_up`)  
- A chat button is available to continue into the AI advisor

### 4.3 Country guides (`/destinations/:slug`)

Loaded from `countries` plus related tables:

- `country_content` — narrative copy  
- `country_highlights` — key facts  
- `country_courses` — popular programs  
- `country_industries` — job market  
- `country_testimonials` — student quotes  

Inactive countries are hidden.

### 4.4 Pages that exist in code but are **not** in the router

These screens are listed in `nav-items.tsx` but are **not registered** in `App.tsx`, so visiting them today shows the 404 page:

| Intended URL | Page file | Intended purpose | Data status |
|--------------|-----------|------------------|-------------|
| `/courses` | `Courses.tsx` | Standalone course search | Live Supabase |
| `/scholarships` | `Scholarships.tsx` | Scholarship search and apply | Mock data |
| `/community` | `Community.tsx` | Student feed, polls, posts | Mock data |
| `/experts` | `Experts.tsx` | Counselor directory and booking | Mock data |
| `/events` | `Events.tsx` | Webinars / fairs | Mock data |
| `/test-prep` | `TestPrep.tsx` | IELTS/GRE/etc. batches | Live schedules; modules still mock |

Database tables already exist for scholarships, posts, events, and test prep. Wiring `App.tsx` to those URLs would make Courses (and test-prep schedules) usable immediately; the others still need real queries.

---

## 5. The AI counselor journey (core conversion funnel)

This is the product’s main lead engine. It does **not** require login.

### 5.1 What the student sees

Page title: **University Advisor AI**.  
Opening line (from Fly Masters):

> “Hi there! I’m your AI study abroad advisor from Fly Masters… which country would you love to study in?”

The bot asks **one question at a time**, in this fixed order:

| Step | Information collected |
|------|------------------------|
| 1 | Target country |
| 2 | Current / highest qualification (12th, Bachelor’s, Master’s) |
| 3 | Field of study / program interest |
| 4 | Academic score (GPA or percentage) |
| 5 | Budget |
| 6 | Full name |
| 7 | Email |
| 8 | Phone (OTP is mentioned; verification is a separate path) |

When all eight fields are present, the bot thanks the student and the backend **creates a lead**.

### 5.2 What happens behind the scenes

1. A row is created in `chat_sessions` (anonymous `user_id`).  
2. Each user message is sanitized (HTML stripped, max 1,000 characters).  
3. **Gemini 2.5 Flash** extracts structured fields from free text.  
4. The same model generates the next counselor-style reply (under ~80 words).  
5. User and AI messages are stored in `chat_messages`.  
6. Rate limit: **50 messages per session per hour**.  
7. When the profile is complete:
   - Insert into `student_leads` (`lead_source: ai_chat`, `lead_quality: warm`, `status: new`)  
   - First **active counselor** is assigned (`limit 1` — not round-robin or load-balanced)  
   - Budget text is parsed (including “lakh”) into USD min/max  
   - High-priority notifications go to all admins/super-admins and the assigned counselor  
8. Optional next step: **university recommendations** via `get-universities` (real catalog filtered by country, or generated mock matches if the catalog is empty). This is a **filter**, not a scored matching algorithm.  
9. Phone OTP via **Twilio SMS** branded “FlyMasters”: `send-otp` (max 3 OTPs per phone per hour, 10 per IP per hour, ~2-minute expiry) and `verify-otp`.

### 5.3 After the chat

The lead appears on:

- **Admin → Student Leads** and **Lead Lifecycle**  
- **Assigned counselor → My Leads**  
- Notification bell for staff  

From there, counselors shortlist universities, request documents, and move the student through application stages.

---

## 6. Student portal

Students land on `/dashboard` (or `/student`) and get the **Student Portal** sidebar:

| Menu | Intended function |
|------|-------------------|
| Dashboard | Profile completeness, applications, document progress, favorites, chat sessions |
| My Profile | Name, phone, country, date of birth, passport |
| Universities | Browse / match universities |
| My Shortlists | Counselor-proposed universities; student consent, notes, status, checklists |
| Documents | Upload, versioning, review status |
| Applications | Track applications (deadline, fee, interviews, scholarships offered) |
| Counselor Chat | Private messages with the assigned counselor |
| Notifications | Status and document alerts |

Global search (Ctrl/Cmd + K) is available.

**Implementation note:** Profile and Shortlists are fully wired. Universities, Documents, Applications, Counselor Chat, and Notifications currently render **title-only placeholders** on the student routes, even though the real components (`StudentUniversities`, `StudentDocuments`, `StudentApplications`, `StudentPrivateChat`, `StudentNotifications`) already exist in the codebase. Wiring those routes is the main student-portal gap.

Shortlist records include:

- University + course  
- Priority, estimated fees, deadline  
- Student consent flag and date  
- Counselor notes vs student notes  
- Application status updates (optionally hidden from the student)  
- Checklists

---

## 7. Counselor dashboard

Counselors use the shared dashboard shell with a tabbed workspace:

| Tab | What it does |
|-----|----------------|
| **Dashboard** | Stats: assigned leads, hot leads, conversions this month, follow-ups today, conversion rate. Shift timer. Quick actions. |
| **Leads** | All leads assigned to this counselor; notes and next follow-up date |
| **Students** | Converted / managed students |
| **Shortlist** | Propose universities/courses to a student |
| **Profile** | Counselor profile form |
| **Leave** | Apply for leave |
| **Attendance** | Clock in/out records |
| **Salary** | View salary records |

Leads are ordered by **priority**, then **next follow-up date**. Counselors can add notes and schedule follow-ups on a selected lead.

HR data used here is the same data admins manage (leave approval, attendance, salary).

---

## 8. Admin panel

Admins and Super Admins get a categorized control center under `/dashboard/admin`. Logging in as admin lands on `/dashboard`, which currently shows the **profile section**; the operational admin home is `/dashboard/admin`.

### 8.1 Overview

- **Dashboard** — operational snapshot  
- **Analytics** — platform metrics  

### 8.2 Student management

- **Unassigned Students** — leads/students with no counselor  
- **Student Leads** — full CRM list (source, stage, scores, countries, counselor)  
- **Lead Lifecycle** — stage movement and follow-up  
- **Document Review** — approve/reject student uploads with comments  
- **Bulk Lead Assignment** — assign many leads at once  

### 8.3 User & HR

- **User Management** — accounts and roles  
- **HR Management** — counselor leave approval, attendance, salary (basic + allowances − deductions = net)  

### 8.4 Communication

**Chat monitoring**

- Overview, active sessions, history, analytics  

**Marketing automation**

- Campaigns, Excel student-data upload (`xlsx`), message templates  
- Engagement tracking, re-engagement flows (including “route to human counselor”)  
- Channel analytics (sent / delivered / seen / clicked / replied / conversions)  

**University outreach**

- Prospect discovery (`university_prospects`)  
- Email templates and service config  
- Conversation tracker  
- Outreach analytics  

### 8.5 Content & media (CMS)

| Module | Controls |
|--------|----------|
| Study Destinations | Countries and country-page content |
| Universities Management | Catalog, tie-up flag, ranking, logo |
| Test Prep Schedules | Batch dates, timings, discounts, PDF/image |
| Website Content | Homepage CTAs, WhatsApp, branding, copy |
| Documents | Role-based document templates / checklists |
| Media Manager | Images and files |

### 8.6 Travel agency (admin)

A full second product line:

- Travel overview  
- Packages (including Thomas Cook-style packages)  
- Analytics and booking analytics  
- Travel leads and activity log  
- Inventory / availability  
- Email campaigns, templates, send logs  
- Travel document requirements and uploads  
- Booking inquiries  
- Services, offers, news  

### 8.7 System

- Debug panel  
- Database connection test  
- Registration on/off via system settings  

---

## 9. Travel agency (public)

`/travel` is a consumer booking site, not just a brochure:

- Hero carousel and animated categories  
- CMS services, offers, and news  
- Package filters: search, destination, price, duration, difficulty  
- Featured packages, inclusions, season, max travelers  
- Image gallery, comparison, wishlist, reviews, FAQs  
- Trust badges and newsletter signup  
- **Enhanced booking modal** and inquiry modal  
- Phone / WhatsApp contact  

Bookings and inquiries write to `package_bookings`, `travel_inquiries`, and `travel_leads`. Booking references are generated by the database function `generate_booking_reference`. The booking table has `stripe_customer_id` and `stripe_payment_intent_id` columns, but the UI does not charge a card. Guests who book while logged out are stored with a placeholder user id.

---

## 10. Documents, applications, and shortlists (operations model)

This is how a student is taken from “interested” to “applied.”

```
AI Chat / Website
        │
        ▼
  student_leads  ──assign──►  counselor
        │
        ▼
 university_shortlists  ◄── counselor proposes university + course
        │
        ├── student consent
        ├── shortlist_notes
        ├── student_checklists
        └── application_status_updates
                │
                ▼
         applications   (deadline, fee, essays, LORs, interviews, offer)
                │
                ▼
           documents    (upload → review → version → archive)
```

Document pipeline features already in the schema and admin UI:

- Types, tags, expiry, priority  
- Reviewer, comments, status  
- Versioning (`document_versions`, `parent_document_id`)  
- Audit log  
- Per-student checklists and progress (`student_document_progress`)  
- Notifications when action is required  

Application records can store:

- Intake term, deadline, application fee  
- Essay topics, LOR requests, test scores  
- Interview time, decision date  
- Scholarship offered, tuition offered  
- Priority and milestones (JSON)

---

## 11. Data model (tables that matter)

There are **90+** Postgres tables. Grouped by job:

**Identity & access**  
`profiles`, `user_roles`, `otp_verifications`, `rate_limits`, `system_settings`

**Leads & CRM**  
`student_leads`, `lead_assignments`, `lead_notes`, `lead_activity_logs`

**Counselors / HR**  
`counselors`, `counselor_profiles`, `counselor_sessions`, `counselor_attendance`, `counselor_leave_requests`, `counselor_salary_records`

**Chat**  
`chat_sessions`, `chat_messages`, `chat_conversations`, `chat_questions`, `chat_agents`, `private_conversations`, `private_messages`

**Education catalog**  
`countries`, `country_content`, `country_highlights`, `country_courses`, `country_industries`, `country_testimonials`, `universities`, `courses`, `scholarships`, `scholarship_applications`

**Applications**  
`university_shortlists`, `shortlist_notes`, `application_status_updates`, `applications`

**Documents**  
`documents`, `document_versions`, `document_requests`, `document_checklists`, `document_notifications`, `document_audit_logs`, `student_checklists`, `student_document_progress`

**Marketing & outreach**  
`marketing_campaigns`, `marketing_leads`, `campaign_messages`, `campaign_analytics`, `campaign_prospects`, `message_templates`, `message_engagement`, `reengagement_flows`, `university_prospects`, `outreach_campaigns`, `outreach_activity_logs`, `email_templates`, `email_conversations`, `email_messages`, `email_service_config`

**Travel**  
`travel_packages`, `travel_services`, `travel_offers`, `travel_news`, `travel_blogs`, `travel_inquiries`, `travel_leads`, `travel_lead_activities`, `package_bookings`, `package_availability`, `package_inventory`, `package_reviews`, `package_wishlists`, `package_faqs`, `travel_document_requirements`, `travel_document_uploads`, `travel_email_campaigns`, `travel_email_templates`, `travel_email_logs`, `travel_booking_analytics`

**Website CMS**  
`website_content`, `service_offerings`, `testimonials`, `video_testimonials`, `youtube_videos`, `founders`, `success_stories`, `student_gallery`, `newsletter_subscriptions`

**Community / events / test prep (schema ready)**  
`posts`, `post_likes`, `post_comments`, `events`, `event_registrations`, `test_prep_modules`, `test_prep_schedules`, `user_test_progress`

**Other**  
`notifications`, `user_favorites`, `financial_plans`

Database helpers: `get_current_user_role`, `has_role`, `get_lead_stats`, `generate_booking_reference`.

---

## 12. Technology stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui (Radix), Framer Motion |
| Routing | React Router v6 |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Backend / DB / Auth / Storage | Supabase (Postgres 13.x API, Auth, Edge Functions) |
| AI | Google Gemini 2.5 Flash via Lovable AI gateway |
| SMS / OTP | Twilio |
| Payments | Schema only (Stripe columns on `package_bookings`); no payment SDK |
| Spreadsheets | `xlsx` (marketing lead upload) |
| Charts | Recharts |
| SEO | react-helmet-async |
| PWA | `manifest.json` + `sw.js` service worker |
| Native wrapper | Capacitor 7 (iOS + Android), app name `flymasters-hybrid-application` |
| Tests | Cypress |

---

## 13. Mobile and PWA

Already implemented:

- Service worker registration and offline indicator  
- Web App Manifest and install prompt  
- Mobile header + bottom navigation  
- Touch-optimized components and safe-area support  
- Capacitor config (splash, status bar, keyboard) pointing at the Lovable-hosted web URL  

Users can install the site as an app from a mobile browser. Capacitor is configured, but this checkout has **no `android/` or `ios/` project folders** — the hybrid wrapper currently loads the hosted web app rather than a vendored native build. Store releases still need `npx cap add ios/android` and a local build pipeline.

---

## 14. End-to-end journeys (how to demo)

### Journey A — New student from AI chat

1. Open `/` → click **AI Chat** (or `/chat`).  
2. Answer country → qualification → program → score → budget → name → email → phone.  
3. Lead is created; counselor and admins are notified.  
4. Optional: university cards appear; expert-help / WhatsApp is offered.  
5. Staff opens **Student Leads**, assigns/works the lead.  
6. Counselor shortlists universities; student consents on **My Shortlists**.  
7. Documents are requested and reviewed.  
8. Application status is updated until offer / visa.

### Journey B — Returning student

1. Sign in at `/auth`.  
2. Land on Student Portal dashboard.  
3. Complete profile (name, phone, country, DOB, passport).  
4. Review shortlists, upload documents, track applications, message counselor.

### Journey C — Counselor day

1. Sign in → Counselor dashboard.  
2. Clock in (shift timer / attendance).  
3. Work **Leads** (follow-ups, notes).  
4. Shortlist universities for a student.  
5. Apply for leave or check salary as needed.

### Journey D — Admin operations

1. Sign in → Admin Panel.  
2. Assign unassigned students.  
3. Review documents.  
4. Update universities / country pages / homepage copy.  
5. Run a marketing campaign or university outreach sequence.  
6. Manage travel packages and booking inquiries.  
7. Approve counselor leave and post salary.

### Journey E — Travel customer

1. Open `/travel`.  
2. Filter packages, compare, open gallery.  
3. Book or send an inquiry.  
4. Admin sees the inquiry/lead and inventory impact.

---

## 15. What is live vs what still needs wiring

Honest status after a full code read:

| Area | Status |
|------|--------|
| Public homepage + CMS | Live |
| University catalog | Live |
| Country destination pages | Live |
| AI chat → extract profile → create lead → notify staff | Live |
| OTP send/verify + rate limits | Live |
| University recommendations (DB or mock fallback) | Live |
| Admin CRM, documents, CMS, marketing, outreach, HR, travel ops | Built and routed |
| Counselor leads / shortlist / HR self-service | Built and routed |
| Student profile + shortlists | Built and routed |
| Student universities / documents / applications / chat / notifications | Components exist; **routes currently show placeholders** |
| Courses catalog | Live data; listed in `nav-items.tsx` but **not in `App.tsx`** (404) |
| Scholarships, community, experts, events | Pages exist; **not in router**; mock data |
| Test prep page | Live schedules + mock modules; **not in router** |
| Travel storefront + booking | Live (no card payment) |
| PWA | Live |
| Capacitor / native stores | Config only; no iOS/Android folders in this tree |
| Google/social login | Not implemented |
| Stripe / other payments | Database columns only |

One technical risk to flag: the AI `createLead` function writes field names such as `full_name`, `preferred_country`, `qualification`, and `lead_quality`, while the generated database types for `student_leads` use `first_name` / `last_name`, `preferred_countries`, and related columns, and require `user_id`. Lead creation should be tested against the live schema so chat-originated leads always land cleanly in the CRM.

---

## 16. Suggested talking points for a client meeting

1. **One funnel:** website → AI counselor → CRM lead → human counselor → shortlist → documents → application.  
2. **Two businesses in one login:** study-abroad consultancy **and** travel agency, with separate admin modules.  
3. **Role-based operations:** students, counselors, and admins each see only their work.  
4. **CMS without a developer:** homepage, WhatsApp, countries, universities, testimonials, services.  
5. **Staff productivity:** bulk assignment, chat monitoring, marketing automation, university outreach, HR.  
6. **Mobile:** installable PWA now; Capacitor path for App Store / Play Store later.

---

*Document generated from a complete reading of the Fly Masters / Fly AI Pathfinder codebase (React app, Supabase schema, and edge functions). Update this guide when routes or lead-creation fields change.*
