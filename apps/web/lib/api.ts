import {
  AnalyticsSummary,
  Booking,
  BookingRequest,
  CreateEventRequest,
  EventAnalytics,
  EventListItem,
  EventWithPrice,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handleApiError(
  res: Response,
  defaultMessage: string,
): Promise<never> {
  try {
    const data = await res.json();
    throw new Error(data.error || defaultMessage);
  } catch (e) {
    if (e instanceof Error && e.message !== defaultMessage) {
      throw e;
    }
    throw new Error(defaultMessage);
  }
}

export async function getEvents(): Promise<EventListItem[]> {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) {
    await handleApiError(res, "Failed to fetch events");
  }
  return res.json();
}

export async function getEventById(id: string): Promise<EventWithPrice> {
  const res = await fetch(`${API_BASE}/events/${id}`);
  if (!res.ok) {
    await handleApiError(res, "Failed to fetch event");
  }
  return res.json();
}

export async function createEvent(
  event: CreateEventRequest,
  apiKey: string,
): Promise<{ message: string; event: EventWithPrice }> {
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    await handleApiError(res, "Failed to create event");
  }
  return res.json();
}

export async function createBooking(booking: BookingRequest): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  if (!res.ok) {
    await handleApiError(res, "Failed to create booking");
  }
  return res.json();
}

export async function getBookingsByEmail(email: string): Promise<Booking[]> {
  const res = await fetch(
    `${API_BASE}/bookings?email=${encodeURIComponent(email)}`,
  );
  if (!res.ok) {
    await handleApiError(res, "Failed to fetch bookings");
  }
  return res.json();
}

export async function getEventAnalytics(
  eventId: string,
): Promise<EventAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/events/${eventId}`);
  if (!res.ok) {
    await handleApiError(res, "Failed to fetch analytics");
  }
  return res.json();
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  if (!res.ok) {
    await handleApiError(res, "Failed to fetch summary");
  }
  return res.json();
}
