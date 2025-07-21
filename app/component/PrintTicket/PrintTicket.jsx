"use client";
import { useEffect } from "react";

export default function PrintTicketPDF({
  orders,
  totalHT,
  totalTVA,
  totalTTC,
  tvaDetails,
  ticketNumber,
  selectedTable,
  setIsPrintOpen,
}) {
  useEffect(() => {
    async function generatePdf() {
      try {
        const html2pdf = (await import("html2pdf.js")).default;

        const element = document.createElement("div");
        element.style.fontFamily = "monospace";
        element.style.fontSize = "11px";
        element.style.padding = "5px";
        element.style.lineHeight = "1.2";

        const now = new Date();
        const formattedDate = now.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const itemLines = orders
          .flatMap((order) => order.items)
          .map((item) => {
            const total = (Number(item.price) * Number(item.quantity)).toFixed(2);
            return `<div style="display:flex; justify-content:space-between;">
                      <span>${item.name} x${item.quantity}</span>
                      <span>${total} €</span>
                    </div>`;
          })
          .join("");

        const tvaLines = Object.entries(tvaDetails || {})
          .map(
            ([rate, amount]) =>
              `<div style="display:flex; justify-content:space-between;">
                <span>TVA ${rate}%</span>
                <span>${Number(amount).toFixed(2)} €</span>
              </div>`
          )
          .join("");

        element.innerHTML = `
          <div style="text-align:center; font-weight:bold;">SARL PICARFRITES</div>
          <div style="text-align:center;">26 avenue de Perpignan, 66280 Saleilles</div>
          <div style="text-align:center;">Tél: 06.50.72.95.88</div>
          <div style="margin: 10px 0; text-align:center;">Table : ${selectedTable}</div>
          <div style="text-align:center;">Ticket N° ${ticketNumber}</div>
          <div style="text-align:center;">${formattedDate}</div>
          <hr style="border-top:1px dashed #000;" />
          ${itemLines}
          <hr style="border-top:1px dashed #000;" />
          ${tvaLines}
          <hr style="border-top:1px dashed #000;" />
          <div style="display:flex; justify-content:space-between; font-weight:bold;">
            <span>Total HT</span><span>${Number(totalHT).toFixed(2)} €</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:bold;">
            <span>Total TVA</span><span>${Number(totalTVA).toFixed(2)} €</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:bold;">
            <span>Total TTC</span><span>${Number(totalTTC).toFixed(2)} €</span>
          </div>
          <hr style="border-top:1px dashed #000;" />
          <div style="text-align:center;">Merci pour votre visite !</div>
        `;

        const opt = {
          margin: 0.2,
          filename: `ticket_${ticketNumber}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "cm", format: "a6", orientation: "portrait" },
        };

        const worker = html2pdf().set(opt).from(element);
        const pdfBlob = await worker.outputPdf("blob");

        // Ouvre dans un nouvel onglet
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, "_blank");

        // Propose le partage natif si dispo
        const file = new File([pdfBlob], `ticket_${ticketNumber}.pdf`, {
          type: "application/pdf",
        });

        if (
          navigator.canShare &&
          navigator.canShare({ files: [file] }) &&
          navigator.share
        ) {
          await navigator.share({
            title: `Ticket ${ticketNumber}`,
            text: `Voici votre ticket de caisse.`,
            files: [file],
          });
        }

        // Libère l'URL pour éviter les fuites mémoire
        URL.revokeObjectURL(pdfUrl);
      } catch (error) {
        console.error("Erreur lors de la génération ou du partage du PDF :", error);
      } finally {
        setIsPrintOpen(false);
      }
    }

    generatePdf();
  }, [
    orders,
    totalHT,
    totalTVA,
    totalTTC,
    tvaDetails,
    ticketNumber,
    selectedTable,
    setIsPrintOpen,
  ]);

  return null;
}
