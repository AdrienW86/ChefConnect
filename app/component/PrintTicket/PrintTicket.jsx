"use client";
import { useEffect } from "react";

export default function PrintTicket({
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
    const now = new Date();
    const formattedDate = now.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const printWindow = window.open("data:text/html;charset=utf-8,", "_blank", "width=300,height=600");
    if (!printWindow) return;

    const styles = `
      <style>
        body {
          font-family: monospace;
          font-size: 11px;
          padding: 5px;
          line-height: 1.2;
        }
        .center {
          text-align: center;
        }
        .bold {
          font-weight: bold;
        }
        .line {
          display: flex;
          justify-content: space-between;
        }
        .separator {
          border-top: 1px dashed #000;
          margin: 3px 0;
        }
        .spacer {
          margin: 4px 0;
        }
        .total {
          font-weight: bold;
        }
      </style>
    `;

    const itemLines = orders
      .flatMap(order => order.items)
      .map(item => {
        const total = (Number(item.price) * Number(item.quantity)).toFixed(2);
        return `
        <div class="line">
          <span>${item.name} x${item.quantity}</span>
          <span>${total}€</span>
        </div>`;
      })
      .join("");

    const tvaLines = Object.entries(tvaDetails)
      .map(
        ([rate, amount]) =>
          `<div class="line"><span>TVA ${rate}%</span><span>${amount}€</span></div>`
      )
      .join("");

    const content = `
      <html>
        <head><title>Ticket #${ticketNumber}</title>${styles}</head>
        <body>
          <div class="center bold">SARL PICARFRITES</div>

          <div class="spacer"></div>
          <div class="center">Table : ${selectedTable}</div>
          <div class="spacer"></div>

          <div class="center">Ticket N° ${ticketNumber}</div>
          <div class="center">${formattedDate}</div>

          <div class="separator"></div>
          ${itemLines}
          <div class="separator"></div>
          ${tvaLines}
          <div class="separator"></div>
          <div class="line total"><span>Total HT</span><span>${totalHT}€</span></div>
          <div class="line total"><span>Total TVA</span><span>${totalTVA}€</span></div>
          <div class="line total"><span>Total TTC</span><span>${totalTTC.toFixed(2)}€</span></div>
          <div class="separator"></div>
          <div class="center">Merci pour votre visite !</div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    setIsPrintOpen(false);
  }, []);

  return null;
}
