"use client";

import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { submitEvent } from "../../actions/events";
import { CreateEventRequest } from "../../lib/types";

const ADMIN_API_KEY = "this_is_not_secret";

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    venue: "",
    description: "",
    priceFloor: "",
    priceCeiling: "",
    totalTickets: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey === ADMIN_API_KEY) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Invalid API key");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError("");
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setValidationError("");
    setLoading(true);

    try {
      const priceFloor = Number.parseFloat(formData.priceFloor);
      const priceCeiling = formData.priceCeiling
        ? Number.parseFloat(formData.priceCeiling)
        : priceFloor * 2;
      const totalTickets = Number.parseInt(formData.totalTickets);

      if (isNaN(priceFloor)) {
        throw new Error("Please enter a valid floor price");
      }

      if (formData.priceCeiling && isNaN(priceCeiling)) {
        throw new Error("Please enter a valid ceiling price");
      }

      if (isNaN(totalTickets) || totalTickets <= 0) {
        throw new Error("Please enter a valid number of tickets");
      }

      if (priceCeiling <= priceFloor) {
        setValidationError(
          `Ceiling price ($${priceCeiling.toFixed(2)}) must be greater than floor price ($${priceFloor.toFixed(2)})`,
        );
        setLoading(false);
        return;
      }

      const eventDate = new Date(formData.date);
      if (eventDate <= new Date()) {
        setValidationError("Event date must be in the future");
        setLoading(false);
        return;
      }

      const eventData: CreateEventRequest = {
        name: formData.name,
        date: eventDate.toISOString(),
        venue: formData.venue,
        description: formData.description,
        priceFloor,
        priceCeiling,
        totalTickets,
        pricingRules: {
          basePrice: priceFloor,
        },
      };

      const result = await submitEvent(eventData, ADMIN_API_KEY);

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess("Event created successfully!");
      setFormData({
        name: "",
        date: "",
        venue: "",
        description: "",
        priceFloor: "",
        priceCeiling: "",
        totalTickets: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  Admin Authentication
                </h2>
                <p className="text-sm text-slate-600">
                  Enter your API key to access admin panel
                </p>
              </div>
              <div className="p-6">
                <form onSubmit={handleAuth} className="space-y-4">
                  <input
                    type="password"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
                      <p className="font-semibold mb-1">Error</p>
                      <p>{error}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-600">Create and manage events</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/events">
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors">
                ← Back to Events
              </button>
            </Link>
            <button
              onClick={() => setAuthenticated(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content with top padding to account for fixed navbar */}
      <div className="pt-24 min-h-screen flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Create New Event
              </h2>
              <p className="text-sm text-slate-600">
                Add a new event to the system with dynamic pricing
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Event Name
                  </label>
                  <input
                    name="name"
                    placeholder="Concert, Conference, etc."
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Date & Time
                  </label>
                  <input
                    name="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Venue
                  </label>
                  <input
                    name="venue"
                    placeholder="Location of the event"
                    value={formData.venue}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Event description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Floor Price ($)
                    </label>
                    <input
                      name="priceFloor"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="50.00"
                      value={formData.priceFloor}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Base price</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Ceiling Price ($)
                    </label>
                    <input
                      name="priceCeiling"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="100.00"
                      value={formData.priceCeiling}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Optional (2x floor)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Total Tickets
                    </label>
                    <input
                      name="totalTickets"
                      type="number"
                      min="1"
                      placeholder="100"
                      value={formData.totalTickets}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Capacity</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Dynamic Pricing:</strong> Prices will automatically
                    adjust based on time until event, booking demand, and
                    remaining inventory.
                  </p>
                </div>

                {validationError && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm">
                    <p className="font-semibold mb-1">Validation Error</p>
                    <p>{validationError}</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
                    <p className="font-semibold mb-1">Error</p>
                    <p>{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-sm">
                    <p className="font-semibold mb-1">Success</p>
                    <p>{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Event"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
