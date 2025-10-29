import cors from "cors";
import "dotenv/config";
import express from "express";
import analyticsRouter from "./routes/analytics";
import bookingRouter from "./routes/bookings";
import eventRouter from "./routes/events";

const app: express.Application = express();

app.use(express.json());
app.use(cors());

app.use("/bookings", bookingRouter);
app.use("/events", eventRouter);
app.use("/analytics", analyticsRouter);

export default app;
