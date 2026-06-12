import { jsPDF } from "jspdf";

interface InvoiceItem {
    id: string;
    serviceId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    service: { name: string; price: number };
}

interface Invoice {
    id: string;
    client: { name: string; email: string; phone?: string };
    issueDate: string;
    dueDate?: string;
    total: number;
    notes?: string;
    status: string;
    items: InvoiceItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [37, 99, 235];
}

function darken(hex: string, amount = 30): [number, number, number] {
    const [r, g, b] = hexToRgb(hex);
    return [Math.max(0, r - amount), Math.max(0, g - amount), Math.max(0, b - amount)];
}

function lighten(hex: string, amount = 200): [number, number, number] {
    const [r, g, b] = hexToRgb(hex);
    return [Math.min(255, r + amount), Math.min(255, g + amount), Math.min(255, b + amount)];
}

// ─── Main Generator ───────────────────────────────────────────────────────────

/**
 * @param invoice         - Dados da fatura
 * @param formatCurrency  - Função para formatar valores monetários
 * @param primaryColor    - Cor principal (hex)
 * @param logoSrc         - (Opcional) URL do logo importado estaticamente via Vite.
 *                          Ex: import logoSrc from "@/assets/logo.png"
 *                          Pode ser PNG, JPG ou SVG rasterizado.
 *                          Se não fornecido, mostra o nome da empresa em texto.
 */
export function generateInvoicePDF(
    invoice: Invoice,
    formatCurrency: (value: number) => string,
    primaryColor = "#2563eb",
    logoSrc?: string
) {
    const doc = new jsPDF("p", "mm", "a4");

    const W = doc.internal.pageSize.getWidth();   // 210
    const H = doc.internal.pageSize.getHeight();  // 297
    const M = 16; // margin

    const [pr, pg, pb] = hexToRgb(primaryColor);
    const [dr, dg, db] = darken(primaryColor, 40);
    const [lr, lg, lb] = lighten(primaryColor, 220);

    const invoiceNumber = `INV-${invoice.id.slice(-8).toUpperCase()}`;

    // ─── Background ────────────────────────────────────────────────────────────

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, "F");

    // Subtle top accent bar
    doc.setFillColor(lr, lg, lb);
    doc.rect(0, 0, W, 3, "F");

    // ─── Header area ───────────────────────────────────────────────────────────

    // Left: Logo + company info
    const logoAreaX = M;
    const logoAreaY = 10;
    const logoW = 50;  // largura do logo
    const logoH = 20;  // altura do logo

    if (logoSrc) {
        // ── Com logo importado estaticamente (Vite) ───────────────────────────
        // Vite resolve o import como URL de blob/data, compatível com addImage
        const formatMatch = logoSrc.match(/\.(\w+)(\?.*)?$/);
        const imgFormat = formatMatch ? formatMatch[1].toUpperCase().replace("JPG", "JPEG") : "PNG";

        doc.addImage(logoSrc, imgFormat, logoAreaX, logoAreaY, logoW, logoH);

        // Informações de contacto por baixo do logo
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 110);
        doc.text("Av. Correia de Britos, Cidade da Beira", logoAreaX, logoAreaY + logoH + 6);
        doc.text("+258 878 668 672  •  comercial@crystechsolutions.com", logoAreaX, logoAreaY + logoH + 12);
        doc.text("NUIT: 1289645", logoAreaX, logoAreaY + logoH + 18);

    } else {
        // ── Sem imagem: bloco colorido com nome da empresa (fallback) ─────────
        doc.setFillColor(pr, pg, pb);
        doc.roundedRect(logoAreaX, logoAreaY, 82, 46, 3, 3, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("CrysTech", logoAreaX + 6, logoAreaY + 14);
        doc.text("Solutions", logoAreaX + 6, logoAreaY + 22);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(220, 235, 255);
        doc.text("Av. Correia de Britos, Cidade da Beira", logoAreaX + 6, logoAreaY + 30);
        doc.text("+258 878 668 672", logoAreaX + 6, logoAreaY + 36);
        doc.text("comercial@crystechsolutions.com", logoAreaX + 6, logoAreaY + 42);
    }

    // Right: Invoice title & number & status
    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text("FATURA", W - M, 28, { align: "right" });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(invoiceNumber, W - M, 37, { align: "right" });

    // Status badge
    let [sr, sg, sb] = [245, 158, 11]; // amber (Pendente)
    if (invoice.status === "Pago") [sr, sg, sb] = [34, 197, 94];
    if (invoice.status === "Cancelado") [sr, sg, sb] = [239, 68, 68];

    doc.setFillColor(sr, sg, sb);
    doc.roundedRect(W - M - 30, 42, 30, 9, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(invoice.status.toUpperCase(), W - M - 15, 48, { align: "center" });

    // ─── Divider ───────────────────────────────────────────────────────────────

    // Calcula a posição Y do divider dinamicamente conforme altura usada
    const headerBottom = logoSrc
        ? logoAreaY + logoH + 22  // logo + contactos (3 linhas)
        : logoAreaY + 50;          // bloco colorido

    const dividerY = Math.max(headerBottom, 62);

    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.4);
    doc.line(M, dividerY, W - M, dividerY);

    // ─── Info Row (Cliente + Datas) ─────────────────────────────────────────────

    const infoY = dividerY + 6;

    // Cliente card
    doc.setFillColor(250, 251, 255);
    doc.roundedRect(M, infoY, 88, 40, 3, 3, "F");
    doc.setDrawColor(lr, lg, lb);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, infoY, 88, 40, 3, 3);

    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("FATURADO PARA", M + 5, infoY + 8);

    doc.setDrawColor(lr, lg, lb);
    doc.setLineWidth(0.3);
    doc.line(M + 5, infoY + 11, M + 83, infoY + 11);

    doc.setTextColor(20, 20, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(invoice.client?.name || "—", M + 5, infoY + 21);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 100);
    if (invoice.client?.email) doc.text(invoice.client.email, M + 5, infoY + 29);
    if (invoice.client?.phone) doc.text(invoice.client.phone, M + 5, infoY + 36);

    // Dates card
    const datesX = M + 96;
    doc.setFillColor(250, 251, 255);
    doc.roundedRect(datesX, infoY, 98, 40, 3, 3, "F");
    doc.setDrawColor(lr, lg, lb);
    doc.setLineWidth(0.5);
    doc.roundedRect(datesX, infoY, 98, 40, 3, 3);

    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("DETALHES DA FATURA", datesX + 5, infoY + 8);

    doc.setDrawColor(lr, lg, lb);
    doc.setLineWidth(0.3);
    doc.line(datesX + 5, infoY + 11, datesX + 93, infoY + 11);

    const col1 = datesX + 5;
    const col2 = datesX + 93;

    doc.setTextColor(110, 110, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Data de Emissão:", col1, infoY + 20);
    doc.text("Data de Vencimento:", col1, infoY + 29);
    doc.text("Nº Fatura:", col1, infoY + 38);

    doc.setTextColor(20, 20, 30);
    doc.setFont("helvetica", "bold");
    doc.text(new Date(invoice.issueDate).toLocaleDateString("pt-PT"), col2, infoY + 20, { align: "right" });
    doc.text(
        invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("pt-PT") : "—",
        col2, infoY + 29, { align: "right" }
    );
    doc.text(invoiceNumber, col2, infoY + 38, { align: "right" });

    // ─── Table Header ───────────────────────────────────────────────────────────

    const tableY = infoY + 50;
    const tableW = W - M * 2;

    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(M, tableY, tableW, 11, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    const colDesc = M + 6;
    const colQty = M + 108;
    const colUnit = M + 130;
    const colSub = W - M - 4;

    doc.text("DESCRIÇÃO DO SERVIÇO", colDesc, tableY + 7.5);
    doc.text("QTD", colQty, tableY + 7.5, { align: "center" });
    doc.text("PREÇO UNIT.", colUnit, tableY + 7.5);
    doc.text("SUBTOTAL", colSub, tableY + 7.5, { align: "right" });

    // ─── Table Rows ─────────────────────────────────────────────────────────────

    let rowY = tableY + 11;
    const rowH = 11;

    (invoice.items || []).forEach((item: any, i: number) => {
        if (i % 2 === 0) {
            doc.setFillColor(lr, lg, lb);
        } else {
            doc.setFillColor(250, 250, 252);
        }
        doc.rect(M, rowY, tableW, rowH, "F");

        doc.setTextColor(25, 25, 35);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(item.service?.name || "Serviço", colDesc, rowY + 7.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(70, 70, 80);
        doc.text(String(item.quantity), colQty, rowY + 7.5, { align: "center" });

        doc.text(formatCurrency(item.unitPrice), colUnit, rowY + 7.5);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(pr, pg, pb);
        doc.text(formatCurrency(item.subtotal), colSub, rowY + 7.5, { align: "right" });

        rowY += rowH;
    });

    // Table bottom border
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.4);
    doc.line(M, rowY, W - M, rowY);

    // ─── Totals Section ─────────────────────────────────────────────────────────

    const totalBlockX = W - M - 80;
    const totalBlockY = rowY + 6;

    // TOTAL highlight (IVA incl.)
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(totalBlockX - 2, totalBlockY, W - M - totalBlockX + 2, 14, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("TOTAL (IVA incl.)", totalBlockX + 2, totalBlockY + 9);

    doc.setFontSize(13);
    doc.text(formatCurrency(invoice.total), W - M - 3, totalBlockY + 9, { align: "right" });

    // ─── Notes ──────────────────────────────────────────────────────────────────

    const notesY = totalBlockY + 20;

    doc.setFillColor(250, 251, 255);
    doc.roundedRect(M, notesY, tableW, 22, 3, 3, "F");
    doc.setDrawColor(lr, lg, lb);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, notesY, tableW, 22, 3, 3);

    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(M, notesY, 3, 22, 1, 1, "F");

    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("OBSERVAÇÕES", M + 7, notesY + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 90);
    doc.text(
        invoice.notes || "Agradecemos a sua preferência. Qualquer questão, contacte-nos.",
        M + 7,
        notesY + 16
    );

    // ─── Payment Info ────────────────────────────────────────────────────────────

    const payY = notesY + 28;

    doc.setFillColor(250, 251, 255);
    doc.roundedRect(M, payY, tableW, 22, 3, 3, "F");
    doc.setDrawColor(lr, lg, lb);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, payY, tableW, 22, 3, 3);

    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(M, payY, 3, 22, 1, 1, "F");

    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("INFORMAÇÕES DE PAGAMENTO", M + 7, payY + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 90);
    doc.text("Banco: Millennium BIM  |  Conta: 12345678  |  NIB: 00123456789012345678901", M + 7, payY + 16);

    // ─── Footer ──────────────────────────────────────────────────────────────────

    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(0.5);
    doc.line(M, H - 22, W - M, H - 22);

    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(M, H - 20, W - M * 2, 12, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Obrigado por escolher a CrysTech Solutions!", W / 2, H - 12, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 220, 255);
    doc.text(
        "crystechsolutions.com  •  +258 878 668 672  •  comercial@crystechsolutions.com",
        W / 2,
        H - 7,
        { align: "center" }
    );

    // ─── Watermark for cancelled invoices ────────────────────────────────────────

    if (invoice.status === "Cancelado") {
        doc.setTextColor(239, 68, 68);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(60);
        doc.setGState(doc.GState({ opacity: 0.08 }));
        doc.text("CANCELADO", W / 2, H / 2, { align: "center", angle: 45 });
        doc.setGState(doc.GState({ opacity: 1 }));
    }

    // ─── Save ────────────────────────────────────────────────────────────────────

    doc.save(`Fatura_${invoiceNumber}.pdf`);
}