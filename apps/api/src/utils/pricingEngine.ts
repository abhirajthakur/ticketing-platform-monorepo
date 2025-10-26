import { and, count, db, eq, gte } from "@repo/database";
import { bookings, events } from "@repo/database/src/schema";
import { weights } from "./env";

export type EventData = {
  basePrice: number;
  priceFloor: number;
  priceCeiling: number;
  date: Date;
  totalTickets: number;
  bookedTickets: number;
};

export type PricingContext = {
  event: EventData;
  now: Date;
  bookingsLastHour: number;
};

export type PriceBreakdown = {
  basePrice: number;
  currentPrice: number;
  priceFloor: number;
  priceCeiling: number;
  adjustments: {
    timeBased: {
      multiplier: number;
      weight: number;
      contribution: number;
      description: string;
    };
    demandBased: {
      multiplier: number;
      weight: number;
      contribution: number;
      bookingsLastHour: number;
      description: string;
    };
    inventoryBased: {
      multiplier: number;
      weight: number;
      contribution: number;
      remainingTickets: number;
      description: string;
    };
  };
};

function extractBasePriceFromRules(pricingRules: any): number {
  if (typeof pricingRules?.basePrice === "number") {
    return pricingRules.basePrice;
  }
  throw new Error("Base price not found in pricing rules");
}

function timeBasedAdjustment(eventDate: Date, now: Date): number {
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) {
    return 0.5; // +50%
  }
  if (diffDays <= 7) {
    return 0.2; // +20%
  }
  return 0.0;
}

function demandBasedAdjustment(bookingsLastHour: number): number {
  return bookingsLastHour > 10 ? 0.15 : 0.0; // +15% if high demand
}

function inventoryBasedAdjustment(
  totalTickets: number,
  bookedTickets: number,
): number {
  if (totalTickets === 0) {
    return 0.0;
  }
  const remaining = totalTickets - bookedTickets;
  const ratio = remaining / totalTickets;
  return ratio < 0.2 ? 0.25 : 0.0; // +25% if less than 20% remaining
}

function getTimeBasedDescription(eventDate: Date, now: Date): string {
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) {
    return "Event tomorrow or sooner (+50%)";
  }
  if (diffDays <= 7) {
    return "Event within 7 days (+20%)";
  }
  return "Event more than 7 days away (no adjustment)";
}

function getInventoryDescription(
  totalTickets: number,
  bookedTickets: number,
): string {
  if (totalTickets === 0) {
    return "No tickets available";
  }
  const remaining = totalTickets - bookedTickets;
  const ratio = remaining / totalTickets;

  if (ratio < 0.2) {
    return `Less than 20% remaining (${remaining}/${totalTickets}) (+25%)`;
  }
  return `${remaining}/${totalTickets} tickets remaining (no adjustment)`;
}

export function calculateDynamicPriceWithBreakdown(
  ctx: PricingContext,
): PriceBreakdown {
  const { event, now, bookingsLastHour } = ctx;

  const timeAdj = timeBasedAdjustment(event.date, now);
  const demandAdj = demandBasedAdjustment(bookingsLastHour);
  const inventoryAdj = inventoryBasedAdjustment(
    event.totalTickets,
    event.bookedTickets,
  );

  const timeContribution = timeAdj * weights.time;
  const demandContribution = demandAdj * weights.demand;
  const inventoryContribution = inventoryAdj * weights.inventory;

  const weightedAdjustment =
    timeContribution + demandContribution + inventoryContribution;

  const rawPrice = event.basePrice * (1 + weightedAdjustment);
  const finalPrice = Math.max(
    event.priceFloor,
    Math.min(event.priceCeiling, rawPrice),
  );

  const currentPrice = Number(finalPrice.toFixed(2));

  return {
    basePrice: event.basePrice,
    currentPrice,
    priceFloor: event.priceFloor,
    priceCeiling: event.priceCeiling,
    adjustments: {
      timeBased: {
        multiplier: timeAdj,
        weight: weights.time,
        contribution: timeContribution,
        description: getTimeBasedDescription(event.date, now),
      },
      demandBased: {
        multiplier: demandAdj,
        weight: weights.demand,
        contribution: demandContribution,
        bookingsLastHour,
        description:
          bookingsLastHour > 10
            ? "High demand (>10 bookings/hour)"
            : "Normal demand",
      },
      inventoryBased: {
        multiplier: inventoryAdj,
        weight: weights.inventory,
        contribution: inventoryContribution,
        remainingTickets: event.totalTickets - event.bookedTickets,
        description: getInventoryDescription(
          event.totalTickets,
          event.bookedTickets,
        ),
      },
    },
  };
}

export function calculateDynamicPrice(ctx: PricingContext): number {
  return calculateDynamicPriceWithBreakdown(ctx).currentPrice;
}

export async function getDynamicPriceForEvent(
  eventId: string,
): Promise<number | null> {
  const [event] = await db.select().from(events).where(eq(events.id, eventId));

  if (!event) {
    return null;
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [bookingCountResult] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(eq(bookings.eventId, eventId), gte(bookings.bookedAt, oneHourAgo)),
    );

  const bookingsLastHour = Number(bookingCountResult?.count ?? 0);

  const context: PricingContext = {
    event: {
      basePrice: extractBasePriceFromRules(event.pricingRules),
      priceFloor: event.priceFloor,
      priceCeiling: event.priceCeiling,
      date: event.date,
      totalTickets: event.totalTickets,
      bookedTickets: event.bookedTickets ?? 0,
    },
    now: new Date(),
    bookingsLastHour,
  };

  return calculateDynamicPrice(context);
}

export async function getPriceWithBreakdown(eventId: string): Promise<{
  breakdown: PriceBreakdown;
  availableTickets: number;
} | null> {
  const [event] = await db.select().from(events).where(eq(events.id, eventId));

  if (!event) {
    return null;
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [bookingCountResult] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(eq(bookings.eventId, eventId), gte(bookings.bookedAt, oneHourAgo)),
    );

  const bookingsLastHour = Number(bookingCountResult?.count ?? 0);

  const basePrice = extractBasePriceFromRules(event.pricingRules);

  const context: PricingContext = {
    event: {
      basePrice,
      priceFloor: event.priceFloor,
      priceCeiling: event.priceCeiling,
      date: event.date,
      totalTickets: event.totalTickets,
      bookedTickets: event.bookedTickets ?? 0,
    },
    now: new Date(),
    bookingsLastHour,
  };

  const breakdown = calculateDynamicPriceWithBreakdown(context);

  return {
    breakdown,
    availableTickets: event.totalTickets - (event.bookedTickets ?? 0),
  };
}
