import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const email = "admin@horizonapi.com";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log("✅ Admin já existe:", email);
        return;
    }

    const password = await bcrypt.hash("antonio@1234", 12);

    const admin = await prisma.user.create({
        data: {
            name: "Administrador",
            email,
            password,
            role: "ADMIN",
            status: "ATIVO",
            mustChangePassword: false,
        },
    });

    console.log("✅ Admin criado com sucesso!");
    console.log("   Email:  ", admin.email);
    console.log("   Senha:  ", "antonio@1234");
    console.log("   Role:   ", admin.role);
    console.log("\n⚠️  Altere a senha após o primeiro login.");
}

main()
    .catch((e) => {
        console.error("❌ Erro no seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });