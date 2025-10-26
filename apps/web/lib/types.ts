export interface PriceAdjustment {
  multiplier: number;
  weight: number;
  contribution: number;
  description: string;
}

export interface DemandAdjustment extends PriceAdjustment {
  bookingsLastHour: number;
}

export interface InventoryAdjustment extends PriceAdjustment {
  remainingTickets: number;
}

export interface PriceBreakdown {
  basePrice: number;
  currentPrice: number;
  priceFloor: number;
  priceCeiling: number;
  adjustments: {
    timeBased: PriceAdjustment;
    demandBased: DemandAdjustment;
    inventoryBased: InventoryAdjustment;
  };
}

export interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string;
  totalTickets: number;
  bookedTickets: number;
  priceFloor: number;
  priceCeiling: number;
  pricingRules: Record<string, unknown>;
}

export interface EventWithPrice extends Event {
  currentPrice: number;
  availableTickets: number;
  priceBreakdown: PriceBreakdown;
}

export interface Booking {
  id: number;
  eventId: string;
  userEmail: string;
  quantity: number;
  pricePaid: number;
  bookedAt: string;
}

export interface BookingRequest {
  eventId: string;
  userEmail: string;
  quantity: number;
}

export interface CreateEventRequest {
  name: string;
  date: string;
  venue: string;
  description: string;
  totalTickets: number;
  priceFloor: number;
  priceCeiling?: number;
  pricingRules?: Record<string, unknown>;
}

export interface EventListItem {
  id: string;
  name: string;
  venue: string;
  date: string;
  currentPrice: number;
  availableTickets: number;
}

export interface EventAnalytics {
  eventId: string;
  eventName: string;
  totalSold: number;
  revenue: number;
  averagePrice: number;
  remainingTickets: number;
}

export interface AnalyticsSummary {
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  averageTicketPrice: number;
}
