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
    return 0.5;
  }
  if (diffDays <= 7) {
    return 0.2;
  }
  return 0.0;
}

function demandBasedAdjustment(bookingsLastHour: number): number {
  return bookingsLastHour > 10 ? 0.15 : 0.0;
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

  return ratio < 0.2 ? 0.25 : 0.0;
}

export function calculateDynamicPrice(ctx: PricingContext): number {
  const { event, now, bookingsLastHour } = ctx;

  const timeAdj = timeBasedAdjustment(event.date, now);
  const demandAdj = demandBasedAdjustment(bookingsLastHour);
  const inventoryAdj = inventoryBasedAdjustment(
    event.totalTickets,
    event.bookedTickets,
  );

  const weightedAdjustment =
    timeAdj * weights.time +
    demandAdj * weights.demand +
    inventoryAdj * weights.inventory;

  const rawPrice = event.basePrice * (1 + weightedAdjustment);

  const finalPrice = Math.max(
    event.priceFloor,
    Math.min(event.priceCeiling, rawPrice),
  );

  return Number(finalPrice.toFixed(2));
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
