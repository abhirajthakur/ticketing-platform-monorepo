import { db, eq } from "@repo/database";
import { bookings, events } from "@repo/database/src/schema";
import express from "express";
import { getDynamicPriceForEvent } from "../utils/pricingEngine";

const router: express.Router = express.Router();

router.post("/", async (req: express.Request, res: express.Response) => {
  const { eventId, userEmail, quantity } = req.body;
  const now = new Date();

  if (!eventId || !userEmail || !quantity) {
    return res
      .status(400)
      .json({ error: "Missing or invalid eventId, userEmail, or quantity" });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [event] = await tx
        .select()
        .from(events)
        .where(eq(events.id, eventId));

      if (!event) {
        throw new Error("Event not found");
      }

      const available = event.totalTickets - event.bookedTickets;
      if (available < quantity) {
        throw new Error("Not enough tickets available");
      }

      const currentPrice = await getDynamicPriceForEvent(eventId);

      await tx.insert(bookings).values({
        eventId,
        userEmail,
        quantity,
        pricePaid: currentPrice as number,
        bookedAt: now,
      });

      await tx
        .update(events)
        .set({
          bookedTickets: event.bookedTickets + quantity,
        })
        .where(eq(events.id, eventId));

      return { currentPrice, quantity };
    });

    res.status(201).json({
      message: "Booking successful",
      pricePaid: result.currentPrice,
      quantity: result.quantity,
    });
  } catch (err: any) {
    console.error("Booking error:", err.message);
    if (err.message === "Not enough tickets available") {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === "Event not found") {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: "Failed to complete booking" });
  }
});

// ?eventId=1
router.get("/", async (req, res) => {
  const eventId = req.query.eventId as string;
  if (!eventId) {
    return res.status(400).json({ error: "Missing eventId" });
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.eventId, eventId));

  if (!booking) {
    return res.status(404).json({ error: "No bookings found for this event" });
  }

  res.json(booking);
});

export default router;
