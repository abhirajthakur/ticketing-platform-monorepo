import { db } from "@repo/database";
import { events } from "@repo/database/src/schema";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

process.env.ADMIN_API_KEY = "test-admin-key";

describe("Events Routes", () => {
  describe("GET /events", () => {
    it("should return all events with pricing information", async () => {
      await db.insert(events).values([
        {
          name: "Test Concert 1",
          description: "First test event",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Venue 1",
          totalTickets: 100,
          bookedTickets: 20,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        },
        {
          name: "Test Concert 2",
          description: "Second test event",
          date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          venue: "Venue 2",
          totalTickets: 200,
          bookedTickets: 50,
          priceFloor: 30,
          priceCeiling: 100,
          pricingRules: { basePrice: 30 },
        },
      ]);

      const response = await request(app).get("/events");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      response.body.forEach((event: any) => {
        expect(event).toHaveProperty("id");
        expect(event).toHaveProperty("name");
        expect(event).toHaveProperty("venue");
        expect(event).toHaveProperty("currentPrice");
        expect(event).toHaveProperty("availableTickets");
        expect(typeof event.currentPrice).toBe("number");
        expect(typeof event.availableTickets).toBe("number");
      });
    });

    it("should handle empty events list gracefully", async () => {
      const response = await request(app).get("/events");

      expect([200, 404]).toContain(response.status);
    });
  });

  describe("GET /events/:id", () => {
    it("should return specific event with detailed pricing breakdown", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Detailed Event",
          description: "Event for detailed testing",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Detailed Venue",
          totalTickets: 100,
          bookedTickets: 30,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 75 },
        })
        .returning();

      const response = await request(app).get(`/events/${event.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", event.id);
      expect(response.body).toHaveProperty("name", "Detailed Event");
      expect(response.body).toHaveProperty("currentPrice");
      expect(response.body).toHaveProperty("availableTickets", 70);
      expect(response.body).toHaveProperty("priceBreakdown");

      const breakdown = response.body.priceBreakdown;
      expect(breakdown).toHaveProperty("basePrice");
      expect(breakdown).toHaveProperty("currentPrice");
      expect(breakdown).toHaveProperty("adjustments");
      expect(breakdown.adjustments).toHaveProperty("timeBased");
      expect(breakdown.adjustments).toHaveProperty("demandBased");
      expect(breakdown.adjustments).toHaveProperty("inventoryBased");
    });

    it("should return 404 for non-existent event", async () => {
      const response = await request(app).get(
        "/events/550e8400-e29b-41d4-a716-446655440000",
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Event not found");
    });
  });

  describe("POST /events", () => {
    const validEventData = {
      name: "New Test Event",
      description: "A new event for testing",
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      venue: "New Venue",
      totalTickets: 150,
      priceFloor: 40,
      priceCeiling: 120,
      pricingRules: { basePrice: 40 },
    };

    it("should create new event with valid API key", async () => {
      const response = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(validEventData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Event created successfully");
      expect(response.body.event).toHaveProperty("id");
      expect(response.body.event.name).toBe(validEventData.name);
    });

    it("should reject request without API key", async () => {
      const response = await request(app).post("/events").send(validEventData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should reject request with invalid API key", async () => {
      const response = await request(app)
        .post("/events")
        .set("x-api-key", "invalid-key")
        .send(validEventData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should validate required fields", async () => {
      const incompleteData = {
        name: "Incomplete Event",
        // Missing required fields
      };

      const response = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Missing required fields");
    });

    it("should validate date format", async () => {
      const invalidDateData = {
        ...validEventData,
        date: "invalid-date",
      };

      const response = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(invalidDateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid date format");
    });

    it("should reject past dates", async () => {
      const pastDateData = {
        ...validEventData,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(pastDateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Event date must be in the future");
    });

    it("should validate price range", async () => {
      const invalidPriceData = {
        ...validEventData,
        priceFloor: 100,
        priceCeiling: 50, // Ceiling less than floor
      };

      const response = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(invalidPriceData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid price range");
    });

    it("should validate negative prices", async () => {
      const negativePriceData = {
        ...validEventData,
        priceFloor: -10,
      };

      const response = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(negativePriceData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid price range");
    });

    it("should validate total tickets", async () => {
      const invalidTicketsData = {
        ...validEventData,
        totalTickets: 0,
      };

      const response = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(invalidTicketsData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(
        "Total tickets must be greater than 0",
      );
    });

    it("should set default priceCeiling when not provided", async () => {
      const noCeilingData = {
        ...validEventData,
        priceCeiling: undefined,
      };

      const response = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(noCeilingData);

      expect(response.status).toBe(201);
      expect(response.body.event.priceCeiling).toBe(
        validEventData.priceFloor * 2,
      );
    });

    it("should set default pricingRules when not provided", async () => {
      const noRulesData = {
        ...validEventData,
        pricingRules: undefined,
      };

      const response = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(noRulesData);

      expect(response.status).toBe(201);
      expect(response.body.event.pricingRules).toEqual({
        basePrice: validEventData.priceFloor,
      });
    });
  });
});
