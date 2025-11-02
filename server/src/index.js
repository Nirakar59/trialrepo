import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieparser from "cookie-parser";

// Import routes
import { connectDb } from "./db/dbConnect.js";
import postRoutes from "./routes/post.routes.js";
import searchRoutes from "./routes/search.routes.js";
import messageRoutes from "./routes/message.routes.js";
import callRoutes from "./routes/call.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import userRoutes from "./routes/user.routes.js";
import groupRoutes from "./routes/group.routes.js";
import homeRoutes from "./routes/home.routes.js";
import { setUpSocket } from "./sockets/socket.io.js";
import storyRoutes from "./routes/strory.routes.js";
import authRouters from "./routes/auth.routes.js";

// Load environment variables
dotenv.config();

// Middleware
const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

// CORS middleware configuration 
const allowedOrigins = [
  'http://localhost:5173',
  'https://sanjal-chakra.vercel.app',
  'https://sanjal-chakra.vercel.app/'
];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps or curl)
    if (!origin) return callback(null, true);
    // Check if the request origin is in the allowedOrigins list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieparser());

// Routes
app.use("/api/auth", authRouters);;
app.use("/api/post/", postRoutes);
app.use("/api/search/", searchRoutes);
app.use("/api/message/", messageRoutes);
app.use("/api/call/", callRoutes);
app.use("/api/notify/", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/home", homeRoutes);
app.use('/api/story', storyRoutes)


// Socket.IO setup
setUpSocket(server);

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  connectDb();
});
