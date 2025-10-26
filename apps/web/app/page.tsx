import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900">
              Event Booking
            </h1>
            <p className="text-xl text-slate-600">
              Discover and book tickets to amazing events
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto">
                Browse Events
              </button>
            </Link>
            <Link href="/my-bookings">
              <button className="px-8 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto">
                My Bookings
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg bg-white border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                Easy Booking
              </h3>
              <p className="text-sm text-slate-600">
                Book tickets in just a few clicks with real-time pricing
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                Live Updates
              </h3>
              <p className="text-sm text-slate-600">
                See price changes and availability in real-time
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                Track Bookings
              </h3>
              <p className="text-sm text-slate-600">
                View all your bookings and compare prices paid
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
