import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

import authRoutes from "./modules/auth/auth.routes.js";
import clientsRoutes from "./modules/clients/clients.routes.js";
import servicesRoutes from "./modules/services/service.routes.js";
import invoicesRoutes from "./modules/invoices/invoices.routes.js";
import appointmentsRoutes from "./modules/appointments/appointments.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import usersRoutes from "./modules/auth/user/user.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import searchRoutes from "./modules/search/Search.routes.js";

const app = express();
app.use(cors(config.cors));
app.use(cors ({
    origin:[
        'http://localhost:5173',
        'https://horizon-erpt.vercel.app'
    ]
}))
app.use(express.json());
app.set("etag", false);


// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Horizon API 🚀",
        environment: config.server.env,
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/search", searchRoutes);      

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `Rota ${req.method} ${req.path} não encontrada`,
        statusCode: 404
    });
});

// Global error handler
app.use(errorHandler);

export default app;