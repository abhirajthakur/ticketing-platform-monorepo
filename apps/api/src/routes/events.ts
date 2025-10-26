import { db, eq } from "@repo/database";
import { events } from "@repo/database/src/schema";
import express from "express";
import {
  getDynamicPriceForEvent,
  getPriceWithBreakdown,
} from "../utils/pricingEngine";

const router: express.Router = express.Router();

router.get("/", async (_req: express.Request, res: express.Response) => {
  const allEvents = await db.select().from(events);
  if (allEvents.length === 0) {
    return res.status(404).json({ error: "No events found" });
  }

  const result = await Promise.all(
    allEvents.map(async (event) => ({
      id: event.id,
      name: event.name,
      venue: event.venue,
      currentPrice: await getDynamicPriceForEvent(event.id),
      availableTickets: event.totalTickets - event.bookedTickets,
    })),
  );
  res.json(result);
});

router.get("/:id", async (req: express.Request, res: express.Response) => {
  const id = req.params.id;
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, id as string));

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  const priceData = await getPriceWithBreakdown(id as string);

  if (!priceData) {
    return res.status(500).json({ error: "Failed to calculate pricing" });
  }

  res.json({
    ...event,
    currentPrice: priceData.breakdown.currentPrice,
    availableTickets: priceData.availableTickets,
    priceBreakdown: priceData.breakdown,
  });
});

router.post("/", async (req: express.Request, res: express.Response) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const {
      name,
      description,
      date,
      venue,
      totalTickets,
      priceFloor,
      priceCeiling,
      pricingRules,
    } = req.body;

    if (!name || !date || !totalTickets || !priceFloor || !venue) {
      return res.status(400).json({
        error:
          "Missing required fields: name, date, totalTickets, priceFloor, venue",
      });
    }

    const eventDate = new Date(date);

    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    if (eventDate <= new Date()) {
      return res.status(400).json({
        error: "Event date must be in the future",
      });
    }

    const floor = Number(priceFloor);
    const ceiling = priceCeiling ? Number(priceCeiling) : floor * 2;

    if (floor > ceiling || floor < 0 || ceiling < 0) {
      return res.status(400).json({
        error:
          "Invalid price range: floor must be less than ceiling and both must be positive",
      });
    }

    if (Number(totalTickets) <= 0) {
      return res.status(400).json({
        error: "Total tickets must be greater than 0",
      });
    }

    const newEvent = {
      name: name as string,
      description: (description as string) || "",
      date: eventDate,
      venue: venue as string,
      totalTickets: Number(totalTickets),
      bookedTickets: 0,
      priceFloor: floor,
      priceCeiling: ceiling,
      pricingRules: pricingRules || { basePrice: floor },
    };

    const [insertedEvent] = await db
      .insert(events)
      .values(newEvent)
      .returning();

    return res.status(201).json({
      message: "Event created successfully",
      event: insertedEvent,
    });
  } catch (err) {
    console.error("Error creating event:", err);
    return res.status(500).json({ error: "Failed to create event" });
  }
});

export default router;
