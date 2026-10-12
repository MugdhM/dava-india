# DawaiMitra Security Specification

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be read and written by the authenticated user whose `request.auth.uid == userId`.
2. **Patient Profile Invariant**: Patients in `/patients/{patientId}` must have `userId == request.auth.uid`. Users cannot read, list, update, or delete profiles belonging to other users.
3. **Prescription Invariant**: Prescriptions in `/prescriptions/{prescriptionId}` must be tied to `request.auth.uid`. Cross-user inspection or manipulation of sensitive medical prescriptions is strictly forbidden.
4. **Reminder Invariant**: Reminders in `/reminders/{reminderId}` must have `userId == request.auth.uid`.
5. **Vital Log Invariant**: Biometric logs in `/vitals/{vitalId}` must have `userId == request.auth.uid`.
6. **Appointment Invariant**: Hospital bookings in `/appointments/{appointmentId}` must have `userId == request.auth.uid`.
7. **Default Deny**: All unspecified paths are closed by default.

## 2. The "Dirty Dozen" Payloads (Adversarial Tests)
1. **ID Spoofing on Patient**: Attacker attempts to create a patient profile with `userId = "victim_uid"`. Expected: `PERMISSION_DENIED`.
2. **Path Traversal / Unbounded ID**: Attacker attempts to write to a document with a 2048-byte malicious ID or invalid characters. Expected: `PERMISSION_DENIED`.
3. **Ghost Field Injection**: Attacker injects unauthorized fields like `isAdmin: true` into a profile. Expected: `PERMISSION_DENIED`.
4. **Cross-Tenant Prescription Read**: User B attempts to read User A's prescription document. Expected: `PERMISSION_DENIED`.
5. **Unauthenticated List**: Unauthenticated caller attempts to list `/appointments`. Expected: `PERMISSION_DENIED`.
6. **Orphaned Reminder**: Attacker attempts to update a reminder changing `userId` to someone else. Expected: `PERMISSION_DENIED`.
7. **Blanket Query Scraping**: User attempts to list all patients without filtering by `userId == request.auth.uid`. Expected: `PERMISSION_DENIED`.
8. **Malicious Vital Injection**: Attacker injects a 5MB payload into a vital note field. Expected: `PERMISSION_DENIED`.
9. **Tampered Appointment Status**: Non-owner attempts to modify appointment status. Expected: `PERMISSION_DENIED`.
10. **Unauthenticated Write**: Guest attempt to write directly to `/prescriptions`. Expected: `PERMISSION_DENIED`.
11. **Spoofed Auth Email Verification**: Token with `email_verified: false` attempting privileged admin routes. Expected: `PERMISSION_DENIED`.
12. **Foreign Delete**: Attacker attempts to delete another patient's medical history. Expected: `PERMISSION_DENIED`.
