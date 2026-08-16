# Firestore security baseline

`firestore.rules` is deliberately **not deployed** and is not referenced by a
root `firebase.json`. It is a production baseline for the current collection
names, not a drop-in toggle for the current client.

## Why it cannot be deployed today

Attendance currently lives in one mutable document at
`users/{uid}/data/subjects`, and the mobile client writes that complete array.
If a student can write their own document, they can change any past attendance
record, attendance total, or subject. Firestore rules cannot inspect a genuine
user action versus a forged request from a modified app.

The staged rules therefore deny every direct write to that document. They also
deny client-side OD/ML approval, correction approval, and audit-log writes,
because those operations must update multiple documents as one trusted action.
Deploying before the following migration would intentionally stop those app
features instead of giving a false sense of security.

## Required migration before deployment

1. Create callable Cloud Functions (or another authenticated server API) for
   `createOrUpdateSubject`, `markAttendance`, `approveOdmlRequest`,
   `resolveCorrectionRequest`, `adminEditAttendance`, and `deleteAccount`.
   Each must identify the caller from the Auth token, validate role, subject
   assignment, date/period, session state, and device/location policy on the
   server.
2. In one Admin SDK transaction or batch, have those functions update the
   authoritative attendance data, request status, and immutable audit event.
   Never accept `editorId`, role, attendance totals, or final status from the
   client as authority.
3. Replace the array-shaped `subjects` document with one document per student,
   subject, and attendance event. For example:

   ```text
   students/{studentId}/subjects/{subjectId}
   students/{studentId}/subjects/{subjectId}/attendance/{eventId}
   ```

   This allows rules and queries to scope access to one subject/event and
   prevents rewriting an entire academic history for one check-in.
4. Split an active session into public check-in metadata and a staff-only
   control document. The current `overridePin` is readable by any signed-in
   student who can fetch the session, even if the UI does not display it.
5. Move roles to Firebase Auth custom claims once staff provisioning is stable.
   Keep Firestore profile roles as display data only, or make every privileged
   rule depend on the claim. Provision the initial administrator only through
   the Admin SDK/Firebase Console.
6. Add emulator tests for both allowed and forbidden requests, then reference
   the rules from a root `firebase.json` and deploy in a staging Firebase
   project first.

## What the staged rules already protect

- self-signup cannot create an `ADMIN` or `FACULTY` profile;
- users cannot promote themselves, modify their role, or replace a device once
  it is bound;
- faculty assignment can be changed only by an administrator;
- faculty can operate sessions only for an assigned subject;
- students can submit a radar record only for themselves in an active session;
- OD/ML and correction requests are constrained to the requesting student;
- unknown collections default to deny.

The live radar remains informational. A device can falsify its GPS data and
device identifier, so it must never become the sole proof of attendance.
