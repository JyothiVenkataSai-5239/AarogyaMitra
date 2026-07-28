# Smart Healthcare Appointment and Queue System

A MERN stack semester project for managing hospital appointments, live queues, patient check-in, walk-in patients, and admin queue operations.

## Main Features

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

## Tech Stack

- Frontend: React, React Router, Socket.IO Client
- Backend: Node.js, Express.js, Socket.IO
- Database: MongoDB with Mongoose
- Auth: JWT and bcrypt password hashing

## Folder Structure

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
```

## Backend Setup

```bash
cd backend
npm install
npm run seed
npm start
```

Backend runs on:

```text
http://localhost:5000
```

Required backend `.env` values:

```text
MONGODB_URI=mongodb://localhost:27017/smart-appointment
PORT=5000
JWT_SECRET=your-secret
ADMIN_INVITE_CODE=smart-admin-2026
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

## Demo Flow (updated for single-hospital mode)

1. Register a patient account and book an appointment (booking now targets Vijaya Hospital by default).
2. Click `View Live Queue` from the patient appointment list.
3. Register or log in as admin using the admin invite code (see below).
4. Open the Admin Dashboard — there is no hospital selector; the system manages a single hospital: Vijaya Hospital.
5. Use the live queue panel to apply doctor delay, recalculate queue, mark no-show, or complete appointments.
6. Return to the patient dashboard and confirm that queue number and wait time update in real time.

## Important API Endpoints (current)

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
```

Note: Hospital-specific route parameters were removed from admin queue endpoints as the application now operates in single-hospital mode (Vijaya Hospital). The `Hospital` model is retained in the codebase for future re-enablement of multi-hospital support.

---

## Single-Hospital Refactor — Vijaya Hospital (what changed)

This repository was refactored to operate in single-hospital mode. Key changes applied in this refactor:

- Default hospital: **Vijaya Hospital**. Users are not asked to choose a hospital; all appointments, queues, and doctors belong to Vijaya Hospital.
- Backend seed updated to create a single hospital record: `backend/seed.js` now seeds `Vijaya Hospital`.
- Frontend booking UI no longer shows a hospital select — `frontend/src/pages/UserDashboard.js` now displays a read-only `Vijaya Hospital` and sends `hospitalName: "Vijaya Hospital"` when booking.
- Appointment confirmation and admin lists display `Vijaya Hospital`: `frontend/src/components/AppointmentCard.js`, `frontend/src/pages/AdminDashboard.js`.
- Queue dashboard header updated to reference Vijaya Hospital: `frontend/src/components/QueueDashboard.js`.
- Global UI restyle applied (modern AI-inspired theme): `frontend/src/styles/Dashboard.css` updated (colors, fonts, buttons, spacing).

Files modified during the refactor (non-exhaustive):
- `backend/seed.js`
- `frontend/src/pages/UserDashboard.js`
- `frontend/src/pages/AdminDashboard.js`
- `frontend/src/components/AppointmentCard.js`
- `frontend/src/components/QueueDashboard.js`
- `frontend/src/styles/Dashboard.css`

If you want further cleanup (e.g., remove the `Hospital` model entirely, remove hospital-related CSS classes, or remove endpoints that are no longer used), I can perform those changes next while preserving the ability to reintroduce multi-hospital support later.

---

## Admin Invite Code

To register an admin account the application uses an invite code. The seed and `.env` example include:

```
ADMIN_INVITE_CODE=smart-admin-2026
```

Use that code on the registration page when selecting role `admin`.

## Queue Logic

Appointments are ordered by priority first and booking time second.

- Emergency visits get the highest priority.
- Senior patients get a priority boost.
- Follow-up visits receive a lower priority.
- Consultation time changes by visit type and doctor type.
- Queue number, expected time, estimated start time, and wait range are recalculated whenever the queue changes.

## Verification

The frontend production build completes successfully:

```bash
cd frontend
npm run build
```

Backend JavaScript syntax was checked with:

```bash
node --check server.js
node --check routes/auth.js
node --check routes/api.js
node --check services/queueService.js
```
