import { db } from "@repo/database";
import { bookings, events } from "@repo/database/src/schema";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

describe("Analytics Routes", () => {
  describe("GET /analytics/events/:id", () => {
    it("should return analytics for a specific event with bookings", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Analytics Test Event",
          description: "Event for analytics testing",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 30,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      // Create test bookings
      await db.insert(bookings).values([
        {
          eventId: event.id,
          userEmail: "user1@example.com",
          quantity: 10,
          pricePaid: 500,
          bookedAt: new Date(),
        },
        {
          eventId: event.id,
          userEmail: "user2@example.com",
          quantity: 20,
          pricePaid: 1200,
          bookedAt: new Date(),
        },
      ]);

      const response = await request(app).get(`/analytics/events/${event.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        eventId: event.id,
        totalSold: 30,
        remaining: 70,
        totalRevenue: 1700,
        avgPrice: 850,
      });
    });

    it("should return analytics for event with no bookings", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "No Bookings Event",
          description: "Event with no bookings",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 50,
          bookedTickets: 0,
          priceFloor: 30,
          priceCeiling: 100,
          pricingRules: { basePrice: 30 },
        })
        .returning();

      const response = await request(app).get(`/analytics/events/${event.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        eventId: event.id,
        totalSold: 0,
        remaining: 50,
        totalRevenue: 0,
        avgPrice: 0,
      });
    });

    it("should return 404 for non-existent event", async () => {
      const response = await request(app).get(
        "/analytics/events/550e8400-e29b-41d4-a716-446655440000",
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Event not found");
    });

    it("should handle partial bookings correctly", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Partial Bookings Event",
          description: "Event with partial bookings",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 15,
          priceFloor: 40,
          priceCeiling: 120,
          pricingRules: { basePrice: 40 },
        })
        .returning();

      await db.insert(bookings).values({
        eventId: event.id,
        userEmail: "partial@example.com",
        quantity: 15,
        pricePaid: 750,
        bookedAt: new Date(),
      });

      const response = await request(app).get(`/analytics/events/${event.id}`);

      expect(response.status).toBe(200);
      expect(response.body.totalSold).toBe(15);
      expect(response.body.remaining).toBe(85);
      expect(response.body.totalRevenue).toBe(750);
      expect(response.body.avgPrice).toBe(750);
    });
  });

  describe("GET /analytics/summary", () => {
    it("should return overall platform summary", async () => {
      // Create multiple events
      const [event1] = await db
        .insert(events)
        .values({
          name: "Summary Event 1",
          description: "First event for summary",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Venue 1",
          totalTickets: 100,
          bookedTickets: 50,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const [event2] = await db
        .insert(events)
        .values({
          name: "Summary Event 2",
          description: "Second event for summary",
          date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          venue: "Venue 2",
          totalTickets: 200,
          bookedTickets: 75,
          priceFloor: 30,
          priceCeiling: 100,
          pricingRules: { basePrice: 30 },
        })
        .returning();

      await db.insert(bookings).values([
        {
          eventId: event1.id,
          userEmail: "summary1@example.com",
          quantity: 25,
          pricePaid: 1250,
          bookedAt: new Date(),
        },
        {
          eventId: event1.id,
          userEmail: "summary2@example.com",
          quantity: 25,
          pricePaid: 1375,
          bookedAt: new Date(),
        },
        {
          eventId: event2.id,
          userEmail: "summary3@example.com",
          quantity: 75,
          pricePaid: 2250,
          bookedAt: new Date(),
        },
      ]);

      const response = await request(app).get("/analytics/summary");

      expect(response.status).toBe(200);
      expect(Number(response.body.totalEvents)).toBeGreaterThanOrEqual(2);
      expect(Number(response.body.totalBookings)).toBeGreaterThanOrEqual(3);
      expect(Number(response.body.totalRevenue)).toBeGreaterThanOrEqual(4875);
    });

    it("should handle summary with minimal data", async () => {
      const response = await request(app).get("/analytics/summary");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("totalEvents");
      expect(response.body).toHaveProperty("totalBookings");
      expect(response.body).toHaveProperty("totalRevenue");
    });
  });
});
