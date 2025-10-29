import express from "express";
import { db } from "@repo/database";
import { events, bookings } from "@repo/database/src/schema";

const router: express.Router = express.Router();

const sampleEvents = [
  {
    name: "Summer Music Festival 2025",
    description:
      "A spectacular outdoor music festival featuring top artists from around the world. Experience three days of non-stop entertainment with multiple stages, food vendors, and camping options.",
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    venue: "Riverside Park Amphitheater",
    totalTickets: 5000,
    bookedTickets: 1250,
    priceFloor: 75,
    priceCeiling: 300,
    pricingRules: { basePrice: 150, demandThreshold: 0.8, increaseRate: 0.15 },
  },
  {
    name: "Tech Innovation Conference 2025",
    description:
      "Join industry leaders and innovators for a full-day conference exploring the latest trends in AI, blockchain, and sustainable technology. Includes networking sessions and hands-on workshops.",
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    venue: "Downtown Convention Center",
    totalTickets: 800,
    bookedTickets: 320,
    priceFloor: 100,
    priceCeiling: 500,
    pricingRules: { basePrice: 250, demandThreshold: 0.9, increaseRate: 0.2 },
  },
  {
    name: "Broadway Musical: Starlight Dreams",
    description:
      "An enchanting new Broadway musical that tells the story of dreams, love, and perseverance. Winner of 5 Tony Awards with stunning choreography and unforgettable songs.",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    venue: "Grand Theater",
    totalTickets: 1200,
    bookedTickets: 960,
    priceFloor: 50,
    priceCeiling: 250,
    pricingRules: { basePrice: 125, demandThreshold: 0.85, increaseRate: 0.12 },
  },
  {
    name: "Food & Wine Festival",
    description:
      "Celebrate culinary excellence with renowned chefs, wine tastings, cooking demonstrations, and gourmet food from local restaurants. A paradise for food enthusiasts.",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    venue: "Waterfront Plaza",
    totalTickets: 2000,
    bookedTickets: 600,
    priceFloor: 40,
    priceCeiling: 150,
    pricingRules: { basePrice: 80, demandThreshold: 0.75, increaseRate: 0.1 },
  },
  {
    name: "Stand-Up Comedy Night",
    description:
      "An evening of laughter with three of the country's funniest comedians. Perfect for date night or a fun evening out with friends. Ages 18+ only.",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    venue: "Comedy Club Downtown",
    totalTickets: 300,
    bookedTickets: 180,
    priceFloor: 25,
    priceCeiling: 80,
    pricingRules: { basePrice: 45, demandThreshold: 0.8, increaseRate: 0.08 },
  },
  {
    name: "Classical Orchestra Concert",
    description:
      "The City Symphony Orchestra presents an evening of classical masterpieces including Beethoven's 9th Symphony and Mozart's Piano Concerto No. 21.",
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    venue: "Symphony Hall",
    totalTickets: 1500,
    bookedTickets: 450,
    priceFloor: 30,
    priceCeiling: 200,
    pricingRules: { basePrice: 85, demandThreshold: 0.9, increaseRate: 0.15 },
  },
  {
    name: "Art Gallery Opening: Modern Visions",
    description:
      "Exclusive opening night for a groundbreaking exhibition featuring contemporary artists from around the globe. Includes wine reception and artist meet-and-greet.",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    venue: "Metropolitan Art Museum",
    totalTickets: 400,
    bookedTickets: 280,
    priceFloor: 35,
    priceCeiling: 120,
    pricingRules: { basePrice: 65, demandThreshold: 0.85, increaseRate: 0.1 },
  },
  {
    name: "Sports Championship Finals",
    description:
      "The ultimate showdown between the city's top teams. Championship game with playoff implications. Stadium atmosphere guaranteed to be electric!",
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
    venue: "City Sports Stadium",
    totalTickets: 8000,
    bookedTickets: 6400,
    priceFloor: 60,
    priceCeiling: 400,
    pricingRules: { basePrice: 180, demandThreshold: 0.9, increaseRate: 0.25 },
  },
];

router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (process.env.ADMIN_API_KEY && apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: "Unauthorized: Invalid API key" });
    }

    await db.delete(bookings);
    await db.delete(events);

    const insertedEvents = await db
      .insert(events)
      .values(sampleEvents)
      .returning();

    const sampleBookings = [
      {
        eventId: insertedEvents[0]?.id as string,
        userEmail: "alice.johnson@example.com",
        quantity: 4,
        pricePaid: 600,
        bookedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        eventId: insertedEvents[0]?.id as string,
        userEmail: "bob.smith@example.com",
        quantity: 2,
        pricePaid: 320,
        bookedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        eventId: insertedEvents[1]?.id as string,
        userEmail: "carol.davis@example.com",
        quantity: 1,
        pricePaid: 275,
        bookedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        eventId: insertedEvents[1]?.id as string,
        userEmail: "david.wilson@example.com",
        quantity: 3,
        pricePaid: 750,
        bookedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        eventId: insertedEvents[2]?.id as string,
        userEmail: "emma.brown@example.com",
        quantity: 2,
        pricePaid: 280,
        bookedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        eventId: insertedEvents[3]?.id as string,
        userEmail: "frank.miller@example.com",
        quantity: 2,
        pricePaid: 180,
        bookedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
      {
        eventId: insertedEvents[3]?.id as string,
        userEmail: "grace.taylor@example.com",
        quantity: 1,
        pricePaid: 85,
        bookedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
    ];

    await db.insert(bookings).values(sampleBookings);

    res.status(201).json({
      message: "Database seeded successfully",
      summary: {
        eventsCreated: insertedEvents.length,
        bookingsCreated: sampleBookings.length,
      },
      events: insertedEvents.map((event) => ({
        id: event.id,
        name: event.name,
        venue: event.venue,
        date: event.date,
        totalTickets: event.totalTickets,
        bookedTickets: event.bookedTickets,
      })),
    });
  } catch (error) {
    console.error("Seeding error:", error);
    res.status(500).json({
      error: "Failed to seed database",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
