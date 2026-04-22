# Module-wise Business Logic Analysis

## Scope

This document maps business logic module-by-module for the Staffingo CRM codebase (Laravel core + `packages/admin` + `packages/specialty`).

---

## 1) Authentication and Access Control

- **Purpose:** Authenticate users and route them into the correct workspace by role.
- **Primary areas:** `routes/auth.php`, `app/Http/Controllers/Auth/*`, `app/Http/Middleware/BackendMiddleware.php`, `app/Models/User.php`, `app/Models/Role.php`, `app/Models/Permission.php`.
- **Business logic:**
  - Users sign in via Laravel auth flow.
  - Email verification/password reset lifecycle is supported.
  - Middleware gates screens and APIs by backend context (`Admin`, `Client User`, `Candidate`).
  - Role/permission relations enforce what a user can do in admin APIs.
- **Key outcome:** One identity layer controls access for all modules.

---

## 2) Admin Workspace (Operations Console)

- **Purpose:** Main operational cockpit for recruiters/admins/account managers.
- **Primary areas:** `packages/admin/routes/web.php`, `packages/admin/resources/js/views/*`.
- **Business logic:**
  - Single-page admin app mounted on catch-all route guarded by `backendChecker:Admin`.
  - Supports impersonation (`login as`) for account manager supervision and troubleshooting.
  - Frontend modules mirror API modules: jobs, candidates, clients, interviews, offers, timesheets, invoices, payroll, settings.
- **Key outcome:** Central place to execute end-to-end recruitment and finance operations.

---

## 3) Master Data and Settings

- **Purpose:** Configure reusable business dimensions used throughout workflows.
- **Primary areas:** `packages/admin/routes/api.php` (`categories`, `types`, `locations`, `pipelines`, `stages`, settings endpoints), corresponding models.
- **Business logic:**
  - Category/type/location/stage/pipeline data is maintained as admin-controlled master data.
  - Theme/general/email settings define UI/email behavior globally.
  - Scorecard sections/definitions standardize candidate evaluation.
- **Key outcome:** Downstream modules depend on stable, centrally managed reference data.

---

## 4) Company and Client Management

- **Purpose:** Manage client organizations and their active hiring context.
- **Primary areas:** `CompanyController`, `ClientController`, `app/Models/Company.php`.
- **Business logic:**
  - Companies can be imported and managed through APIs.
  - Clients are tied to companies and linked to posted jobs/candidates.
  - Filtering endpoints expose client-centric candidate/job subsets.
- **Key outcome:** Recruitment and billing are anchored to client-company hierarchy.

---

## 5) Job Lifecycle Management

- **Purpose:** Create, maintain, and search hiring demand.
- **Primary areas:** Admin `JobsController`, Specialty job controllers, `app/Models/Job.php`.
- **Business logic:**
  - CRUD for jobs in admin and client contexts.
  - Search, advanced search options, and job list filters support recruiter productivity.
  - Job-to-candidate and job-to-interview listings provide progress visibility.
  - Jobs are core parents for interviews, offers, timesheets, invoices, and payroll.
- **Key outcome:** Job records act as the central hiring unit across modules.

---

## 6) Candidate Lifecycle and Assignment

- **Purpose:** Track candidate profiles from sourcing to placement.
- **Primary areas:** `CandidatesController`, `CandidateNotesController`, `CandidateScorecardsController`, `app/Models/Candidate.php`, `CandidateSkill.php`.
- **Business logic:**
  - Candidate CRUD and search endpoints support full profile management.
  - Candidate assignment to jobs and pipeline status updates drive progression.
  - Candidate notes preserve recruiter/client interaction history.
  - Candidate scorecards capture structured qualitative evaluation.
  - Specialized lists exist for selected, accepted, and employee states.
- **Key outcome:** Candidate entity is the operational center of recruitment execution.

---

## 7) Interview Management and Feedback

- **Purpose:** Schedule, track, and evaluate interview stages.
- **Primary areas:** `InterviewController`, `CallbackController`, `app/Models/Interview.php`, `InterviewFeedback.php`.
- **Business logic:**
  - Interview CRUD and list endpoints track status by job/candidate.
  - Cancel flow handles interview invalidation.
  - Signed feedback links allow secure feedback submission.
  - Callback endpoint writes candidate feedback once (prevents duplicate submission when feedback already exists).
- **Key outcome:** Interview process provides auditable evaluation before offer decisions.

---

## 8) Offer and Placement Workflow

- **Purpose:** Convert shortlisted candidates into formal placements.
- **Primary areas:** `JobsOfferNegotiationController`, `JobsOfferDecisionController`, `JobsOfferContractController`, related models.
- **Business logic:**
  - Negotiation records track compensation/terms progression.
  - Status transitions (including removal from assignment) control movement in offer pipeline.
  - Decision module captures acceptance/rejection outcomes.
  - Contract module stores finalized offer documentation and history.
- **Key outcome:** Structured negotiation -> decision -> contract path governs placement conversion.

---

## 9) Timesheet Processing

- **Purpose:** Capture and approve work logs for billed/paid placements.
- **Primary areas:** `TimesheetsController` (admin), specialty timesheet controllers, `app/Models/Timesheet.php`.
- **Business logic:**
  - Candidate/client sides submit or manage timesheet entries.
  - Admin side reviews, details, PDF export, and approval operations.
  - Invoice generation is initiated from timesheet workflows.
  - Timesheet status is a gate for downstream invoicing/payroll steps.
- **Key outcome:** Timesheets bridge recruitment placement activity to finance.

---

## 10) Invoicing and Invoice Documenting

- **Purpose:** Bill clients for approved work.
- **Primary areas:** `app/Http/Controllers/InvoiceController.php`, `app/Models/Invoice.php`, `InvoiceItem.php`.
- **Business logic:**
  - Invoice list API supports status/client/company/search filters.
  - Invoices are loaded with candidate/job context and payroll linkage.
  - PDF invoice generation renders a full billing document from invoice + payroll + assignment attributes.
  - Client workspace includes invoice listing and document access.
- **Key outcome:** Finance team can generate and distribute billing artifacts from operational data.

---

## 11) Payroll Management

- **Purpose:** Connect invoice-backed revenue to candidate compensation.
- **Primary areas:** `PayrollController`, `app/Models/Payroll.php`.
- **Business logic:**
  - Payroll records are managed for candidate-job pairs.
  - APIs expose invoice references for payroll computations.
  - Payroll and invoice are linked for reconciliation.
- **Key outcome:** Candidate payment workflow is traceable against invoice transactions.

---

## 12) Communication and Call Logging

- **Purpose:** Operational communication with candidates/clients and call traceability.
- **Primary areas:** `RingCentralController`, `CallLogController`, `app/Models/CallLog.php`.
- **Business logic:**
  - RingCentral integration supports ring-out call initiation.
  - Session/call state updates are persisted to call logs.
  - Call logs include user, tenant, caller, and session metadata.
  - Client-specific call log retrieval supports account visibility.
- **Key outcome:** Phone interactions become searchable business records.

---

## 13) External Integrations

- **Purpose:** Extend recruitment workflows using external providers.
- **Primary areas:** `MicrosoftAuthController`, `RchilliController`, `RchilliService`, `RingCentral*Service`.
- **Business logic:**
  - Microsoft OAuth flow stores access/refresh tokens on user for calendar/event integration scenarios.
  - Resume parsing via RChilli extracts data from uploaded resume binary.
  - RingCentral services handle call auth and call actions.
- **Key outcome:** Platform enriches candidate data and communication via third-party systems.

---

## 14) Candidate/Client Specialty Workspace

- **Purpose:** Dedicated UX and APIs for non-admin personas.
- **Primary areas:** `packages/specialty/routes/web.php`, `candidateApi.php`, `clientApi.php`, specialty Vue components.
- **Business logic:**
  - **Client user flow:** job posting/management, candidate view, timesheet and invoice visibility.
  - **Candidate flow:** job browsing, timesheet entry/submission, training and holiday views, account updates.
  - Backend checks separate candidate and client routes under shared auth.
- **Key outcome:** Each external persona sees role-appropriate functionality with scoped actions.

---

## 15) Audit, Documents, and Resume Upload

- **Purpose:** Preserve compliance artifacts and uploaded supporting documents.
- **Primary areas:** `AuditController`, `ResumeUploadController`, `app/Models/AuditLog.php`, `Drive.php`.
- **Business logic:**
  - Upload/list/delete endpoints maintain document lifecycle.
  - Audit endpoints provide entity-level change/document history.
  - Resume upload flow supports candidate data onboarding and parsing pipeline.
- **Key outcome:** Business actions and documents remain traceable for operations and compliance.

---

## 16) Multi-tenancy and Data Isolation

- **Purpose:** Keep tenant data logically separated inside shared infrastructure.
- **Primary areas:** `app/Models/Traits/HasTenant.php`, middleware, model-level tenant fields.
- **Business logic:**
  - Core entities carry `tenant_id`.
  - Request context (authenticated user/tenant) scopes persisted data.
  - Modules such as call logs explicitly write tenant ownership.
- **Key outcome:** Multi-client isolation is enforced across most business workflows.

---

## 17) Cross-Module End-to-End Flow

1. User authenticates and lands in role-specific workspace.
2. Company/client and reference settings define hiring context.
3. Jobs are created; candidates are sourced and assigned.
4. Candidate advances through stages/interviews/feedback.
5. Offer negotiation -> decision -> contract finalizes placement.
6. Timesheets are submitted/approved.
7. Invoices are generated and exported.
8. Payroll is managed against invoice-backed assignments.
9. Audit and documents retain operational trail.

---

## Module Dependency Snapshot

- **Foundational modules:** Authentication, Roles/Permissions, Settings/Master Data.
- **Core business modules:** Jobs, Candidates, Interviews, Offers.
- **Financial modules:** Timesheet, Invoice, Payroll.
- **Supporting modules:** Integrations, Call Logs, Audit/Document Management.
- **Experience layers:** Admin package (internal ops) and Specialty package (client/candidate self-service).

