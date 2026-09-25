# University Examination & Result Processing System

A focused university examination backend with a separate React web application. The system supports examination setup, component marks, result calculation, publishing, and PostgreSQL-backed bulk mark jobs without Redis.

## Repository structure
```text
api/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── errors/
│   ├── middleware/
│   ├── queues/
│   ├── repositories/
│   ├── routes/
│   └── services/
├── prisma/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── .env

web/
├── src/
│   ├── api/
│   ├── auth/
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── index.html
```

## Architecture
```text
web: React pages -> API client -> HTTP
                         |
api: routes -> controllers -> services -> repositories -> domain data
                         |
             bulk import -> pg-boss -> PostgreSQL -> progress records
```

Redis is intentionally not used. `pg-boss` provides durable PostgreSQL-backed jobs, retry handling, and queue locking. The current academic repositories are in-memory, so the demo worker runs in the API process. Once those repositories move fully to Prisma, the worker can be deployed independently and scaled horizontally.

## Web application
The web app contains:
- Signup page with a local evaluation account
- Login page with protected routing
- Exam workspace dashboard
- Examination setup flow
- Component mark entry and validation
- Result calculation and publishing
- API-integrated status and error states

The local account is intentionally lightweight and stored in browser local storage. It is not a replacement for production authentication.

## API endpoints
- `POST /api/programmes`
- `POST /api/students`
- `POST /api/courses`
- `POST /api/examinations`
- `POST /api/courses/:courseId/components`
- `POST /api/examinations/:examId/courses`
- `POST /api/examinations/:examId/enrollments`
- `POST /api/marks`
- `POST /api/marks/import`
- `GET /api/marks/import/:jobId`
- `POST /api/examinations/:examId/results/calculate`
- `POST /api/examinations/:examId/results/publish`
- `GET /api/examinations/:examId/results`
- `GET /health`

## Local development
Start the API:
```bash
cd api
npm install
npm run dev
```

Start the web app in another terminal:
```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite proxy forwards `/api` and `/health` to `http://localhost:4000`.

The API uses `api/.env`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/university_exam?schema=public
```

PostgreSQL is required for CSV queue processing and import-job status. The setup and result APIs currently use in-memory repositories while the database integration phase is being completed.

## Docker
```bash
cd api
docker compose up --build
```

## Verification
```bash
cd api
npm run build

cd ../web
npm run build
```

This project is intentionally not a complete ERP. It focuses on the examination and result-processing workflow described in the assignment.
