# Daynest

Full-stack internship habit and daily goal tracker. The backend uses Node.js, Express, and MongoDB/Mongoose; the responsive frontend uses React and Vite.

## Requirements

- Node.js 20 or newer
- MongoDB running locally, or a MongoDB connection URI

## Run locally

```bash
npm install
cp .env.example .env
# Set MONGODB_URI in .env if you are not using the local default.
npm run dev
```

The API starts at `http://localhost:5000`. Configure `CLIENT_ORIGIN` as a comma-separated list when the frontend runs on different origins. Dates use `YYYY-MM-DD` in UTC.

In another terminal, start the frontend:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173` and uses `VITE_API_URL` to connect to the API. Its interface is designed mobile-first from the supplied visual references and includes habit creation, completion toggles, day navigation, progress summaries, archive actions, and graceful API error messages.

## API

All successful responses are JSON unless the response is `204 No Content`. Errors use `{ "error": { "message": "..." } }`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health check |
| GET | `/api/habits?date=YYYY-MM-DD` | List active habits and their completion for a date |
| GET | `/api/habits?includeArchived=true` | Include archived habits |
| POST | `/api/habits` | Create a habit |
| GET | `/api/habits/:id` | Get one habit |
| PATCH | `/api/habits/:id` | Edit habit fields or archive it |
| DELETE | `/api/habits/:id` | Delete habit and its check-in history |
| PUT | `/api/habits/:id/check-ins/:date` | Mark a date complete; send `{ "completed": false }` to undo |
| GET | `/api/habits/:id/check-ins?from=YYYY-MM-DD&to=YYYY-MM-DD` | Read a habit's calendar history (defaults to the last 30 days) |
| GET | `/api/dashboard?date=YYYY-MM-DD` | Daily totals, last seven days, and per-habit streaks |

### Example requests

Create a habit:

```json
{
  "name": "Read",
  "description": "Read for 20 minutes",
  "color": "#6366f1",
  "schedule": [1, 2, 3, 4, 5]
}
```

Weekdays use `0` for Sunday through `6` for Saturday. Omit `schedule` to make the habit scheduled every day.

Complete today's check-in:

```json
{ "completed": true, "note": "Finished a chapter" }
```

## Data model

- **Habit** stores the name, description, display color, weekday schedule, archive state, and timestamps.
- **CheckIn** stores a habit reference, UTC calendar date, completion state, optional note, and timestamps. A unique compound index prevents duplicate check-ins for one habit and date.

## Structure

```text
client/
  src/api.js
  src/main.jsx
  src/styles.css
  index.html
  vite.config.js
src/
  config/db.js
  middleware/errors.js
  models/Habit.js
  models/CheckIn.js
  routes/habits.js
  routes/dashboard.js
  utils/dates.js
  app.js
  server.js
```
