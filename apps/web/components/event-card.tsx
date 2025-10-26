import Link from "next/link";
import { EventListItem } from "../lib/types";

interface EventCardProps {
  event: EventListItem;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">
          {event.name}
        </h3>
        <p className="text-slate-600 text-sm mb-2">{event.venue}</p>
        <p className="text-slate-500 text-xs mb-4">
          {formattedDate} at {formattedTime}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-slate-600">Current Price</p>
            <p className="font-medium text-lg text-slate-900">
              ${event.currentPrice.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-slate-600">Availability</p>
            <p className="font-medium text-lg text-slate-900">
              {event.availableTickets}
            </p>
            <p className="text-xs text-slate-500">tickets left</p>
          </div>
        </div>

        <Link href={`/events/${event.id}`}>
          <button className="w-full px-4 hover:cursor-pointer py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
