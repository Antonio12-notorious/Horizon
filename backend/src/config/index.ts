/**
 * Configuração centralizada de variáveis de ambiente
 */
import dotenv from "dotenv";
dotenv.config();

const requiredEnvs = [
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRES_IN",
    "JWT_EXPIRES_IN",
    "EMAIL_USER",
    "EMAIL_PASS",
];

// Verificar variáveis obrigatórias
const missing = requiredEnvs.filter(env => !process.env[env]);

if (missing.length > 0 && process.env.NODE_ENV === "production") {
    throw new Error(
        `Variáveis de ambiente obrigatórias não configuradas: ${missing.join(", ")}\n` +
        `Configure as seguintes variáveis:\n` +
        missing.map(env => `  - ${env}`).join("\n")
    );
}

export const config = {
    // Database
    database: {
        url: process.env.DATABASE_URL || "postgresql://localhost:5432/erp_crystech",
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
        refreshSecret: process.env.JWT_REFRESH_SECRET,   
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d", 
    },

    // Email
    email: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@erp.local",
        frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    },

    // Server
    server: {
        port: parseInt(process.env.PORT || "3001", 10),
        env: process.env.NODE_ENV || "development",
        isDevelopment: process.env.NODE_ENV !== "production",
        isProduction: process.env.NODE_ENV === "production",
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 min
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    },

    // CORS
    cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            const allowedOrigins = [
                ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map(origin => origin.trim()) : []),
                "http://localhost:5173",
                "https://horizon-erpt.vercel.app",
            ].filter(Boolean);

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
    },
};

// Validar JWT_SECRET em produção
if (
    process.env.NODE_ENV === "production" &&
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.length < 32
) {
    console.warn(
        "⚠️  AVISO: JWT_SECRET em produção deve ter no mínimo 32 caracteres"
    );
}

export default config;
