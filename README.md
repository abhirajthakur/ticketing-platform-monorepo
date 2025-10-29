# Event Ticketing Platform with Dynamic Pricing

A full-stack event ticketing platform featuring intelligent dynamic pricing that automatically adjusts based on time until event, booking velocity, and remaining inventory.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm 8+

## Tech Stack

**Frontend:**

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS

**Backend:**

- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL

**Monorepo:**

- Turborepo

## Installation

1. **Clone the repository**

```bash
   git clone https://github.com/abhirajthakur/ticketing-platform-monorepo
   cd ticketing-platform-monorepo
```

2. **Install dependencies**

```bash
   pnpm install
```

3. **Set up environment variables**

   Create `.env` files in the appropriate packages:

   **`apps/api/.env`**

```env
   DATABASE_URL=postgresql://user:password@localhost:5432/event_ticketing
   PORT=8000
   ADMIN_API_KEY=your_secret_admin_key

   # Pricing weights (sum should equal 1.0)
   PRICING_WEIGHT_TIME=0.4
   PRICING_WEIGHT_DEMAND=0.3
   PRICING_WEIGHT_INVENTORY=0.3
```

**`apps/web/.env.local`**

```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
```

**`packages/database/.env`**

```env
   DATABASE_URL=postgresql://user:password@localhost:5432/event_ticketing
```

4. **Set up the database**

```bash
   cd packages/database

   # Run migrations
   pnpm db:migrate

   # (Optional) Seed with sample data
   pnpm db:seed
```

## Running the Application

**Development mode (all services):**

```bash
pnpm dev
```

This starts:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## 🧪 Running Tests

First go to `apps/api` directory.
Make sure that the database is running.
Your can run using docker

```bash
docker run --name event_ticketing -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres
```

**All tests:**

```bash
pnpm test
```

**Integration tests:**

```bash
pnpm test:integration
```

**Concurrency tests:**

```bash
pnpm test:concurrency
```

**With coverage:**

```bash
pnpm test:coverage
```

The test suite includes:

- ✅ Unit tests for all pricing rules
- ✅ Integration tests for complete booking flow
- ✅ Concurrency tests proving no overbooking occurs
- ✅ 80%+ code coverage for pricing logic

## 📁 Project Structure

```
ticketing-platform-monorepo/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # API client & types
│   │   └── actions/        # Server actions
│   └── api/                # Express backend
│       ├── src/
│       │   ├── routes/     # API routes
│       │   ├── utils/      # Pricing engine
│       │   └── app.ts      # Express app
│       └── tests/          # Test files
├── packages/
│   └── database/           # Drizzle ORM setup
│       ├── src/
│       │   ├── schema.ts   # Database schema
│       │   ├── index.ts    # DB client export
│       │   └── seed.ts     # Seed script
│       └── drizzle/        # Migrations
└── package.json            # Root package.json
```

## 🎯 API Endpoints

### Events

- `GET /events` - List all events with current prices
- `GET /events/:id` - Get event details with price breakdown
- `POST /events` - Create new event (requires admin API key)

### Bookings

- `POST /bookings` - Book tickets
- `GET /bookings?email=:email` - Get bookings by email
- `GET /bookings?eventId=:id` - Get bookings for an event

### Analytics

- `GET /analytics/events/:id` - Event metrics
- `GET /analytics/summary` - System-wide metrics

### Development

- `POST /seed` - Seed database with sample events

## 🔐 Authentication

**Admin Panel:**

- Simple API key authentication
- Header: `X-API-Key: your_secret_admin_key`
- Used for creating events

**User Bookings:**

- No authentication required
- Email-based booking retrieval

## 💰 Dynamic Pricing Algorithm

The pricing engine uses a weighted formula:

```
currentPrice = basePrice × (1 + Σ(adjustment × weight))
```

**Three Adjustment Rules:**

1. **Time-Based** (default weight: 0.4)
   - 30+ days: No adjustment (0%)
   - 7-30 days: +20%
   - 0-1 day: +50%

2. **Demand-Based** (default weight: 0.3)
   - ≤10 bookings/hour: No adjustment (0%)
   - > 10 bookings/hour: +15%

3. **Inventory-Based** (default weight: 0.3)
   - > 20% tickets remaining: No adjustment (0%)
   - <20% tickets remaining: +25%

**Constraints:**

- Price never goes below `priceFloor`
- Price never exceeds `priceCeiling`

**Customization:**
Adjust weights in `.env` (must sum to 1.0):

```env
PRICING_WEIGHT_TIME=0.5
PRICING_WEIGHT_DEMAND=0.3
PRICING_WEIGHT_INVENTORY=0.2
```

## 🛡️ Concurrency Control

The system prevents overselling using PostgreSQL row-level locking:

```typescript
// Atomic booking transaction with lock
const [event] = await tx
  .select()
  .from(events)
  .where(eq(events.id, eventId))
  .for("update"); // <-- Row-level lock

// Check availability
if (available < quantity) {
  throw new Error("Not enough tickets");
}

// Create booking and update inventory atomically
```

This ensures that when multiple users try to book the last ticket simultaneously, exactly one succeeds.

## 🎨 Frontend Pages

- `/` - Landing page
- `/events` - Browse all events
- `/events/[id]` - Event details with booking form
- `/bookings/success` - Booking confirmation
- `/my-bookings` - View your bookings
- `/admin` - Admin panel (create events)

## Sample Data

Run the seed script to populate with sample events:

```bash
cd packages/database
pnpm db:seed
```

## 📝 Environment Variables Documentation

### Backend (`apps/api/.env`)

| Variable                   | Description                    | Required | Default |
| -------------------------- | ------------------------------ | -------- | ------- |
| `DATABASE_URL`             | PostgreSQL connection string   | Yes      | -       |
| `PORT`                     | API server port                | No       | 8000    |
| `ADMIN_API_KEY`            | Admin authentication key       | Yes      | -       |
| `PRICING_WEIGHT_TIME`      | Time-based pricing weight      | No       | 0.4     |
| `PRICING_WEIGHT_DEMAND`    | Demand-based pricing weight    | No       | 0.3     |
| `PRICING_WEIGHT_INVENTORY` | Inventory-based pricing weight | No       | 0.3     |

### Frontend (`apps/web/.env.local`)

| Variable              | Description     | Required | Default               |
| --------------------- | --------------- | -------- | --------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | No       | http://localhost:8000 |
