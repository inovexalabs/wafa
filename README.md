# WAFA

WAFA is a workspace containing a Next.js web app and a NestJS API.

## Project structure

| Directory         | Purpose                                  | Development command   |
| ----------------- | ---------------------------------------- | --------------------- |
| [`app/`](app/)   | Frontend web application                 | `npm run dev`       |
| [`api/`](api/)   | Backend API service                      | `npm run start:dev` |
| [`docs/`](docs/) | Project documents and reference material | â€”                    |

## Requirements

- Node.js
- npm

## Run the frontend

```bash
cd app
npm install
npm run dev
```

The frontend runs on the local Next.js development server.

## Run the backend

```bash
cd api
npm install
npm run start:dev
```

The API listens on `PORT` when provided, or port `3001` by default.

## Validation

```bash
cd app
npm run lint

cd ../api
npm run build
```

## Documentation

Project documents are stored in [`docs/`](docs/). Keep source documents and finalized references there; temporary exports and editor lock files are ignored by the shared Git configuration.

Current reference material:

- [Project document â€” September 12, 2026](<docs/Created%20on%20September%2012%2C%202026.pdf>)


## Backend and database setup

The backend uses Supabase Auth and Postgres. Copy `api/.env.example` to `api/.env` and fill in the Supabase project URL and server-only service role key.

Apply the migration to your Supabase project through the Supabase SQL editor or CLI:

```bash
npx supabase db push
```

Create the initial superadmin in Supabase Auth, then add its profile in the SQL editor:

```sql
insert into public.profiles (id, user_id, email, role)
values ('AUTH_USER_UUID', 'superadmin', 'superadmin@example.com', 'superadmin');
```

Run the API:

```bash
cd api
npm run start:dev
```

Available endpoints:

- `POST /api/auth/login` — sign in with `userId` and `password`
- `POST /api/auth/users` — superadmin creates admins; admins create members/accountants
