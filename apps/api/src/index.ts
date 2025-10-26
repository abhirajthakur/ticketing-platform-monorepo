import cors from "cors";
import "dotenv/config";
import express from "express";
import analyticsRouter from "./routes/analytics";
import bookingRouter from "./routes/bookings";
import eventRouter from "./routes/events";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/bookings", bookingRouter);
app.use("/events", eventRouter);
app.use("/analytics", analyticsRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
