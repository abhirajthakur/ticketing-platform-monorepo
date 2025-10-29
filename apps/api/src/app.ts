import cors from "cors";
import "dotenv/config";
import express from "express";
import analyticsRouter from "./routes/analytics";
import bookingRouter from "./routes/bookings";
import eventRouter from "./routes/events";
import seedRouter from "./routes/seed";

const app: express.Application = express();

app.use(express.json());
app.use(cors());

app.use("/bookings", bookingRouter);
app.use("/events", eventRouter);
app.use("/analytics", analyticsRouter);
app.use("/seed", seedRouter);

export default app;
