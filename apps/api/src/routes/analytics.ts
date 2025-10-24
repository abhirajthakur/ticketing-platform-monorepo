import express from "express";
import { avg, count, db, eq, sum } from "@repo/database";
import { bookings, events } from "@repo/database/src/schema";

const router: express.Router = express.Router();

router.get(
  "/events/:id",
  async (req: express.Request, res: express.Response) => {
    const eventId = req.params.id as string;
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    if (!event) return res.status(404).json({ error: "Event not found" });

    const [bookingData] = await db
      .select({
        totalSold: sum(bookings.quantity),
        totalRevenue: sum(bookings.pricePaid),
        avgPrice: avg(bookings.pricePaid),
      })
      .from(bookings)
      .where(eq(bookings.eventId, eventId));

    const totalSold = Number(bookingData?.totalSold) ?? 0;
    const totalRevenue = Number(bookingData?.totalRevenue) ?? 0;
    const avgPrice = Number(bookingData?.avgPrice) ?? 0;
    const remaining = event.totalTickets - event.bookedTickets;

    res.json({
      eventId,
      totalSold,
      remaining,
      totalRevenue,
      avgPrice,
    });
  },
);

router.get("/summary", async (_req, res) => {
  const [summary] = await db
    .select({
      totalEvents: count(events.id),
      totalBookings: count(bookings.id),
      totalRevenue: sum(bookings.pricePaid),
    })
    .from(events)
    .leftJoin(bookings, eq(bookings.eventId, events.id));

  res.json(summary);
});

export default router;
