import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";
import { db, eq } from "@repo/database";
import { events, bookings } from "@repo/database/src/schema";

describe("Concurrency Control - MANDATORY TEST", () => {
  it("prevents overbooking of last ticket - exactly 1 succeeds, 1 fails", async () => {
    const [event] = await db
      .insert(events)
      .values({
        name: "Concurrency Test Event",
        description: "Testing concurrent bookings",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        venue: "Test Venue",
        totalTickets: 10,
        bookedTickets: 9, // Only 1 ticket left
        priceFloor: 50,
        priceCeiling: 150,
        pricingRules: { basePrice: 50 },
      })
      .returning();

    const testEventId = event.id;

    const [result1, result2] = await Promise.all([
      request(app).post("/bookings").send({
        eventId: testEventId,
        userEmail: "user1@example.com",
        quantity: 1,
      }),
      request(app).post("/bookings").send({
        eventId: testEventId,
        userEmail: "user2@example.com",
        quantity: 1,
      }),
    ]);

    const responses = [result1, result2];
    const successCount = responses.filter((r) => r.status === 201).length;
    const failCount = responses.filter((r) => r.status === 400).length;

    expect(successCount).toBe(1);
    expect(failCount).toBe(1);

    const failedResponse = responses.find((r) => r.status !== 201);
    expect(failedResponse?.body.error).toMatch(
      /not enough tickets|insufficient tickets/i,
    );

    const [finalEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, testEventId));

    expect(finalEvent.bookedTickets).toBe(10); // Should be exactly 10, not 11
    expect(finalEvent.totalTickets - finalEvent.bookedTickets).toBe(0);

    const allBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.eventId, testEventId));

    expect(allBookings).toHaveLength(1);
  });

  it("prevents overbooking with multiple concurrent requests", async () => {
    const [multiEvent] = await db
      .insert(events)
      .values({
        name: "Multi Booking Test",
        description: "Testing multiple concurrent bookings",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        venue: "Test Venue",
        totalTickets: 5,
        bookedTickets: 2,
        priceFloor: 50,
        priceCeiling: 150,
        pricingRules: { basePrice: 50 },
      })
      .returning();

    const multiEventId = multiEvent.id;

    const bookingPromises = Array.from({ length: 6 }, (_, i) =>
      request(app)
        .post("/bookings")
        .send({
          eventId: multiEventId,
          userEmail: `concurrent${i}@example.com`,
          quantity: 1,
        }),
    );

    const results = await Promise.all(bookingPromises);

    const successCount = results.filter((r) => r.status === 201).length;
    expect(successCount).toBe(3);

    const failCount = results.filter((r) => r.status === 400).length;
    expect(failCount).toBe(3);

    const [finalEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, multiEventId));

    expect(finalEvent.bookedTickets).toBe(5); // 2 initial + 3 successful bookings
    expect(finalEvent.totalTickets - finalEvent.bookedTickets).toBe(0);
  });

  it("handles race condition with quantity > 1", async () => {
    const [raceEvent] = await db
      .insert(events)
      .values({
        name: "Race Condition Test",
        description: "Testing race with quantity > 1",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        venue: "Test Venue",
        totalTickets: 10,
        bookedTickets: 8,
        priceFloor: 50,
        priceCeiling: 150,
        pricingRules: { basePrice: 50 },
      })
      .returning();

    const raceEventId = raceEvent.id;

    const [result1, result2] = await Promise.all([
      request(app).post("/bookings").send({
        eventId: raceEventId,
        userEmail: "race1@example.com",
        quantity: 2,
      }),
      request(app).post("/bookings").send({
        eventId: raceEventId,
        userEmail: "race2@example.com",
        quantity: 2,
      }),
    ]);

    const responses = [result1, result2];
    const successCount = responses.filter((r) => r.status === 201).length;

    expect(successCount).toBe(1);

    const [finalEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, raceEventId));

    expect(finalEvent.bookedTickets).toBeLessThanOrEqual(
      finalEvent.totalTickets,
    );
    expect(finalEvent.bookedTickets).toBe(10);
  });
});
