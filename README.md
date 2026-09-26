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

Redis is intentionally not used. `pg-boss` provides durable PostgreSQL-backed jobs, retry handling, and queue locking. Academic records and import-job records are persisted through Prisma/PostgreSQL. The demo worker currently runs in the API process; it can be deployed independently after moving uploaded files from local temporary storage to shared object storage.

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
- `POST /api/marks/import` with multipart field `file` containing a `.csv` file
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

PostgreSQL is required for all API persistence, CSV queue processing, and import-job status.

CSV imports are streamed by the worker and processed in progress batches. The expected header is:
```csv
examId,studentId,courseId,componentId,value
```
Excel and Google Sheets files should be exported as CSV before upload.

A 10,000-row load-test fixture is available at `api/marks-10000.csv`. Its rows use placeholder IDs intentionally, so uploading it without replacing those IDs will produce validation failures while still testing file size, queueing, streaming, progress tracking, and failure handling. Generate a fresh copy with:
```bash
cd api
node scripts/generate-10k-marks-csv.mjs marks-10000.csv
```

For successful imports, use IDs returned by the setup APIs or download/export a CSV containing real `examId`, `studentId`, `courseId`, and `componentId` values from your current database/workspace. Each mark key (`examId + studentId + courseId + componentId`) must be unique.

## Database access
With PostgreSQL running and `api/.env` configured:
```bash
cd api
npm run db:migrate
```

Open Prisma Studio to browse and edit tables:
```bash
cd api
npm run db:studio
```

It normally opens at `http://localhost:5555`. You can also inspect tables directly with PostgreSQL:
```bash
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d university_exam
```

Useful commands inside `psql`:
```sql
\dt
\d "Student"
SELECT * FROM "Programme";
SELECT * FROM "Result";
\q
```

The initial migration is stored under `api/prisma/migrations/`.

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
