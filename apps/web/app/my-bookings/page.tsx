"use client";

import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { getBookingsByEmail } from "../../lib/api";
import { Booking } from "../../lib/types";

interface BookingWithEvent extends Booking {
  eventName?: string;
  eventDate?: string;
}

export default function MyBookingsPage() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<BookingWithEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSearched(true);

    try {
      if (!email) {
        throw new Error("Please enter your email address");
      }
      const data = await getBookingsByEmail(email);
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            My Bookings
          </h1>
          <p className="text-slate-600">View and manage your event bookings</p>
        </div>

        <div className="max-w-md mb-8">
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Find Your Bookings
              </h2>
              <p className="text-sm text-slate-600">
                Enter your email to view your bookings
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Searching..." : "Search Bookings"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-900 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {searched && !loading && bookings.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg mb-4">
              No bookings found for this email
            </p>
            <Link href="/events">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Browse Events
              </button>
            </Link>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Your Bookings ({bookings.length})
            </h2>
            {bookings.map((booking) => {
              const pricePaidPerTicket = booking.pricePaid / booking.quantity;
              const bookingDate = new Date(booking.bookedAt);
              const formattedDate = bookingDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = bookingDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={booking.id}
                  className="border border-slate-200 rounded-lg bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        {booking.eventName ? (
                          <>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                              {booking.eventName}
                            </h3>
                            {booking.eventDate && (
                              <p className="text-sm text-slate-600 mb-2">
                                Event on{" "}
                                {new Date(booking.eventDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            )}
                          </>
                        ) : (
                          <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            Event Booking
                          </h3>
                        )}
                        <p className="text-xs text-slate-500">
                          Booked on {formattedDate} at {formattedTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600">Tickets</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {booking.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Email</p>
                        <p className="font-semibold text-slate-900 text-sm">
                          {booking.userEmail}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">
                          Total Paid
                        </p>
                        <p className="font-semibold text-lg text-slate-900">
                          ${booking.pricePaid.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-600">
                          ${pricePaidPerTicket.toFixed(2)} per ticket
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">
                          Booking ID
                        </p>
                        <p className="font-mono text-xs text-slate-900 bg-slate-50 px-2 py-1 rounded">
                          {booking.id}
                        </p>
                        <Link href={`/events/${booking.eventId}`}>
                          <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                            View Event →
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12">
          <Link href="/events">
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors">
              ← Back to Events
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
