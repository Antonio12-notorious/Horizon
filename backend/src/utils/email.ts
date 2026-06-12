import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 📧 EMAIL VERIFICAÇÃO
export async function sendVerificationEmail(email: string, token: string) {
    try {
        const link = `http://localhost:5173/verify-email?token=${token}`;

        await transporter.sendMail({
            from: `"MiniERP" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verifica a tua conta",
            html: `
                <h2>Verificação de conta</h2>
                <a href="${link}">Ativar conta</a>
            `
        });

        console.log("Email enviado para:", email);
    } catch (err) {
        console.error("Erro ao enviar email:", err);
        throw new Error("Falha no envio de email");
    }
}

// 📧 RESET PASSWORD
export async function sendResetEmail(email: string, token: string) {
    try {
        const link = `http://localhost:5173/reset-password?token=${token}`;

        await transporter.sendMail({
            from: `"MiniERP" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Reset da password",
            html: `
                <h2>Reset Password</h2>
                <a href="${link}">${link}</a>
            `
        });

        console.log("Email de reset enviado para:", email);
    } catch (err) {
        console.error("Erro ao enviar email de reset:", err);
        throw new Error("Falha no envio de email de reset");
    }
}