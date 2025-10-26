"use server";

import { createBooking } from "../lib/api";
import { BookingRequest } from "../lib/types";

export async function submitBooking(booking: BookingRequest) {
  try {
    const result = await createBooking(booking);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create booking",
    };
  }
}
