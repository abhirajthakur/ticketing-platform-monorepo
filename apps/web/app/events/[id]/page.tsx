import Link from "next/link";
import { BookingForm } from "../../../components/booking-form";
import { PriceBreakdown } from "../../../components/price-breakdown";
import { getEventById } from "../../../lib/api";
import { EventWithPrice } from "../../../lib/types";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let event: EventWithPrice | null = null;
  let error: string | null = null;

  try {
    event = await getEventById(id);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load event";
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <Link href="/events">
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors mb-6">
              ← Back to Events
            </button>
          </Link>
          <div className="bg-red-50 text-red-900 p-4 rounded-lg">
            {error || "Event not found"}
          </div>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(event.date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/events">
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors mb-6">
            ← Back to Events
          </button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                {event.name}
              </h1>
              <p className="text-lg text-slate-600">{event.venue}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Date & Time</p>
                <p className="font-semibold text-slate-900">{formattedDate}</p>
                <p className="text-sm text-slate-600">{formattedTime}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Tickets Available</p>
                <p className="font-semibold text-lg text-slate-900">
                  {event.availableTickets}
                </p>
                <p className="text-sm text-slate-600">
                  of {event.totalTickets}
                </p>
              </div>
            </div>

            {event.description && (
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                  About This Event
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            <PriceBreakdown breakdown={event.priceBreakdown} />
          </div>

          <div>
            <BookingForm event={event} />
          </div>
        </div>
      </div>
    </main>
  );
}
