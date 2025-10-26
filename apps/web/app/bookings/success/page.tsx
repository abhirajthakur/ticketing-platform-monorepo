"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Booking } from "../../../lib/types";

interface BookingWithEventName extends Booking {
  eventName?: string;
}

export default function BookingSuccessPage() {
  const [booking, setBooking] = useState<BookingWithEventName | null>(null);

  useEffect(() => {
    const bookingData = sessionStorage.getItem("lastBooking");
    if (bookingData) {
      const parsed = JSON.parse(bookingData);
      setBooking(parsed.booking);
      sessionStorage.removeItem("lastBooking");
    }
  }, []);

  if (!booking) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  No Booking Found
                </h2>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-4">
                  It looks like you don&apos;t have a recent booking to display.
                </p>
                <Link href="/events">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Browse Events
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-4xl font-bold text-slate-900">
              Booking Confirmed!
            </h1>
            <p className="text-slate-600">Your tickets have been reserved</p>
          </div>

          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Booking Details
              </h2>
              <p className="text-sm text-slate-600">
                Confirmation for your event booking
              </p>
            </div>
            <div className="p-6 space-y-4">
              {booking.eventName && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Event</p>
                  <p className="font-semibold text-lg text-blue-900">
                    {booking.eventName}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-semibold text-slate-900">
                    {booking.userEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Booking ID</p>
                  <p className="font-mono text-xs text-slate-900">
                    {booking.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Number of Tickets</p>
                  <p className="font-semibold text-lg text-slate-900">
                    {booking.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Booking Date</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(booking.bookedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Price per ticket</span>
                  <span className="text-slate-900">
                    ${(booking.pricePaid / booking.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Quantity</span>
                  <span className="text-slate-900">{booking.quantity}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg text-slate-900">
                  <span>Total Paid</span>
                  <span>${booking.pricePaid.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <p className="text-xs text-slate-600">
                  A confirmation has been sent to{" "}
                  <span className="font-medium text-slate-900">
                    {booking.userEmail}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/events" className="flex-1">
              <button className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors font-medium">
                Browse More Events
              </button>
            </Link>
            <Link href="/my-bookings" className="flex-1">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                View My Bookings
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
