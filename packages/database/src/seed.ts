import { randomUUID } from "crypto";
import { db } from "./index";
import { bookings, events } from "./schema";

async function seed() {
  await db.delete(bookings).execute();
  await db.delete(events).execute();

  const event1Id = randomUUID();
  await db
    .insert(events)
    .values([
      {
        id: event1Id,
        name: "Music Fest 2025",
        date: new Date("2025-11-20T19:00:00Z"),
        venue: "Open Air Theater",
        description: "A grand music festival featuring top artists.",
        totalTickets: 1000,
        bookedTickets: 150,
        priceFloor: 20.0,
        priceCeiling: 100.0,
        pricingRules: { basePrice: 50.0, demandThreshold: 0.8, increaseRate: 0.1 },
      },
      {
        id: randomUUID(),
        name: "Tech Conference 2025",
        date: new Date("2025-12-05T09:00:00Z"),
        venue: "Convention Center",
        description: "Annual conference on the latest technology trends.",
        totalTickets: 500,
        bookedTickets: 50,
        priceFloor: 50.0,
        priceCeiling: 300.0,
        pricingRules: { basePrice: 150.0, demandThreshold: 0.9, increaseRate: 0.15 },
      },
    ])
    .execute();

  await db
    .insert(bookings)
    .values([
      {
        eventId: event1Id,
        userEmail: "alice@example.com",
        quantity: 2,
        pricePaid: 40.0,
      },
      {
        eventId: event1Id,
        userEmail: "bob@example.com",
        quantity: 1,
        pricePaid: 50.0,
      },
    ])
    .execute();
}

seed()
  .then(() => {
    console.log("Database seeded successfully");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
