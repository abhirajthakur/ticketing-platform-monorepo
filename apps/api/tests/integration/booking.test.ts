import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { db } from "@repo/database";
import { events, bookings } from "@repo/database/src/schema";

describe("Booking Flow - Integration Tests", () => {
  describe("Complete Booking Flow", () => {
    it("should complete full booking flow from price calculation to confirmation", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Integration Test Concert",
          description: "A test event for integration testing",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const testEventId = event.id;

      const eventResponse = await request(app).get(`/events/${testEventId}`);

      expect(eventResponse.status).toBe(200);
      expect(eventResponse.body).toHaveProperty("currentPrice");
      expect(eventResponse.body).toHaveProperty("priceBreakdown");
      expect(eventResponse.body.availableTickets).toBe(100);

      const uniqueEmail = `test-${Date.now()}@example.com`;

      const bookingResponse = await request(app).post("/bookings").send({
        eventId: testEventId,
        userEmail: uniqueEmail,
        quantity: 2,
      });

      expect(bookingResponse.status).toBe(201);
      expect(bookingResponse.body).toHaveProperty("message");
      expect(bookingResponse.body).toHaveProperty("booking");
      expect(bookingResponse.body.booking.quantity).toBe(2);
      expect(bookingResponse.body.booking.userEmail).toBe(uniqueEmail);

      const updatedEventResponse = await request(app).get(
        `/events/${testEventId}`,
      );

      expect(updatedEventResponse.status).toBe(200);
      expect(updatedEventResponse.body.bookedTickets).toBe(2);
      expect(updatedEventResponse.body.availableTickets).toBe(98);

      const myBookingsResponse = await request(app).get(
        `/bookings?email=${encodeURIComponent(uniqueEmail)}`,
      );

      expect(myBookingsResponse.status).toBe(200);
      expect(myBookingsResponse.body).toHaveLength(1);
      expect(myBookingsResponse.body[0].eventId).toBe(testEventId);
    });

    it("should reject booking when insufficient tickets available", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Limited Tickets Event",
          description: "Event with limited availability",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 10,
          bookedTickets: 8, // Only 2 tickets available
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const response = await request(app).post("/bookings").send({
        eventId: event.id,
        userEmail: "test@example.com",
        quantity: 5,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/not enough tickets/i);
    });

    it("should validate required fields", async () => {
      const response = await request(app).post("/bookings").send({
        eventId: "some-event-id",
        // Missing userEmail and quantity
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/missing required fields/i);
    });

    it("should validate email format", async () => {
      const response = await request(app).post("/bookings").send({
        eventId: "some-event-id",
        userEmail: "invalid-email",
        quantity: 1,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid email/i);
    });

    it("should calculate total price correctly", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Price Test Event",
          description: "Event for testing price calculation",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const testEventId = event.id;

      const eventResponse = await request(app).get(`/events/${testEventId}`);
      const pricePerTicket = eventResponse.body.currentPrice;

      const response = await request(app).post("/bookings").send({
        eventId: testEventId,
        userEmail: "test@example.com",
        quantity: 3,
      });

      expect(response.status).toBe(201);
      expect(response.body.booking.pricePaid).toBeCloseTo(
        pricePerTicket * 3,
        2,
      );
    });
  });

  describe("Price Changes During Booking", () => {
    it("should reflect inventory changes in price", async () => {
      const [event] = await db
        .insert(events)
        .values({
          name: "Inventory Test Event",
          description: "Event for testing inventory-based pricing",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const testEventId = event.id;

      const initialResponse = await request(app).get(`/events/${testEventId}`);
      const initialPrice = initialResponse.body.currentPrice;

      // Book 85 tickets (leaving less than 20%)
      await request(app).post("/bookings").send({
        eventId: testEventId,
        userEmail: "bulk@example.com",
        quantity: 85,
      });

      const updatedResponse = await request(app).get(`/events/${testEventId}`);
      const updatedPrice = updatedResponse.body.currentPrice;

      expect(updatedPrice).toBeGreaterThan(initialPrice);
      expect(
        updatedResponse.body.priceBreakdown.adjustments.inventoryBased
          .multiplier,
      ).toBeGreaterThan(0);
    });

    it("should reflect demand changes in price", async () => {
      const [demandEvent] = await db
        .insert(events)
        .values({
          name: "Demand Test Event",
          description: "Testing demand-based pricing",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Test Venue",
          totalTickets: 100,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 50 },
        })
        .returning();

      const demandEventId = demandEvent.id;

      // Create 12 bookings quickly (within 1 hour) to trigger demand adjustment
      for (let i = 0; i < 12; i++) {
        await request(app)
          .post("/bookings")
          .send({
            eventId: demandEventId,
            userEmail: `demand${i}@example.com`,
            quantity: 1,
          });
      }

      const response = await request(app).get(`/events/${demandEventId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("priceBreakdown");

      if (response.body.priceBreakdown) {
        expect(
          response.body.priceBreakdown.adjustments.demandBased.multiplier,
        ).toBeGreaterThan(0);
        expect(
          response.body.priceBreakdown.adjustments.demandBased.bookingsLastHour,
        ).toBeGreaterThanOrEqual(12);
      }
    });
  });
});
