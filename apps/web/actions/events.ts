"use server";

import { createEvent } from "../lib/api";
import { CreateEventRequest } from "../lib/types";

export async function submitEvent(event: CreateEventRequest, apiKey: string) {
  try {
    const result = await createEvent(event, apiKey);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    };
  }
}
