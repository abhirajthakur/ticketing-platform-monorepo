import { db, eq } from "@repo/database";
import { bookings, events } from "@repo/database/src/schema";
import express from "express";
import { getDynamicPriceForEvent } from "../utils/pricingEngine";

const router: express.Router = express.Router();

router.post("/", async (req: express.Request, res: express.Response) => {
  const { eventId, userEmail, quantity } = req.body;

  if (!eventId || !userEmail || quantity === undefined || quantity === null) {
    return res.status(400).json({
      error: "Missing required fields: eventId, userEmail, quantity",
    });
  }

  if (typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({
      error: "Quantity must be a positive number",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    return res.status(400).json({
      error: "Invalid email address",
    });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [event] = await tx
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .for("update");

      if (!event) {
        throw new Error("Event not found");
      }

      const available = event.totalTickets - (event.bookedTickets ?? 0);

      if (available < quantity) {
        throw new Error(
          `Not enough tickets available. Only ${available} tickets remaining.`,
        );
      }

      const currentPrice = await getDynamicPriceForEvent(eventId);

      if (!currentPrice) {
        throw new Error("Failed to calculate price");
      }

      const totalPrice = currentPrice * quantity;

      const [booking] = await tx
        .insert(bookings)
        .values({
          eventId,
          userEmail,
          quantity,
          pricePaid: totalPrice,
          bookedAt: new Date(),
        })
        .returning();

      await tx
        .update(events)
        .set({
          bookedTickets: (event.bookedTickets ?? 0) + quantity,
        })
        .where(eq(events.id, eventId));

      return { booking, currentPrice, totalPrice };
    });

    res.status(201).json({
      message: "Booking successful",
      booking: {
        id: result?.booking?.id,
        eventId: result?.booking?.eventId,
        userEmail: result?.booking?.userEmail,
        quantity: result?.booking?.quantity,
        pricePaid: result?.totalPrice,
        bookedAt: result?.booking?.bookedAt,
      },
    });
  } catch (err: any) {
    console.error("Booking error:", err.message);

    if (err.message === "Event not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message?.includes("Not enough tickets available")) {
      return res.status(400).json({ error: err.message });
    }

    if (err.message === "Failed to calculate price") {
      return res.status(500).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to complete booking" });
  }
});

router.get("/", async (req: express.Request, res: express.Response) => {
  const { email, eventId } = req.query;

  if (!email && !eventId) {
    return res.status(400).json({
      error: "Missing query parameter: provide either 'email' or 'eventId'",
    });
  }

  try {
    let userBookings;

    if (email) {
      userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.userEmail, email as string))
        .orderBy(bookings.bookedAt);

      return res.json(userBookings);
    }

    if (eventId) {
      userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.eventId, eventId as string))
        .orderBy(bookings.bookedAt);

      return res.json(userBookings);
    }

    // This should not happen due to the validation above, but just in case
    return res.json([]);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

export default router;
