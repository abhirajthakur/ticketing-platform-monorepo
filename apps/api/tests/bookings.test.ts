import { db } from "@repo/database";
import { bookings, events } from "@repo/database/src/schema";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

describe("Bookings Routes - Edge Cases", () => {
  describe("GET /bookings", () => {
    it("should return bookings filtered by email", async () => {
      const uniqueEmail = `user1-${Date.now()}@example.com`;
      const uniqueEmail2 = `user2-${Date.now()}@example.com`;

      const [event] = await db
        .insert(events)
        .values({
          name: "Email Filter Test Event",
          description: "Event for email filtering test",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 30,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      await db.insert(bookings).values([
        {
          eventId: event.id,
          userEmail: uniqueEmail,
          quantity: 10,
          pricePaid: 500,
          bookedAt: new Date(),
        },
        {
          eventId: event.id,
          userEmail: uniqueEmail2,
          quantity: 20,
          pricePaid: 1000,
          bookedAt: new Date(),
        },
      ]);

      const response = await request(app).get(`/bookings?email=${uniqueEmail}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].userEmail).toBe(uniqueEmail);
      expect(response.body[0].quantity).toBe(10);
    });

    it("should return bookings filtered by eventId", async () => {
      const [event1] = await db
        .insert(events)
        .values({
          name: "Event Filter Test 1",
          description: "First event for filtering test",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue 1",
          totalTickets: 100,
          bookedTickets: 15,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const [event2] = await db
        .insert(events)
        .values({
          name: "Event Filter Test 2",
          description: "Second event for filtering test",
          date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          venue: "Test Venue 2",
          totalTickets: 200,
          bookedTickets: 25,
          priceFloor: 30,
          priceCeiling: 100,
          pricingRules: { basePrice: 30 },
        })
        .returning();

      await db.insert(bookings).values([
        {
          eventId: event1.id,
          userEmail: "user@example.com",
          quantity: 5,
          pricePaid: 250,
          bookedAt: new Date(),
        },
        {
          eventId: event1.id,
          userEmail: "user2@example.com",
          quantity: 10,
          pricePaid: 500,
          bookedAt: new Date(),
        },
        {
          eventId: event2.id,
          userEmail: "user@example.com",
          quantity: 25,
          pricePaid: 750,
          bookedAt: new Date(),
        },
      ]);

      const response = await request(app).get(`/bookings?eventId=${event1.id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      response.body.forEach((booking: any) => {
        expect(booking.eventId).toBe(event1.id);
      });
    });

    it("should return 400 when no query parameters provided", async () => {
      const response = await request(app).get("/bookings");

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(
        "Missing query parameter: provide either 'email' or 'eventId'",
      );
    });

    it("should return empty array for non-existent email", async () => {
      const response = await request(app).get(
        "/bookings?email=nonexistent@example.com",
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it("should return empty array for non-existent eventId", async () => {
      const response = await request(app).get(
        "/bookings?eventId=550e8400-e29b-41d4-a716-446655440000",
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it("should handle empty email parameter gracefully", async () => {
      // Empty email parameter should fall through to missing parameter validation
      const response = await request(app).get("/bookings?email=");

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Missing query parameter");
    });
  });

  describe("POST /bookings - Additional Edge Cases", () => {
    it("should validate quantity as positive number", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Quantity Validation Event",
          description: "Event for quantity validation",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const response = await request(app).post("/bookings").send({
        eventId: event.id,
        userEmail: "test@example.com",
        quantity: -1,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Quantity must be a positive number");
    });

    it("should validate quantity as number type", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Type Validation Event",
          description: "Event for type validation",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const response = await request(app).post("/bookings").send({
        eventId: event.id,
        userEmail: "test@example.com",
        quantity: "not-a-number",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Quantity must be a positive number");
    });

    it("should handle zero quantity", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Zero Quantity Event",
          description: "Event for zero quantity test",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const response = await request(app).post("/bookings").send({
        eventId: event.id,
        userEmail: "test@example.com",
        quantity: 0,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(
        "Quantity must be a positive number",
      );
    });

    it("should handle various invalid email formats", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Email Validation Event",
          description: "Event for email validation",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user@.com",
        "user.example.com",
        "user@example",
      ];

      for (const email of invalidEmails) {
        const response = await request(app).post("/bookings").send({
          eventId: event.id,
          userEmail: email,
          quantity: 1,
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Invalid email address");
      }
    });

    it("should handle missing individual fields", async () => {
      const testCases = [
        { userEmail: "test@example.com", quantity: 1 }, // Missing eventId
        { eventId: "some-id", quantity: 1 }, // Missing userEmail
        { eventId: "some-id", userEmail: "test@example.com" }, // Missing quantity
      ];

      for (const testCase of testCases) {
        const response = await request(app).post("/bookings").send(testCase);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Missing required fields");
      }
    });

    it("should handle database transaction errors", async () => {
      // Test with non-existent event ID to trigger transaction error
      const response = await request(app).post("/bookings").send({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        userEmail: "test@example.com",
        quantity: 1,
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Event not found");
    });
  });
});
