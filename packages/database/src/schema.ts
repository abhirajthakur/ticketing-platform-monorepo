import {
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid().notNull().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  date: timestamp().notNull(),
  venue: varchar({ length: 255 }).notNull(),
  description: text().notNull(),

  totalTickets: integer("total_tickets").notNull(),
  bookedTickets: integer("booked_tickets").notNull().default(0),

  priceFloor: real("price_floor").notNull(),
  priceCeiling: real("price_ceiling").notNull(),

  pricingRules: jsonb("pricing_rules").notNull(), // e.g., { demandThreshold: 0.8, increaseRate: 0.1 }
});

export const bookings = pgTable("bookings", {
  id: serial().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id)
    .notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  quantity: integer().notNull(),
  pricePaid: real("price_paid").notNull(),
  bookedAt: timestamp("booked_at").defaultNow().notNull(),
});
