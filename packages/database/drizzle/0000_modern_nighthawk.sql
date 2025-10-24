CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"price_paid" real NOT NULL,
	"booked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"date" timestamp NOT NULL,
	"venue" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"total_tickets" integer NOT NULL,
	"booked_tickets" integer DEFAULT 0 NOT NULL,
	"price_floor" real NOT NULL,
	"price_ceiling" real NOT NULL,
	"pricing_rules" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;