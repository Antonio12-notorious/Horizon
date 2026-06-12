
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { config } from "./config";

const server = app.listen(config.server.port, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 Horizon API Iniciado            ║
╚════════════════════════════════════════╝
🌍 URL: http://localhost:${config.server.port}
📦 Ambiente: ${config.server.env.toUpperCase()}
🔒 Autenticação: JWT ✓
💾 Database: Prisma ORM ✓
`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM recebido, encerrando servidor...");
  server.close(() => {
    console.log("Servidor encerrado com sucesso");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT recebido, encerrando servidor...");
  server.close(() => {
    console.log("Servidor encerrado com sucesso");
    process.exit(0);
  });
});