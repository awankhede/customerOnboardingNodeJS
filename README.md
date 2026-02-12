### README

#### Overview
- Stack: Node.js, Express 5, Axios, Zod, Jest, Supertest.
- Purpose: Accept customer onboarding payloads and forward them to an external ingestion service.
- Entrypoint: `src/app.js` (exports `app` and starts server only when run directly).
- Routes: found under `/api` via `src/routes/onboard.js`.
- Logging: simple JSON logger in `src/utils/logger.js`.
- Tests: `tests/app.test.js` covers success, validation error, and ingestion failure paths.

#### Endpoints
- GET `/api/healthcheck`
  - Returns HTTP 200 for liveness.
- POST `/api/onboardCustomer`
  - Expects JSON body with `firstName`, `lastName`, `email`.
  - Forwards body to ingestion service (`src/services/ingestionService.js`).
  - Responses:
    - 200 on success (if procesed within 1 ms)
    - 202 if downstream ingestion API takes >1ms 
    - 400 when required fields are missing
    - 500 when ingestion fails

#### Forbright Customer Onboarding
A minimal Express service that accepts customer onboarding requests and forwards them to an external ingestion service.

#### Requirements
- Node.js 18 or newer (recommended)
- npm

#### Installation
```bash
# from the project root
npm install

#### Running the application
```bash
npm start
```
- The server starts on port 3000 by default.
- Base URL: `http://localhost:3000/api`

Note: The port is currently fixed to 3000 in code. If you need a different port, update `src/app.js` to read from `process.env.PORT`.

#### API
1) Health Check
```http
GET /api/healthcheck
```
- Response: `200 OK`

2) Onboard Customer
```http
POST /api/onboardCustomer
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com"
}
```
- Success: `200 OK`
- Validation error (missing fields): `400 Bad Request`
- Upstream failure: `500 Internal Server Error`
```

#### Configuration
- Timeout to the ingestion service is currently 5000 ms.
- JSON request body limit: 5 MB (configured via `express.json({ limit: '5mb' })`).


#### Logging
- Logs are emitted as JSON to stdout via `src/utils/logger.js` with levels `info` and `error`.
- Example log line:
```json
{"level":"info","message":"Server running on port: 3000","timestamp":"2026-02-12T12:14:00.000Z"}
```

#### Testing
- Tests are written with Jest and Supertest.
- Run tests:
```bash
npm test
```
- What’s covered:
  - `200` when ingestion succeeds
  - `400` when required fields are missing
  - `500` when ingestion fails
- Tests mock the ingestion service (`src/services/ingestionService.js`) to avoid real network calls.

#### Known limitations & suggested improvements
- Externalize ingestion endpoint and timeout to environment variables (e.g., `INGESTION_URL`, `INGESTION_TIMEOUT_MS`).
- Add request ID correlation in logs for traceability.
- Add retry logic to handle service call timeouts

#### Troubleshooting
- `npm: command not found`: Install Node.js (which includes npm) or use a Node version manager like `nvm`.
- Requests fail with `500`: The configured ingestion URL is a placeholder; set a reachable endpoint or mock it during local runs.
- Getting `413 Payload Too Large`: The JSON parser is limited to 5 MB; reduce payload size or increase the limit in `src/app.js`.

#### SQL Queries

```json
{customers {"firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "created_at": ""2026-02-12T18:55:53.937Z""}}
```

- Write a query to retrieve the 10 most recently onboarded customers.
  - SELECT *
    FROM customers
    ORDER BY created_at DESC
    LIMIT 10;
- Write a query that filter all customers with emails from @gmail.com
  - SELECT *
    FROM customers
    WHERE email LIKE '%@gmail.com';
- Write a query that shows the number of customers created per month in 2025.
  - SELECT 
    DATE_FORMAT(created_at, '%Y-%m') AS month,
    COUNT(*) AS customer_count
    FROM customers
    WHERE YEAR(created_at) = 2025
    GROUP BY month
    ORDER BY month;
- Write a query to find all email addresses that appear more than once.
  - SELECT email
    FROM customers
    GROUP BY email
    HAVING COUNT(*) > 1;
- Write a query to find all customers whose first name starts with “A”.
  - SELECT *
    FROM customers
    WHERE first_name LIKE 'A%';
