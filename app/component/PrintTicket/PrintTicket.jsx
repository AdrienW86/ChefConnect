import { useEffect } from "react";
import html2pdf from "html2pdf.js";

export default function PrintTicketPDF({ orders, totalTTC, ticketNumber, selectedTable, setIsPrintOpen }) {
  useEffect(() => {
    const element = document.createElement("div");
    element.style.fontFamily = "monospace";
    element.style.fontSize = "11px";
    element.innerHTML = `
      <div style="text-align:center; font-weight:bold; margin-bottom:10px;">SARL PICARFRITES</div>
      <div>Table : ${selectedTable}</div>
      <div>Ticket N° ${ticketNumber}</div>
      <div>Date : ${new Date().toLocaleString()}</div>
      <hr />
      ${orders
        .flatMap(order => order.items)
        .map(item => `<div>${item.name} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)}€</div>`)
        .join("")}
      <hr />
      <div style="font-weight:bold;">Total TTC : ${totalTTC.toFixed(2)}€</div>
      <hr />
      <div style="text-align:center;">Merci pour votre visite !</div>
    `;

    // Options pour html2pdf
    const opt = {
      margin: 0.2,
      filename: `ticket_${ticketNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a6', orientation: 'portrait' }
    };

    // Générer le PDF en Blob puis l'ouvrir dans un nouvel onglet
    html2pdf().set(opt).from(element).outputPdf('blob').then((pdfBlob) => {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
      setIsPrintOpen(false);
    });
  }, []);

  return null;
}
