# Mahosample

Mahosample is a web application for free MAHO sample registrations, shipment tracking, and staff operations.

## Live Deployment

- Frontend: pending Render deployment
- API docs: pending Render deployment

## Tech Stack

- Backend: Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PostgreSQL 15
- Frontend: React 18, Vite 5, React Router, Tailwind CSS 3, axios
- Infrastructure: Docker Compose, GitHub Actions, Render Blueprint

## Quick Start (Local Dev)

### 1. Postgres

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\\Scripts\\activate
pip install -r requirements.txt
python -m alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Demo Accounts

บัญชีทดลอง เปิดเผยโดยเจตนา ไม่มีข้อมูลจริง

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin.demo@example.com | admin-password |
| Staff | staff.demo@example.com | staff-password |

Run the backend seed script after migrations to create these accounts locally.

## Project Structure

```text
backend/   FastAPI application, SQLAlchemy models, Alembic migrations, tests
frontend/  React Vite application
docs/      Project documentation
```

## Hostinger VPS Deployment

Production Docker Compose files for Hostinger VPS live in `deploy/hostinger`.
Use `docs/hostinger-vps-deploy.md` for the deploy steps and safety notes.

## Branching & Commit Convention

- Do not push directly to `main`.
- Create a feature branch from `main`.
- Commit with `feat:`, `fix:`, `docs:`, `test:`, or `chore:`.
- Open a pull request with a verification section.
- Merge with squash after CI passes.
