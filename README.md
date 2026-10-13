# TaskFlow

TaskFlow is a small task-management app built with React, Vite, Express, and MongoDB. It supports account registration and login, personal task lists, priorities, due dates, completion, search, and status filters.

## Requirements

- Node.js 20 or newer and npm
- A MongoDB server that you can connect to (local or hosted)

## Run locally

1. Install the backend dependencies:

   ```powershell
   cd server
   npm install
   ```

2. Create `server/.env` based on `server/.env.example`. Set `MONGODB_URI` to your MongoDB connection setting and `JWT_SECRET` to a long, random value. Keep `.env` private; it is excluded from Git.

3. Start the API in the `server` folder:

   ```powershell
   npm run dev
   ```

   The server listens on port 5000 by default. `GET /api/health` returns a small service status response after the database connection succeeds.

4. In a second terminal, install and start the client:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

   Open the local address printed by Vite. The Vite development server forwards `/api` requests to the local backend.

## Main API routes

- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/tasks` with optional `status`, `priority`, and `q` filters
- `POST /api/tasks`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id`, and `DELETE /api/tasks/:id`

Task routes require a bearer token. The API scopes task operations to the authenticated user. Passwords are hashed before they are stored.

## Manual acceptance checklist

- Register an account, sign out, then sign in with that account.
- Create a task with a title, notes, priority, status, and due date; edit it and verify the changes persist after reload.
- Mark the task completed, restore it to to-do, and delete it.
- Search by part of a title or note and filter by each status.
- Create a second account and confirm it cannot see or change the first account's tasks.
- Check the sign-in and dashboard layouts at desktop and narrow mobile widths.

There are no automated test scripts yet. Complete the checklist with a configured MongoDB server before relying on the full application flow.
