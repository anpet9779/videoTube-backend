import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

/* Common middlewares to intercept request and for added security */

app.use(express.json({ limit: "16kb" })); // limit json data to be at max 16 kb
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // for allowing urlendcoded data
app.use(express.static("public")); // this is for serving assets like img, icons, fonts

/* Cookie Parser */
app.use(cookieParser());

/* Routes */

//import routes

import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

//routes
app.use("/api/v1/healthcheck", healthcheckRouter);

app.use("/api/v1/users", userRouter);

// app.use(errorHandler);  // Need to check for statusCode should be integer error
export { app };
