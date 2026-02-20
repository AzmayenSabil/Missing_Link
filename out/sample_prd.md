# Feature: User Profile Management

## Overview

We need to implement a user profile management feature that allows administrators
and end users to view and update their profile information.

## Requirements

### 1. Profile View Page

- Create a new **ProfilePage** component under `pages/profile`.
- Show user avatar, name, email, role, and last login timestamp.
- Fetch data from the `/api/users/:id` endpoint using the existing API client.

### 2. Profile Edit Form

- Add an inline edit form with validation.
- Fields: `displayName`, `email`, `phoneNumber`, `timezone`.
- On save, call `PATCH /api/users/:id` and update the Redux store via `userSlice`.

### 3. Avatar Upload

- Allow users to upload a profile picture.
- Use `useFileUpload` hook (TBD – to be confirmed with backend team).
- Maybe store in S3 or the existing CDN – unknown at this stage.

### 4. Auth / Permissions

- Only authenticated users can access `/profile`.
- Admin role should be able to edit any user profile.
- Regular users should only edit their own profile.
- Integrate with the existing `authSlice` and route guards.

### 5. Notifications

- Show a toast notification on successful save or error.
- Reuse the existing `NotificationService`.

## Outstanding Items

- TBD: Should the profile page support i18n from day one?
- TBA: Mobile responsive layout requirements.
- The file storage solution for avatars is still unknown.

## Acceptance Criteria

- Unit tests for `ProfilePage`, `useFileUpload` hook, and `userSlice` reducer.
- E2E test covering the edit and save flow.
