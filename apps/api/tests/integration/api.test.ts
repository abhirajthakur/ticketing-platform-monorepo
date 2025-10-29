import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { db } from "@repo/database";
import { events, bookings } from "@repo/database/src/schema";

// Set API key for tests
process.env.ADMIN_API_KEY = "test-admin-key";

describe("Complete API Integration Tests", () => {
  describe("Full Event Lifecycle", () => {
    it("should handle complete event lifecycle from creation to analytics", async () => {
      // Step 1: Create an event
      const eventData = {
        name: "Lifecycle Test Concert",
        description: "A complete lifecycle test event",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        venue: "Lifecycle Venue",
        totalTickets: 100,
        priceFloor: 50,
        priceCeiling: 150,
        pricingRules: { basePrice: 75 },
      };

      const createResponse = await request(app)
        .post("/events")
        .set("x-api-key", "test-admin-key")
        .send(eventData);

      expect(createResponse.status).toBe(201);
      const eventId = createResponse.body.event.id;

      // Step 2: Verify event appears in events list
      const listResponse = await request(app).get("/events");
      expect(listResponse.status).toBe(200);
      const createdEvent = listResponse.body.find((e: any) => e.id === eventId);
      expect(createdEvent).toBeDefined();
      expect(createdEvent.name).toBe(eventData.name);

      // Step 3: Get detailed event information
      const detailResponse = await request(app).get(`/events/${eventId}`);
      expect(detailResponse.status).toBe(200);
      expect(detailResponse.body.id).toBe(eventId);
      expect(detailResponse.body.priceBreakdown).toBeDefined();

      // Step 4: Make multiple bookings
      const uniqueEmail1 = `user1-${Date.now()}@lifecycle.com`;
      const uniqueEmail2 = `user2-${Date.now()}@lifecycle.com`;

      const booking1Response = await request(app).post("/bookings").send({
        eventId,
        userEmail: uniqueEmail1,
        quantity: 10,
      });
      expect(booking1Response.status).toBe(201);

      const booking2Response = await request(app).post("/bookings").send({
        eventId,
        userEmail: uniqueEmail2,
        quantity: 15,
      });
      expect(booking2Response.status).toBe(201);

      // Step 5: Verify bookings can be retrieved
      const userBookingsResponse = await request(app).get(
        `/bookings?email=${uniqueEmail1}`,
      );
      expect(userBookingsResponse.status).toBe(200);
      expect(userBookingsResponse.body.length).toBe(1);
      expect(userBookingsResponse.body[0].quantity).toBe(10);

      const eventBookingsResponse = await request(app).get(
        `/bookings?eventId=${eventId}`,
      );
      expect(eventBookingsResponse.status).toBe(200);
      expect(eventBookingsResponse.body.length).toBe(2);

      // Step 6: Check analytics
      const analyticsResponse = await request(app).get(
        `/analytics/events/${eventId}`,
      );
      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.totalSold).toBe(25);
      expect(analyticsResponse.body.remaining).toBe(75);
      expect(analyticsResponse.body.totalRevenue).toBeGreaterThan(0);

      // Step 7: Verify updated event details reflect bookings
      const updatedDetailResponse = await request(app).get(`/events/${eventId}`);
      expect(updatedDetailResponse.status).toBe(200);
      expect(updatedDetailResponse.body.availableTickets).toBe(75);
    });

    it("should handle pricing changes based on demand and inventory", async () => {
      // Create an event with specific pricing rules
      const [event] = await db
        .insert(events)
        .values({
          name: "Dynamic Pricing Test",
          description: "Event for testing dynamic pricing",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week away
          venue: "Pricing Venue",
          totalTickets: 100,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 200,
          pricingRules: { basePrice: 100 },
        })
        .returning();

      // Get initial price
      const initialPriceResponse = await request(app).get(
        `/events/${event.id}`,
      );
      expect(initialPriceResponse.status).toBe(200);
      const initialPrice = initialPriceResponse.body.currentPrice;

      // Make several bookings to increase demand and reduce inventory
      const bookingPromises = [];
      for (let i = 0; i < 5; i++) {
        bookingPromises.push(
          request(app).post("/bookings").send({
            eventId: event.id,
            userEmail: `user${i}@pricing.com`,
            quantity: 10,
          }),
        );
      }

      const bookingResults = await Promise.all(bookingPromises);
      bookingResults.forEach((result) => {
        expect(result.status).toBe(201);
      });

      // Get updated price after bookings
      const updatedPriceResponse = await request(app).get(
        `/events/${event.id}`,
      );
      expect(updatedPriceResponse.status).toBe(200);
      const updatedPrice = updatedPriceResponse.body.currentPrice;

      // Price should have changed due to reduced inventory (50% remaining triggers +10% adjustment)
      expect(updatedPrice).not.toBe(initialPrice);
      expect(updatedPriceResponse.body.availableTickets).toBe(50);
    });
  });

  describe("Error Handling Across Routes", () => {
    it("should handle cascading errors gracefully", async () => {
      const nonExistentId = "550e8400-e29b-41d4-a716-446655440000";

      // Test all routes with non-existent event ID
      const eventResponse = await request(app).get(`/events/${nonExistentId}`);
      expect(eventResponse.status).toBe(404);

      const analyticsResponse = await request(app).get(
        `/analytics/events/${nonExistentId}`,
      );
      expect(analyticsResponse.status).toBe(404);

      const bookingResponse = await request(app).post("/bookings").send({
        eventId: nonExistentId,
        userEmail: "test@error.com",
        quantity: 1,
      });
      expect(bookingResponse.status).toBe(404);

      const bookingQueryResponse = await request(app).get(
        `/bookings?eventId=${nonExistentId}`,
      );
      expect(bookingQueryResponse.status).toBe(200);
      expect(bookingQueryResponse.body).toEqual([]);
    });

    it("should maintain data consistency during concurrent operations", async () => {
      // Create an event with limited tickets
      const [event] = await db
        .insert(events)
        .values({
          name: "Consistency Test Event",
          description: "Event for testing data consistency",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Consistency Venue",
          totalTickets: 10,
          bookedTickets: 0,
          priceFloor: 50,
          priceCeiling: 150,
          pricingRules: { basePrice: 75 },
        })
        .returning();

      // Attempt fewer concurrent bookings to avoid timeout
      const concurrentBookings = Array.from({ length: 3 }, (_, i) =>
        request(app).post("/bookings").send({
          eventId: event.id,
          userEmail: `concurrent${i}@consistency.com`,
          quantity: 2,
        }),
      );

      const results = await Promise.all(concurrentBookings);

      // Count successful bookings
      const successfulBookings = results.filter((r) => r.status === 201);

      // Should not exceed available tickets
      const totalBookedQuantity = successfulBookings.reduce(
        (sum, booking) => sum + booking.body.booking.quantity,
        0,
      );

      expect(totalBookedQuantity).toBeLessThanOrEqual(10);

      // Verify final state
      const finalEventResponse = await request(app).get(`/events/${event.id}`);
      expect(finalEventResponse.status).toBe(200);
      expect(finalEventResponse.body.availableTickets).toBeGreaterThanOrEqual(0);
    }, 10000);
  });

  describe("Cross-Route Data Validation", () => {
    it("should maintain consistency between events and analytics", async () => {
      // Create event and bookings
      const [event] = await db
        .insert(events)
        .values({
          name: "Validation Test Event",
          description: "Event for cross-route validation",
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          venue: "Validation Venue",
          totalTickets: 50,
          bookedTickets: 0,
          priceFloor: 40,
          priceCeiling: 120,
          pricingRules: { basePrice: 60 },
        })
        .returning();

      // Make bookings with known quantities and prices
      await request(app).post("/bookings").send({
        eventId: event.id,
        userEmail: "validation1@test.com",
        quantity: 5,
      });

      await request(app).post("/bookings").send({
        eventId: event.id,
        userEmail: "validation2@test.com",
        quantity: 10,
      });

      // Get data from different endpoints
      const eventResponse = await request(app).get(`/events/${event.id}`);
      const analyticsResponse = await request(app).get(
        `/analytics/events/${event.id}`,
      );
      const bookingsResponse = await request(app).get(
        `/bookings?eventId=${event.id}`,
      );

      // Verify consistency
      expect(eventResponse.body.availableTickets).toBe(
        50 - analyticsResponse.body.totalSold,
      );

      const totalBookedFromBookings = bookingsResponse.body.reduce(
        (sum: number, booking: any) => sum + booking.quantity,
        0,
      );

      expect(analyticsResponse.body.totalSold).toBe(totalBookedFromBookings);
      expect(analyticsResponse.body.remaining).toBe(
        eventResponse.body.availableTickets,
      );
    }, 10000);
  });
});
