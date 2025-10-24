import express from "express";
import bookingRouter from "./routes/bookings";
import eventRouter from "./routes/events";
import analyticsRouter from "./routes/analytics";

const app = express();

app.use(express.json());

app.use("/bookings", bookingRouter);
app.use("/events", eventRouter);
app.use("/analytics", analyticsRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
