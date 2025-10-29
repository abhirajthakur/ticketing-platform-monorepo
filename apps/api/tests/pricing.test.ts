import { describe, expect, it } from "vitest";
import {
  calculateDynamicPriceWithBreakdown,
  PricingContext,
} from "../src/utils/pricingEngine";

describe("Pricing Engine - Unit Tests", () => {
  const baseContext: PricingContext = {
    event: {
      basePrice: 100,
      priceFloor: 50,
      priceCeiling: 200,
      date: new Date("2025-12-31"),
      totalTickets: 100,
      bookedTickets: 0,
    },
    now: new Date("2025-12-01"),
    bookingsLastHour: 0,
  };

  describe("Time-Based Adjustments", () => {
    it("should apply no adjustment for events more than 7 days away", () => {
      const context: PricingContext = {
        ...baseContext,
        event: {
          ...baseContext.event,
          date: new Date("2025-12-15"),
        },
        now: new Date("2025-12-01"),
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.timeBased.multiplier).toBe(0);
      expect(result.currentPrice).toBe(100);
    });

    it("should apply 20% adjustment for events within 7 days", () => {
      const context: PricingContext = {
        ...baseContext,
        event: {
          ...baseContext.event,
          date: new Date("2025-12-06"), // 5 days away
        },
        now: new Date("2025-12-01"),
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.timeBased.multiplier).toBe(0.2);
      expect(result.currentPrice).toBeGreaterThan(100);
    });

    it("should apply 50% adjustment for events within 1 day", () => {
      const context: PricingContext = {
        ...baseContext,
        event: {
          ...baseContext.event,
          date: new Date("2025-12-01T23:00:00"), // Less than 1 day
        },
        now: new Date("2025-12-01T10:00:00"),
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.timeBased.multiplier).toBe(0.5);
      expect(result.currentPrice).toBeGreaterThan(100);
    });
  });

  describe("Demand-Based Adjustments", () => {
    it("should apply no adjustment with low booking velocity (<=10 bookings)", () => {
      const context: PricingContext = {
        ...baseContext,
        bookingsLastHour: 10,
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.demandBased.multiplier).toBe(0);
      expect(result.adjustments.demandBased.bookingsLastHour).toBe(10);
    });

    it("should apply 15% adjustment with high booking velocity (>10 bookings)", () => {
      const context: PricingContext = {
        ...baseContext,
        bookingsLastHour: 15,
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.demandBased.multiplier).toBe(0.15);
      expect(result.adjustments.demandBased.bookingsLastHour).toBe(15);
      expect(result.currentPrice).toBeGreaterThan(100);
    });
  });

  describe("Inventory-Based Adjustments", () => {
    it("should apply no adjustment when more than 50% tickets remain", () => {
      const context: PricingContext = {
        ...baseContext,
        event: {
          ...baseContext.event,
          totalTickets: 100,
          bookedTickets: 40, // 60% remaining
        },
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.inventoryBased.multiplier).toBe(0);
      expect(result.adjustments.inventoryBased.remainingTickets).toBe(60);
    });

    it("should apply 25% adjustment when less than 20% tickets remain", () => {
      const context: PricingContext = {
        ...baseContext,
        event: {
          ...baseContext.event,
          totalTickets: 100,
          bookedTickets: 85, // 15% remaining
        },
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.inventoryBased.multiplier).toBe(0.25);
      expect(result.adjustments.inventoryBased.remainingTickets).toBe(15);
      expect(result.currentPrice).toBeGreaterThan(100);
    });

    it("should apply 10% adjustment when 50% or less tickets remain", () => {
      const context: PricingContext = {
        ...baseContext,
        event: {
          ...baseContext.event,
          totalTickets: 100,
          bookedTickets: 50, // Exactly 50% remaining
        },
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.inventoryBased.multiplier).toBe(0.1);
    });

    it("should apply 10% adjustment when exactly 20% tickets remain", () => {
      const context: PricingContext = {
        ...baseContext,
        event: {
          ...baseContext.event,
          totalTickets: 100,
          bookedTickets: 80, // Exactly 20% remaining
        },
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.inventoryBased.multiplier).toBe(0.1);
    });
  });

  describe("Combined Rules", () => {
    it("should combine all three rules with default weights", () => {
      const context: PricingContext = {
        event: {
          basePrice: 100,
          priceFloor: 50,
          priceCeiling: 200,
          date: new Date("2025-12-02T10:00:00"), // Within 1 day (+50%)
          totalTickets: 100,
          bookedTickets: 85, // Less than 20% remaining (+25%)
        },
        now: new Date("2025-12-01T10:00:00"),
        bookingsLastHour: 15, // High demand (+15%)
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.timeBased.multiplier).toBe(0.5);
      expect(result.adjustments.demandBased.multiplier).toBe(0.15);
      expect(result.adjustments.inventoryBased.multiplier).toBe(0.25);

      expect(result.currentPrice).toBeGreaterThan(100);
    });

    it("should respect weight configuration", () => {
      const context: PricingContext = {
        event: {
          basePrice: 100,
          priceFloor: 50,
          priceCeiling: 200,
          date: new Date("2025-12-02T10:00:00"),
          totalTickets: 100,
          bookedTickets: 85,
        },
        now: new Date("2025-12-01T10:00:00"),
        bookingsLastHour: 15,
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.timeBased.weight).toBeGreaterThan(0);
      expect(result.adjustments.demandBased.weight).toBeGreaterThan(0);
      expect(result.adjustments.inventoryBased.weight).toBeGreaterThan(0);

      const timeContribution =
        result.adjustments.timeBased.multiplier *
        result.adjustments.timeBased.weight;
      expect(result.adjustments.timeBased.contribution).toBeCloseTo(
        timeContribution,
        5,
      );
    });
  });

  describe("Price Floor and Ceiling Constraints", () => {
    it("should not go below price floor", () => {
      const context: PricingContext = {
        event: {
          basePrice: 60,
          priceFloor: 50,
          priceCeiling: 200,
          date: new Date("2025-12-31"), // Far away
          totalTickets: 100,
          bookedTickets: 10, // Plenty available
        },
        now: new Date("2025-12-01"),
        bookingsLastHour: 0, // No demand
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.currentPrice).toBeGreaterThanOrEqual(
        context.event.priceFloor,
      );
    });

    it("should not exceed price ceiling", () => {
      const context: PricingContext = {
        event: {
          basePrice: 100,
          priceFloor: 50,
          priceCeiling: 150,
          date: new Date("2025-12-02T10:00:00"), // Within 1 day (+50%)
          totalTickets: 100,
          bookedTickets: 90, // Less than 20% remaining (+25%)
        },
        now: new Date("2025-12-01T10:00:00"),
        bookingsLastHour: 20, // High demand (+15%)
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.currentPrice).toBeLessThanOrEqual(
        context.event.priceCeiling,
      );
    });

    it("should indicate when floor constraint is applied", () => {
      const context: PricingContext = {
        event: {
          basePrice: 40,
          priceFloor: 50,
          priceCeiling: 200,
          date: new Date("2025-12-31"),
          totalTickets: 100,
          bookedTickets: 0,
        },
        now: new Date("2025-12-01"),
        bookingsLastHour: 0,
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.currentPrice).toBe(50);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero tickets scenario", () => {
      const context: PricingContext = {
        ...baseContext,
        event: {
          ...baseContext.event,
          totalTickets: 0,
          bookedTickets: 0,
        },
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.inventoryBased.multiplier).toBe(0);
    });

    it("should handle all tickets booked scenario", () => {
      const context: PricingContext = {
        ...baseContext,
        event: {
          ...baseContext.event,
          totalTickets: 100,
          bookedTickets: 100,
        },
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.inventoryBased.multiplier).toBe(0.25);
      expect(result.adjustments.inventoryBased.remainingTickets).toBe(0);
    });

    it("should return deterministic results for same input", () => {
      const context: PricingContext = {
        event: {
          basePrice: 100,
          priceFloor: 50,
          priceCeiling: 200,
          date: new Date("2025-12-15"),
          totalTickets: 100,
          bookedTickets: 50,
        },
        now: new Date("2025-12-01"),
        bookingsLastHour: 5,
      };

      const result1 = calculateDynamicPriceWithBreakdown(context);
      const result2 = calculateDynamicPriceWithBreakdown(context);

      expect(result1.currentPrice).toBe(result2.currentPrice);
      expect(result1.adjustments).toEqual(result2.adjustments);
    });

    it("should handle extreme values gracefully", () => {
      const context: PricingContext = {
        event: {
          basePrice: 1000000,
          priceFloor: 1,
          priceCeiling: 2000000,
          date: new Date("2025-12-01T00:00:01"), // 1 second away
          totalTickets: 1000000,
          bookedTickets: 999999, // 1 ticket left
        },
        now: new Date("2025-12-01T00:00:00"),
        bookingsLastHour: 1000, // Extreme demand
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.currentPrice).toBeGreaterThanOrEqual(context.event.priceFloor);
      expect(result.currentPrice).toBeLessThanOrEqual(context.event.priceCeiling);
      expect(typeof result.currentPrice).toBe("number");
      expect(isFinite(result.currentPrice)).toBe(true);
    });

    it("should handle zero base price", () => {
      const context: PricingContext = {
        event: {
          basePrice: 0,
          priceFloor: 0,
          priceCeiling: 100,
          date: new Date("2025-12-15"),
          totalTickets: 100,
          bookedTickets: 50,
        },
        now: new Date("2025-12-01"),
        bookingsLastHour: 5,
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.currentPrice).toBeGreaterThanOrEqual(0);
      expect(result.basePrice).toBe(0);
    });

    it("should handle same floor and ceiling prices", () => {
      const context: PricingContext = {
        event: {
          basePrice: 100,
          priceFloor: 100,
          priceCeiling: 100,
          date: new Date("2025-12-02"), // Tomorrow (high time multiplier)
          totalTickets: 100,
          bookedTickets: 95, // High inventory multiplier
        },
        now: new Date("2025-12-01"),
        bookingsLastHour: 20, // High demand
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.currentPrice).toBe(100);
      expect(result.currentPrice).toBe(context.event.priceFloor);
      expect(result.currentPrice).toBe(context.event.priceCeiling);
    });

    it("should handle negative bookings last hour", () => {
      const context: PricingContext = {
        event: {
          basePrice: 100,
          priceFloor: 50,
          priceCeiling: 200,
          date: new Date("2025-12-15"),
          totalTickets: 100,
          bookedTickets: 50,
        },
        now: new Date("2025-12-01"),
        bookingsLastHour: -5, // Invalid negative value
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.demandBased.multiplier).toBe(0);
      expect(result.adjustments.demandBased.bookingsLastHour).toBe(-5);
    });

    it("should handle zero total tickets", () => {
      const context: PricingContext = {
        event: {
          basePrice: 100,
          priceFloor: 50,
          priceCeiling: 200,
          date: new Date("2025-12-15"),
          totalTickets: 0,
          bookedTickets: 0,
        },
        now: new Date("2025-12-01"),
        bookingsLastHour: 5,
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.inventoryBased.remainingTickets).toBe(0);
      expect(typeof result.currentPrice).toBe("number");
      expect(isFinite(result.currentPrice)).toBe(true);
    });

    it("should handle booked tickets exceeding total tickets", () => {
      const context: PricingContext = {
        event: {
          basePrice: 100,
          priceFloor: 50,
          priceCeiling: 200,
          date: new Date("2025-12-15"),
          totalTickets: 100,
          bookedTickets: 150, // More than total
        },
        now: new Date("2025-12-01"),
        bookingsLastHour: 5,
      };

      const result = calculateDynamicPriceWithBreakdown(context);

      expect(result.adjustments.inventoryBased.remainingTickets).toBe(-50);
      expect(typeof result.currentPrice).toBe("number");
      expect(isFinite(result.currentPrice)).toBe(true);
    });
  });
});
