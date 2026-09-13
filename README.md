# WAFA

WAFA is a workspace containing a Next.js web app and a NestJS API.

## Project structure

| Directory | Purpose | Development command |
| --- | --- | --- |
| [`app/`](app/) | Frontend web application | `npm run dev` |
| [`api/`](api/) | Backend API service | `npm run start:dev` |
| [`docs/`](docs/) | Project documents and reference material | — |

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

The API listens on `PORT` when provided, or port `3000` by default.

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

- [Project document — September 12, 2026](docs/Created%20on%20September%2012%2C%202026.pdf)
