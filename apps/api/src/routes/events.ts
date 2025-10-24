import { db, eq } from "@repo/database";
import { events } from "@repo/database/src/schema";
import express from "express";
import { getDynamicPriceForEvent } from "../utils/pricingEngine";

const router: express.Router = express.Router();

router.get("/", async (_req: express.Request, res: express.Response) => {
  const allEvents = await db.select().from(events);
  if (allEvents.length === 0) {
    return res.status(404).json({ error: "No events found" });
  }

  const result = allEvents.map(async (event) => ({
    name: event.name,
    currentPrice: await getDynamicPriceForEvent(event.id),
    availability: event.totalTickets - event.bookedTickets,
  }));
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

  const price = await getDynamicPriceForEvent(id as string);

  res.json({
    ...event,
    dynamicPrice: price,
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
        error: "Missing required fields",
      });
    }

    const newEvent = {
      name: name as string,
      description: description || "",
      date: new Date(date),
      venue: venue as string,

      totalTickets: Number(totalTickets),

      priceFloor: Number(priceFloor) || Number(priceFloor),
      priceCeiling: Number(priceCeiling) || Number(priceFloor) * 2,

      pricingRules: pricingRules || { basePrice: Number(priceFloor) },
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
