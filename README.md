# Smart Healthcare Appointment and Queue System
# AarogyaMitra
### Smart Healthcare Appointment & Real-Time Queue Management System

A MERN stack semester project for managing hospital appointments, live queues, patient check-in, walk-in patients, and admin queue operations.
---

## Main Features
## Overview

- Patient registration and login
- Admin registration protected by an invite code
- Hospital listing and appointment booking
- Automatic doctor type selection based on disease
- Priority-based queue ordering for emergencies and senior patients
- Live patient queue view with queue number, wait time, and check-in
- Admin dashboard with hospital filter, appointments table, and live queue actions
- Walk-in appointment creation by admin
- Queue recalculation after completion, cancellation, no-show, delay, and early finish
- Realtime queue updates using Socket.IO
- Rule-based wait time and no-show risk prediction
In traditional healthcare environments, outpatient departments (OPDs) and clinics frequently suffer from unpredictable wait times, physical crowding, and lack of visibility into queue progression. When emergencies occur, appointments run over time, or patients fail to appear, schedules derail quickly. Patients face anxiety and long waiting room delays without clear information, while healthcare staff lack dynamic tools to adjust queue order, accommodate walk-in patients, and handle schedule disruptions.

## Tech Stack
**AarogyaMitra** solves this challenge through a full-stack MERN solution engineered for real-time queue orchestration. The system pairs priority-based scheduling algorithms with bi-directional WebSocket synchronization via Socket.IO. When appointments are created, checked into, delayed, or completed, queue positions and expected start times are dynamically recalculated across the system and instantly pushed to patient and administrator interfaces.

- Frontend: React, React Router, Socket.IO Client
- Backend: Node.js, Express.js, Socket.IO
- Database: MongoDB with Mongoose
- Auth: JWT and bcrypt password hashing
---

## Folder Structure
## Problem Statement

```text
backend/
  server.js
  package.json
  seed.js
  check-hospitals.js
  .env (local - not checked in)
  models/
    Appointment.js
    Hospital.js
    User.js
  routes/
    api.js
    auth.js
  services/
    predictionService.js
    queueService.js
    realtimeService.js
  middleware/
    auth.js
  utils/
    scheduling.js
Conventional hospital scheduling systems treat appointment slots as static calendar blocks:
- **Zero Real-Time Visibility:** Patients receive a static appointment time, only to wait hours when earlier consultations run long or emergency cases take precedence.
- **Static First-Come, First-Served Ordering:** Traditional queues fail to systematically differentiate between routine follow-ups and high-acuity conditions or vulnerable demographic groups (e.g., senior citizens).
- **Administrative Overhead During Disruptions:** Doctor delays, walk-in emergency arrivals, early completions, and patient no-shows force reception desks to manually reorganize schedules.
- **Information Asymmetry:** Patients have no mechanism to track their position in line remotely, leading to crowded waiting rooms and unnecessary physical congestion.

frontend/
  package.json
  public/
    index.html
    assets/
  src/
    index.js
    App.js
    App.css
    components/
      AppointmentCard.js
      PatientQueueView.js
      QueueDashboard.js
      Navbar.js
      ProtectedRoute.js
      Toast.js
    pages/
      AdminDashboard.js
      UserDashboard.js
      Login.js
      Register.js
    services/
      socket.js
    styles/
      Dashboard.css
      Auth.css
---

## Solution

AarogyaMitra introduces an automated, responsive queue orchestration platform:
- **Intelligent Triage & Priority Scoring:** Computes clinical and demographic priority scores upon booking, accounting for medical urgency, condition severity, patient age, and visit category.
- **Dynamic Queue Recalculation:** Re-sequences waiting patients automatically upon any schedule change (cancellations, walk-ins, doctor delays, or early completions).
- **Bi-Directional Real-Time Updates:** Uses Socket.IO rooms to synchronize state between the server, the hospital administration console, and individual patient devices without polling.
- **Transparent Waiting-Time Estimation:** Calculates estimated start times and bounded wait windows based on doctor specialty, consultation category, and queue velocity.
- **Administrative Control Panel:** Gives healthcare staff immediate actions to register walk-ins, log doctor delays, record no-shows, mark consultations completed, and monitor patient flow.

---

## Key Features

### Patient Capabilities
- **Secure Authentication:** Account registration and login powered by JSON Web Tokens (JWT) and salted bcrypt password hashing.
- **Specialty-Aware Appointment Booking:** Automatic mapping of patient-reported symptoms and conditions to the appropriate clinical specialist (e.g., Cardiologist, Oncologist, Neurologist, Orthopedic).
- **Priority-Driven Token Generation:** Generates queue tokens based on algorithmic severity scoring and timestamp ordering.
- **Live Queue Tracker:** Dedicated view displaying current queue token number, dynamic progress bar, estimated start time, and expected waiting duration.
- **Self Check-In System:** Allows patients to check in upon arrival (on-time or late status), updating their status in the active clinical workflow.
- **Real-Time Push Notifications:** Immediate client-side updates when queue positions change or schedule adjustments occur.
- **Visit History:** Complete record of upcoming, in-progress, and past appointments with consultation details.

### Administrator & Staff Capabilities
- **Protected Administrator Access:** Staff registration guarded by a server-validated administrator invite code.
- **Operations Dashboard:** Live metrics tracking daily volume, pending consultations, completed visits, cancellations, and walk-in ratios.
- **Live Hospital Queue Monitor:** Tabular view of all queued patients with token numbers, condition, assigned doctor type, check-in state, wait time, and predicted no-show risk.
- **Walk-In Patient Management:** Interface for rapid registration and immediate queue integration of unscheduled walk-in patients.
- **Doctor Delay Propagation:** Feature allowing administrators to record doctor delays in minutes, instantly shifting all downstream appointment estimates and notifying patients.
- **Early Consultation Finish:** Option to record early appointment completion, shifting downstream estimated wait times earlier.
- **No-Show & Cancellation Processing:** Immediate queue re-indexing when a patient is marked as a no-show or cancels, advancing subsequent patients forward.
- **Manual Queue Recalculation:** One-click re-indexing to ensure absolute queue consistency.

---

## Why This Project Matters

- **Reduces Waiting-Room Congestion:** By providing transparent estimated start times, patients can pace their arrival, preventing crowded waiting areas.
- **Eliminates Patient Uncertainty:** Real-time token tracking removes anxiety around consultation timing and queue velocity.
- **Improves Clinical Throughput:** Administrative tools reduce friction in re-ordering patients after unexpected delays or emergency admissions.
- **Demonstrates Production-Style Full-Stack Engineering:** Combines secure authentication, RESTful services, database indexing, algorithmic scheduling, and event-driven architecture in a unified, cohesive codebase.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  React.js SPA · React Router · Socket.IO Client · Tailwind  │
└──────────────┬──────────────────────────────▲───────────────┘
               │ HTTP REST Requests           │ WebSocket Events
               │ (JWT Bearer Auth)            │ (queue:updated, appointment:updated)
┌──────────────▼──────────────────────────────┴───────────────┐
│                   Application Layer                         │
│             Node.js & Express.js REST API                   │
│                                                             │
│  ┌──────────────────────┐        ┌───────────────────────┐  │
│  │   Auth Middleware    │        │  Socket.IO Gateway    │  │
│  │   (JWT Verification, │        │  (User Rooms & Global │  │
│  │    Role Validation)  │        │   Broadcast Engine)   │  │
│  └──────────┬───────────┘        └───────────▲───────────┘  │
│             │                                │              │
│  ┌──────────▼────────────────────────────────┴───────────┐  │
│  │                    Core Services                      │  │
│  │  - queueService (Recalculation, Delays, Early Finish) │  │
│  │  - scheduling (Priority Calculation, Consult Times)   │  │
│  │  - predictionService (Heuristic Wait & No-Show Risk)  │  │
│  │  - realtimeService (Socket Event Dispatcher)          │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │ Mongoose ODM
┌─────────────────────────────▼───────────────────────────────┐
│                      Database Layer                         │
│           MongoDB (Users, Appointments, Hospitals)          │
└─────────────────────────────────────────────────────────────┘
```

## Backend Setup
### Architectural Responsibilities
1. **Presentation Layer (React):** Manages responsive UI state, handles authenticated session persistence via `sessionStorage`, and maintains open WebSocket connections to subscribe to queue lifecycle events.
2. **API & Security Layer (Express & Middleware):** Validates payloads, verifies signed JWT tokens, enforces role-based authorization (`user` vs `admin`), and exposes clean REST endpoints.
3. **Domain & Scheduling Engine:** Decoupled service layer containing pure scheduling algorithms, priority calculators, consultation time estimators, and queue mutation handlers.
4. **Real-Time Gateway (Socket.IO):** Manages connection lifecycle and routes event packets to global channels or targeted user rooms (`user:<userId>`).
5. **Data Persistence Layer (MongoDB / Mongoose):** Houses schema models with relationship references, status constraints, and indexing for fast query retrieval.

```bash
cd backend
npm install
npm run seed
npm start
---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React.js (v18) | Single-page application architecture and reactive state management |
| **Routing** | React Router DOM (v6) | Declarative client-side routing with role-based protected routes |
| **Styling** | Tailwind CSS & Modern CSS | Clean, responsive design system with custom utility styling |
| **Real-Time Client** | Socket.IO Client (v4) | WebSocket protocol management with fallback polling |
| **Backend Runtime** | Node.js | Asynchronous, event-driven server runtime environment |
| **Web Framework** | Express.js (v5) | HTTP REST API routing, request validation, and middleware pipeline |
| **Real-Time Server** | Socket.IO (v4) | WebSocket management, room subscriptions, and bi-directional broadcasts |
| **Database & ODM** | MongoDB with Mongoose (v8) | Document-oriented database with structured schemas and validations |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) | Stateless bearer token authentication |
| **Password Hashing** | `bcryptjs` | Salt generation and one-way cryptographic password hashing |
| **Email Service** | `nodemailer` | Asynchronous email notification dispatch for queue status updates |

---

## Core Engineering Concepts Demonstrated

- **Full-Stack MERN Architecture:** Clean separation of concerns between client presentation, server routing, domain business logic, and database persistence.
- **Event-Driven State Synchronization:** Replacing expensive polling patterns with push-based WebSocket events via Socket.IO rooms.
- **Algorithmic Queue Scheduling:** Priority-based multi-variable scheduling algorithm with deterministic tie-breaking.
- **Role-Based Access Control (RBAC):** Middleware-enforced authorization differentiating standard patient capabilities from administrative functions.
- **Defensive API Design:** Centralized error handling, input verification, safe JSON parsing, and HTTP status code discipline.
- **Decoupled Service Abstraction:** Isolating business algorithms (`queueService`, `predictionService`, `scheduling`) from HTTP transport logic (`routes`).
- **Cryptographic Security:** Salted password hashing and signed JWT validation preventing credential tampering.
- **Environment-Driven Configuration:** Externalized secrets, ports, and connection strings for environment portability.

---

## Queue Management Logic

AarogyaMitra avoids naive first-in, first-out (FIFO) ordering by calculating clinical priority and dynamic consultation durations.

### Queue Lifecycle Flow

```
Appointment Created (Online or Walk-in)
               ↓
    Calculate Priority Score
 (Disease Severity + Age + Visit Type)
               ↓
    Assign Expected Consult Time
 (Doctor Specialty + Visit Category)
               ↓
    Order Active Appointments
 (Priority DESC, CreatedAt ASC)
               ↓
    Assign Sequential Queue Tokens
     (#1, #2, #3...) & Wait Estimates
               ↓
    Queue Event Triggered
 (Doctor Delay / Cancellation / No-Show / Completion)
               ↓
    Dynamic Queue Recalculation
               ↓
    Real-Time Push to Admin & Patients via Socket.IO
```

Backend runs on:
### 1. Priority Scoring Formula

Priority calculation evaluates three primary vectors:

$$\text{Priority} = \text{Emergency Bonus} + \text{Disease Severity} + \text{Senior Boost} + \text{Senior Severe Boost} + \text{Follow-up Adjustment}$$

- **Emergency Visit:** Adds $+100$ points immediately.
- **Condition Severity Weighting:**
  - Cancer, Heart Disease, Kidney Disease: $+30$ points
  - Neurological Disorders: $+25$ points
  - Fractures, Diabetes: $+20$ points
  - Eye Problems, Dental Issues: $+15$ points
  - Fever: $+10$ points
  - General Checkup: $+5$ points
- **Senior Patient Prioritization:**
  - Age $\ge 60$: Adds $+20$ points.
  - Age $\ge 60$ with high disease severity ($\ge 25$): Adds an additional $+10$ points.
- **Routine Follow-Up:** Decreases priority score by $-10$ points.

### 2. Consultation Duration Estimation

Consultation duration estimates are customized by medical specialty and visit category:
- **Emergency Consultations:** Fixed baseline of $30$ minutes.
- **Follow-up Appointments:** Fixed baseline of $10$ minutes.
- **High-Complexity Specialties (Cardiology, Neurology, Oncology, Nephrology):** $25$ minutes.
- **Standard / General Practitioner Consultations:** $15$ minutes.

### 3. Queue Reordering & Time Allocation

When active appointments (`scheduled`, `checked-in`, `in-progress`) are evaluated:
1. **Primary Sort:** Priority score descending.
2. **Secondary Sort (Tie-Breaker):** Creation timestamp (`createdAt`) ascending (FIFO among equal priority).
3. **Queue Token Assignment:** Sequential integer token starting from position $1$.
4. **Cumulative Expected Wait:**
   $$\text{Wait Minutes} = \max\left(0, \text{Cumulative Expected Time} - \text{Consult Time}\right)$$
   $$\text{Estimated Start Time} = \text{Current Time} + (\text{Wait Minutes} \times 60000\text{ ms})$$
   $$\text{Confidence Interval} = [\max(0, \text{Wait Minutes} - 5\text{ min}), \text{Wait Minutes} + 30\text{ min}]$$

### 4. Schedule Disruption Handling

- **Doctor Delay:** Administrators specify delay minutes. All pending and checked-in consultations have their `estimatedStartTime` shifted forward and `predictedWaitTime` incremented.
- **Patient No-Show:** The appointment status transitions to `no-show`. The queue recalculates instantly, shifting all subsequent patients forward.
- **Appointment Cancellation:** Transitions status to `cancelled` and frees the slot immediately.
- **Early Consultation Finish:** Downstream appointment estimates are shifted earlier, with real-time updates broadcast to waiting patients.

---

## Heuristic Prediction Engine

The system incorporates heuristic evaluation functions designed to simulate analytical predictions based on operational variables:

1. **No-Show Risk Assessment (`predictNoShowRisk`):**
   Evaluates risk factors including demographic band, visit type (follow-ups exhibit higher cancellation rates; emergencies lower), disease complexity, day of week (weekends weighted higher), time of day (afternoons weighted higher), and historical no-show track record. Computes a normalized score ($0.0$ to $1.0$) and categorizes risk as **Low**, **Medium**, or **High**.

2. **Wait-Time Variance Modeling (`predictWaitingTime`):**
   Adjusts baseline wait estimates against operational multipliers such as weekend congestion factors ($+30\%$), day-of-week load, peak morning/evening hours, and active clinic capacity load.

3. **Reschedule Recommendations (`recommendReschedule`):**
   Analyzes queue status to detect optimization opportunities—such as moving patients up into vacant slots left by cancellations or flagging severely delayed non-checked-in patients for rescheduling.

---

## Real-Time Communication Architecture

AarogyaMitra utilizes Socket.IO to maintain persistent, bidirectional connections between the server and all active clients.

### Connection & Room Management
- Upon logging in, the frontend establishes a persistent connection to the Socket.IO server.
- The client emits `join:user` with its unique MongoDB user ID.
- The server places the socket into a private room: `user:<userId>`.

### Socket Events Reference

| Event Name | Direction | Channel / Scope | Trigger Condition | Payload Details |
|---|---|---|---|---|
| `join:user` | Client → Server | Individual Socket | On patient dashboard load | `userId: string` |
| `queue:updated` | Server → Client | Global Broadcast (`io.emit`) | Any queue recalculation, doctor delay, or manual trigger | `{ reason, queueSize, changedCount, updatedAt }` |
| `appointment:updated` | Server → Client | Targeted Room (`user:<userId>`) | Patient's queue number or wait time shifts | `{ appointmentId, queueNumber, predictedWaitTime, estimatedStartTime, reason }` |

---

## Authentication & Security

- **Cryptographic Password Hashing:** Passwords are never stored in plaintext. They are salted ($10$ rounds) and hashed using `bcryptjs` inside a pre-save Mongoose hook.
- **Stateless Bearer Tokens:** Authenticated requests pass a signed JWT token in the `Authorization: Bearer <token>` header, verified by Express middleware.
- **Role-Based Authorization:** Administrative routes enforce both token presence (`authMiddleware`) and administrator status (`adminMiddleware`).
- **Guarded Admin Registration:** Registration with the `admin` role requires providing an invite code matching the backend `ADMIN_INVITE_CODE`.
- **Ownership Verification:** Patient operations (e.g., self check-in, self-cancellation) verify that the appointment belongs to the authenticated user ID.
- **Environment Isolation:** All cryptographic secrets, database connection URIs, and credentials reside in `.env` files and are omitted from version control.

---

## API Overview

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Purpose | Access Control |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new patient or administrator (requires invite code) | Public |
| `POST` | `/api/auth/login` | Authenticate credentials and return JWT bearer token | Public |

### Patient & Appointment Routes (`/api`)

| Method | Endpoint | Purpose | Access Control |
|---|---|---|---|
| `POST` | `/api/book` | Book a new hospital appointment and trigger queue placement | Authenticated Patient |
| `POST` | `/api/appointments` | Alias endpoint for appointment booking | Authenticated Patient |
| `GET` | `/api/appointments` | Retrieve all appointments associated with the logged-in user | Authenticated Patient |
| `POST` | `/api/appointments/:id/check-in` | Perform self check-in (supports on-time or late flag) | Authenticated Owner |
| `POST` | `/api/appointments/:id/cancel` | Cancel appointment and recalculate downstream queue | Authenticated Owner |

### Administrative Routes (`/api/admin`)

| Method | Endpoint | Purpose | Access Control |
|---|---|---|---|
| `GET` | `/api/admin/appointments` | Retrieve full appointments list across the hospital | Authenticated Admin |
| `PATCH` | `/api/admin/appointments/:id` | Update appointment status (`Pending`, `Completed`, `Cancelled`) | Authenticated Admin |
| `GET` | `/api/admin/queue` | Fetch live ordered queue with priority and status breakdown | Authenticated Admin |
| `POST` | `/api/admin/walk-in` | Register an unscheduled walk-in patient into the live queue | Authenticated Admin |
| `POST` | `/api/admin/appointments/:id/complete` | Mark consultation as completed and advance queue | Authenticated Admin |
| `POST` | `/api/admin/appointments/:id/no-show` | Record patient no-show and re-sequence subsequent tokens | Authenticated Admin |
| `POST` | `/api/admin/appointments/:id/early-finish` | Record early consultation completion and advance times | Authenticated Admin |
| `POST` | `/api/admin/queue/delay` | Log doctor delay in minutes and cascade schedule adjustment | Authenticated Admin |
| `POST` | `/api/admin/queue/recalculate` | Manually recalculate and broadcast entire queue state | Authenticated Admin |

### Analysis & Recommendation Routes (`/api`)

| Method | Endpoint | Purpose | Access Control |
|---|---|---|---|
| `POST` | `/api/predict/no-show` | Calculate heuristic no-show risk score for appointment factors | Authenticated User |
| `POST` | `/api/predict/waiting-time` | Calculate predicted wait duration and confidence interval | Authenticated User |
| `POST` | `/api/recommend/reschedule/:id` | Generate recommendations to move up, move down, or reschedule | Authenticated User |

---

## Project Structure

```text
http://localhost:5000
AarogyaMitra/
├── backend/
│   ├── middleware/
│   │   └── auth.js                 # JWT verification and admin role check
│   ├── models/
│   │   ├── Appointment.js          # Appointment schema with queue & prediction fields
│   │   ├── Hospital.js             # Hospital metadata schema
│   │   └── User.js                 # User schema with bcrypt password hashing
│   ├── routes/
│   │   ├── api.js                  # Main API routes (appointments, admin, queue, prediction)
│   │   └── auth.js                 # Authentication routes (register, login)
│   ├── services/
│   │   ├── predictionService.js    # Rule-based wait time and no-show risk algorithms
│   │   ├── queueService.js         # Queue recalculation, delays, no-shows, notifications
│   │   └── realtimeService.js      # Socket.IO event emitters and room manager
│   ├── utils/
│   │   └── scheduling.js           # Priority scoring and consultation duration calculations
│   ├── check-hospitals.js          # Database diagnostic utility
│   ├── package.json                # Backend dependencies and scripts
│   ├── seed.js                     # Seed script for initial hospital and demo accounts
│   └── server.js                   # Express server initialization, Socket.IO setup, DB connect
│
├── frontend/
│   ├── public/
│   │   ├── assets/                 # SVGs and branding assets
│   │   └── index.html              # HTML shell
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppointmentCard.js  # Booking confirmation modal with queue token
│   │   │   ├── Navbar.js           # Navigation bar with role-based links
│   │   │   ├── PatientQueueView.js # Live patient queue tracking card with Socket.IO listener
│   │   │   ├── ProtectedRoute.js   # Route guard enforcing authentication and role
│   │   │   ├── QueueDashboard.js   # Admin live queue table and action panel
│   │   │   ├── Toast.js            # System toast notification component
│   │   │   └── ui.js               # Reusable UI components (Button, Badge, Card, Loader)
│   │   ├── pages/
│   │   │   ├── AdminDashboard.js   # Hospital operations console with statistics and controls
│   │   │   ├── Login.js            # User and admin sign-in page
│   │   │   ├── Register.js         # User registration with admin invite code support
│   │   │   └── UserDashboard.js    # Patient workspace for booking and viewing queue status
│   │   ├── services/
│   │   │   ├── api.js              # Centralized HTTP request helper with error handling
│   │   │   └── socket.js           # Singleton Socket.IO client instance
│   │   ├── styles/
│   │   │   └── Dashboard.css       # Dedicated styling for dashboard views and tables
│   │   ├── App.css                 # Global styling, themes, and animations
│   │   ├── App.js                  # Top-level routing and authentication state provider
│   │   ├── index.css               # Base Tailwind CSS directives
│   │   └── index.js                # React application DOM entry point
│   ├── package.json                # Frontend dependencies and build scripts
│   └── tailwind.config.js          # Tailwind CSS configuration
│
├── QUEUE_FEATURE_PROMPT.md         # Queue feature specifications
└── README.md                       # Comprehensive project documentation
```

Required backend `.env` values:
---

```text
## Environment Variables

### Backend Configuration (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Connection String (Local MongoDB or MongoDB Atlas)
MONGODB_URI=mongodb://localhost:27017/smart-appointment

# Server Port
PORT=5000
JWT_SECRET=your-secret
ADMIN_INVITE_CODE=smart-admin-2026
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Frontend Setup
# JSON Web Token Secret Key
JWT_SECRET=your_secure_jwt_secret_key

```bash
cd frontend
npm install
npm start
# Admin Registration Security Passcode
ADMIN_INVITE_CODE=your_admin_invite_code

# Optional Email Notification Configuration (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

Frontend runs on:
### Frontend Configuration (`frontend/.env`)

```text
http://localhost:3000
Create a `.env` file in the `frontend/` directory:

```env
# Backend API Base URL
REACT_APP_API_URL=http://localhost:5000
```

## Demo Flow (updated for single-hospital mode)
> **Security Note:** Never commit `.env` files containing real production secrets, connection strings, or mailer credentials to source control.

1. Register a patient account and book an appointment (booking now targets Vijaya Hospital by default).
2. Click `View Live Queue` from the patient appointment list.
3. Register or log in as admin using the admin invite code (see below).
4. Open the Admin Dashboard — there is no hospital selector; the system manages a single hospital: Vijaya Hospital.
5. Use the live queue panel to apply doctor delay, recalculate queue, mark no-show, or complete appointments.
6. Return to the patient dashboard and confirm that queue number and wait time update in real time.
---

## Important API Endpoints (current)
## Installation & Setup

```text
POST /api/auth/register
POST /api/auth/login
POST /api/book                # Book appointment (user)
GET  /api/appointments        # User's appointments
GET  /api/admin/appointments  # Admin: all appointments
PATCH /api/admin/appointments/:id
GET  /api/admin/queue         # Admin: live queue (single-hospital mode)
POST /api/admin/walk-in
POST /api/admin/appointments/:id/no-show
POST /api/admin/appointments/:id/complete
POST /api/admin/queue/delay
POST /api/admin/queue/recalculate
POST /api/predict/no-show
POST /api/predict/waiting-time
POST /api/recommend/reschedule/:appointmentId
### Prerequisites
- **Node.js:** v16.x or later (v18.x or v20.x recommended)
- **npm:** v8.x or later
- **MongoDB:** Locally running MongoDB instance or a free MongoDB Atlas cluster

### 1. Clone the Repository
```bash
git clone https://github.com/JyothiVenkataSai-5239/AarogyaMitra.git
cd AarogyaMitra
```

Note: Hospital-specific route parameters were removed from admin queue endpoints as the application now operates in single-hospital mode (Vijaya Hospital). The `Hospital` model is retained in the codebase for future re-enablement of multi-hospital support.
### 2. Backend Setup
```bash
cd backend
npm install
```

---
Configure your environment variables by creating `backend/.env` using the template above.

## Single-Hospital Refactor — Vijaya Hospital (what changed)
Seed the database with default hospital metadata and test accounts:
```bash
npm run seed
```

This repository was refactored to operate in single-hospital mode. Key changes applied in this refactor:
Start the backend API server:
```bash
npm start
```
The backend will start and listen on `http://localhost:5000`.

- Default hospital: **Vijaya Hospital**. Users are not asked to choose a hospital; all appointments, queues, and doctors belong to Vijaya Hospital.
- Backend seed updated to create a single hospital record: `backend/seed.js` now seeds `Vijaya Hospital`.
- Frontend booking UI no longer shows a hospital select — `frontend/src/pages/UserDashboard.js` now displays a read-only `Vijaya Hospital` and sends `hospitalName: "Vijaya Hospital"` when booking.
- Appointment confirmation and admin lists display `Vijaya Hospital`: `frontend/src/components/AppointmentCard.js`, `frontend/src/pages/AdminDashboard.js`.
- Queue dashboard header updated to reference Vijaya Hospital: `frontend/src/components/QueueDashboard.js`.
- Global UI restyle applied (modern AI-inspired theme): `frontend/src/styles/Dashboard.css` updated (colors, fonts, buttons, spacing).
### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
```

Files modified during the refactor (non-exhaustive):
- `backend/seed.js`
- `frontend/src/pages/UserDashboard.js`
- `frontend/src/pages/AdminDashboard.js`
- `frontend/src/components/AppointmentCard.js`
- `frontend/src/components/QueueDashboard.js`
- `frontend/src/styles/Dashboard.css`
Configure your environment variables by creating `frontend/.env` using the template above.

If you want further cleanup (e.g., remove the `Hospital` model entirely, remove hospital-related CSS classes, or remove endpoints that are no longer used), I can perform those changes next while preserving the ability to reintroduce multi-hospital support later.
Start the React development server:
```bash
npm start
```
The frontend will compile and open automatically on `http://localhost:3000`.

---

## Admin Invite Code
## Running Locally & Demo Flow

To register an admin account the application uses an invite code. The seed and `.env` example include:
### Pre-Seeded Demonstration Accounts
When `npm run seed` is executed, the following accounts are initialized:

```
ADMIN_INVITE_CODE=smart-admin-2026
```
- **Hospital Administrator:**
  - Email: `admin@hospital.com`
  - Password: `admin123`
- **Patient:**
  - Email: `patient@gmail.com`
  - Password: `patient123`
- **Admin Invite Code:** As configured in `ADMIN_INVITE_CODE` in `backend/.env`.

Use that code on the registration page when selecting role `admin`.
### Step-by-Step Verification Walkthrough
1. **Patient Booking:**
   - Log in with `patient@gmail.com` / `patient123`.
   - Scroll to **Choose the care you need**. Select an Age Group, Condition (e.g., `Heart Disease`), and Visit Type (`Emergency` or `Consultation`).
   - Click **Confirm appointment**.
   - Note the assigned **Queue Token** and doctor specialty (automatically identified as `Cardiologist`).
2. **Track Live Queue:**
   - On the patient dashboard, review **Live appointment progress**.
   - Click **Check in on time** to transition your appointment from `scheduled` to `checked-in`.
3. **Admin Queue Operations:**
   - Open an incognito browser window and sign in as `admin@hospital.com` / `admin123`.
   - Navigate to **Live Queue**. Observe the patient appointment appearing in the active queue table.
   - Click **Doctor Delay**, enter `15` minutes, and click **Apply**.
   - Switch to the patient browser window: notice the estimated start time and wait duration immediately update in real time without refreshing.
4. **Walk-in Integration:**
   - From the admin console, navigate to **Walk-in Patient**.
   - Add a walk-in record with an acute condition.
   - Observe how the queue automatically reorders priority and assigns a new token sequence.
5. **Completion / No-Show:**
   - From the admin queue, mark an appointment as **Done** or **No-Show**.
   - Notice the queue re-indexes automatically, advancing remaining patients forward.

## Queue Logic
---

Appointments are ordered by priority first and booking time second.
## Deployment

- Emergency visits get the highest priority.
- Senior patients get a priority boost.
- Follow-up visits receive a lower priority.
- Consultation time changes by visit type and doctor type.
- Queue number, expected time, estimated start time, and wait range are recalculated whenever the queue changes.
AarogyaMitra is engineered to run seamlessly across modern cloud hosting providers:

## Verification
- **Frontend Deployment (Vercel / Netlify):**
  - Build Command: `npm run build`
  - Output Directory: `build`
  - Environment Variable: `REACT_APP_API_URL` set to the deployed backend URL.
- **Backend Deployment (Render / Railway / AWS EC2):**
  - Start Command: `node server.js`
  - Environment Variables: `MONGODB_URI`, `PORT`, `JWT_SECRET`, `ADMIN_INVITE_CODE`, `EMAIL_USER`, `EMAIL_PASSWORD`.
- **Database Deployment (MongoDB Atlas):**
  - Managed cloud replica set with network access permissions configured for the backend server.

The frontend production build completes successfully:
---

## Testing & Verification

The codebase can be verified locally using standard build and syntax testing tools:

### Frontend Production Build
```bash
cd frontend
npm run build
```
Compiles and optimizes production static assets into `frontend/build`.

Backend JavaScript syntax was checked with:

### Backend Syntax Verification
```bash
cd backend
node --check server.js
node --check routes/auth.js
node --check routes/api.js
node --check services/queueService.js
node --check services/predictionService.js
node --check services/realtimeService.js
node --check utils/scheduling.js
```
Ensures all backend modules pass V8 syntax validation without errors.

---

## Screenshots / Demo

> *Visual walkthrough captures and UI previews can be added here.*

| View | Description |
|---|---|
| **Patient Dashboard** | Displays upcoming visit cards, queue tokens, check-in controls, and live countdown timer |
| **Admin Operations** | Multi-metric KPI cards, interactive queue table, delay injector, and walk-in entry modal |
| **Booking Modal** | Specialty-routing form with instant doctor assignment and token generation |

---

## Future Enhancements

The following roadmap items represent planned enterprise-grade improvements:
- **Multi-Hospital Federation:** Extending the data model and UI to manage multiple hospital campuses under tenant-isolated queues.
- **Doctor-Specific Schedule Profiles:** Individual doctor duty rosters, custom consultation speed profiles, and room-level assignment.
- **Machine Learning Wait-Time Model:** Replacing heuristic prediction functions with a model trained on historical EHR check-in and consultation timestamps.
- **SMS & WhatsApp Dispatch:** Integrating Twilio or WhatsApp Business API to deliver SMS alerts when a patient is within 3 tokens of their turn.
- **Telemetry & Monitoring:** Integrating Prometheus metrics and OpenTelemetry tracing for API response time and queue latency observability.

---

## Learning & Engineering Outcomes

Developing AarogyaMitra demonstrated practical proficiency in key software engineering domains:
- **Full-Stack System Design:** Architecting a clean client-server system that balances synchronous REST transactions with asynchronous event delivery.
- **State Synchronization:** Handling race conditions and maintaining consistent state across multiple disconnected clients through event-driven messaging.
- **Business Logic Isolation:** Designing clean algorithms for triage scoring, time allocation, and queue reordering independent of HTTP framework coupling.
- **Security & Authorization Hygiene:** Implementing defensive authentication paradigms, strict parameter validation, and secure password storage.

---

## Author

**Katakatla Jyothi Venkata Sai**  
- **GitHub:** [https://github.com/JyothiVenkataSai-5239](https://github.com/JyothiVenkataSai-5239)  
- **Project Repository:** [https://github.com/JyothiVenkataSai-5239/AarogyaMitra](https://github.com/JyothiVenkataSai-5239/AarogyaMitra)
