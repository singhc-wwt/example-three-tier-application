# example-three-tier-application

A reference implementation of a three-tier web application: a Next.js frontend, an Express REST API, and a PostgreSQL database. It runs locally with Docker Compose and deploys to Google Cloud Platform (Cloud Run + Cloud SQL) via Terraform.

## Architecture

```
Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL
```

| Layer | Technology | Location |
|-------|-----------|----------|
| Frontend | Next.js 16, React 19, Tailwind CSS | `src/web/` |
| API | Express 5, Node.js 22 | `src/api/` |
| Database | PostgreSQL 17 | managed by Docker / Cloud SQL |
| Migrations | node-pg-migrate | `src/db/` |
| Infrastructure | Terraform (GCP) | `src/infrastructure/` |

The app is a simple task manager (to-do list) that demonstrates how the three tiers communicate.

## Running locally with Docker Compose

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)

### Start the stack

```bash
docker compose up --build
```

This starts four services in order:

1. **postgres** — PostgreSQL 17 database, waits until healthy
2. **migrate** — runs `node-pg-migrate up` to apply schema migrations, then exits
3. **api** — Express API on port 3001 (internal only)
4. **web** — Next.js frontend on port 3000 (exposed to host)

Once running, open [http://localhost:3000](http://localhost:3000).

### Stop and clean up

```bash
# Stop containers (keeps the postgres_data volume)
docker compose down

# Stop and delete all data
docker compose down -v
```

### Rebuild after code changes

```bash
docker compose up --build
```

### API endpoints

The API is not exposed directly, but you can reach it through the web container or by temporarily mapping its port:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create a task (`{ "title": "..." }`) |
| PATCH | `/tasks/:id` | Update a task (`{ "completed": true }` or `{ "title": "..." }`) |
| DELETE | `/tasks/:id` | Delete a task by ID |

#### DELETE /tasks/:id

Deletes a task by its ID.

**Request:**
- Path parameter: `id` (integer) — the task ID to delete

**Response:**
- **200 OK** — Task successfully deleted; returns the deleted task object
- **404 Not Found** — Task with the given ID does not exist

**Example:**
```bash
curl -X DELETE http://localhost:3001/tasks/1
```

**Response (200):**
```json
{
  "id": 1,
  "title": "Buy groceries",
  "completed": false,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Response (404):**
```json
{
  "error": "Not found"
}
```

## Testing

To run tests for the API and web frontend:

```bash
# Run tests in the API
cd src/api
npm test

# Run tests in the web frontend
cd src/web
npm test
```

Tests are configured in each service's `package.json`. Add test files alongside your source code and update the test scripts as needed.

## Project structure

```
src/
├── api/            # Express REST API
│   ├── index.js    # Route handlers
│   ├── db.js       # PostgreSQL connection pool
│   └── Dockerfile
├── db/             # Database migrations
│   ├── migrations/ # node-pg-migrate migration files
│   └── Dockerfile
├── web/            # Next.js frontend
│   ├── app/        # App Router pages and components
│   └── Dockerfile
└── infrastructure/ # Terraform for GCP deployment
    ├── main.tf
    ├── variables.tf
    └── outputs.tf
```

## Deploying to GCP

The `src/infrastructure/` directory contains Terraform that provisions:

- VPC network and subnet
- Cloud SQL PostgreSQL 17 instance (private IP)
- Cloud Run services for the API and web frontend
- Secret Manager secret for the database URL
- Service accounts and IAM bindings

### Required variables

| Variable | Description |
|----------|-------------|
| `project_id` | GCP project ID |
| `api_image` | Container image URI for the API (e.g. `gcr.io/PROJECT/api:TAG`) |
| `web_image` | Container image URI for the web frontend |
| `region` | GCP region (default: `us-central1`) |
| `environment` | `dev`, `staging`, or `prod` (default: `dev`) |

```bash
cd src/infrastructure
terraform init
terraform apply -var="project_id=my-project" \
                -var="api_image=gcr.io/my-project/api:latest" \
                -var="web_image=gcr.io/my-project/web:latest"
```

After apply, `terraform output web_url` gives the public URL.

## Database migrations

Migrations live in `src/db/migrations/` and use [node-pg-migrate](https://salsita.github.io/node-pg-migrate/).

```bash
# Apply all pending migrations (run inside the db container or with DATABASE_URL set)
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate up

# Roll back the last migration
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate down
```

When running via Docker Compose the `migrate` service handles this automatically on startup.

## Troubleshooting

### Port already in use

**Problem:** `docker compose up` fails with "port 3000 is already allocated" or similar error.

**Solution:** Either stop the process using the port or map to a different port:
```bash
# Option 1: Stop the conflicting service
lsof -i :3000  # Find the process
kill -9 <PID>

# Option 2: Use a different port in docker-compose.yml
# Change "3000:3000" to "3001:3000" (or any available port)
```

### Database connection errors

**Problem:** API or web container fails to start with "connection refused" or "ECONNREFUSED" errors.

**Solution:** Ensure the PostgreSQL service is healthy before other services start:
```bash
# Check service status
docker compose ps

# View logs for the postgres service
docker compose logs postgres

# Restart the entire stack
docker compose down -v
docker compose up --build
```

### Migrations fail to run

**Problem:** The `migrate` service exits with an error, preventing the API from starting.

**Solution:** Check the migration logs and verify the database schema:
```bash
# View migration logs
docker compose logs migrate

# Manually run migrations (if needed)
docker compose exec postgres psql -U app -d app -c "\dt"  # List tables

# Reset and retry
docker compose down -v
docker compose up --build
```

### Frontend cannot reach the API

**Problem:** The web frontend shows errors like "Failed to fetch" or "Cannot reach API".

**Solution:** Verify the `API_URL` environment variable and network connectivity:
```bash
# Check the API_URL in docker-compose.yml (should be http://api:3001)
# Verify the API is running
docker compose logs api

# Test API connectivity from the web container
docker compose exec web curl http://api:3001/health
```

### Terraform deployment fails

**Problem:** `terraform apply` fails with authentication or resource errors.

**Solution:** Verify GCP credentials and project configuration:
```bash
# Ensure you're authenticated with GCP
gcloud auth application-default login

# Verify the project ID
gcloud config get-value project

# Check Terraform state
cd src/infrastructure
terraform state list
terraform state show <resource_name>
```

