"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { submitBooking } from "../actions/bookings";
import { EventWithPrice } from "../lib/types";

interface BookingFormProps {
  event: EventWithPrice;
}

export function BookingForm({ event }: BookingFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ticketsRemaining = event.availableTickets;
  const currentPrice = event.currentPrice;
  const totalPrice = currentPrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email) {
        throw new Error("Please enter your email");
      }
      if (quantity < 1 || quantity > ticketsRemaining) {
        throw new Error(
          `Please select between 1 and ${ticketsRemaining} tickets`,
        );
      }

      const result = await submitBooking({
        eventId: event.id,
        userEmail: email,
        quantity,
      });

      console.log(result);

      if (!result.success) {
        throw new Error(result.error);
      }

      sessionStorage.setItem("lastBooking", JSON.stringify(result.data));
      router.push("/bookings/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Book Tickets</h3>
        <p className="text-sm text-slate-600">
          Complete your booking for {event.name}
        </p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-900 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-slate-900 mb-2"
            >
              Number of Tickets
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                −
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                max={ticketsRemaining}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(
                        ticketsRemaining,
                        Number.parseInt(e.target.value) || 1,
                      ),
                    ),
                  )
                }
                className="w-20 text-center px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity(Math.min(ticketsRemaining, quantity + 1))
                }
                className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-slate-600 ml-2">
                {ticketsRemaining} available
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-slate-600">Current price per ticket</span>
              <span className="text-slate-900">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-600">Quantity</span>
              <span className="text-slate-900">{quantity}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-lg text-slate-900">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Price may change before booking is confirmed
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || ticketsRemaining === 0}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : ticketsRemaining === 0
                ? "Sold Out"
                : "Complete Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
