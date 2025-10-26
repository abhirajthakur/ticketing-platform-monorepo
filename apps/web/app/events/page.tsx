import { EventCard } from "../../components/event-card";
import { getEvents } from "../../lib/api";
import { EventListItem } from "../../lib/types";

export default async function EventsPage() {
  let events: EventListItem[] = [];
  let error: string | null = null;

  try {
    events = await getEvents();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load events";
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Upcoming Events
          </h1>
          <p className="text-slate-600">
            Browse and book tickets to your favorite events
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-900 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {events.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">
              No events available at the moment
            </p>
          </div>
        )}

        {events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
