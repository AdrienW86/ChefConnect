"use client";
import React, { useRef } from "react";

export default function ReceiptPrinter({ order, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "", "width=300,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de caisse</title>
          <style>
            body {
              font-family: monospace;
              width: 72mm;
              padding: 10px;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .line { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatCurrency = (value) => `${value.toFixed(2)} €`;

  // Regrouper TVA par taux
  const tvaMap = {};
  order.items.forEach((item) => {
    const rate = item.tvaRate || 0;
    const baseHT = (item.price * item.quantity) / (1 + rate / 100);
    const tvaAmount = (item.price * item.quantity) - baseHT;

    if (!tvaMap[rate]) tvaMap[rate] = { base: 0, tva: 0 };
    tvaMap[rate].base += baseHT;
    tvaMap[rate].tva += tvaAmount;
  });

  return (
    <div>
      <div ref={printRef}>
        <div className="center bold">Les Délices de Saleilles</div>
        <div className="center">26 avenue de Perpignan</div>
        <div className="center">66280 Perpignan</div>
        <div className="center">Tél: 0650729588</div>
        <div className="divider" />
        <div>Table : {order.tableNumber}</div>
        <div className="divider" />
        {order.items.map((item, idx) => (
          <div className="line" key={idx}>
            <span>{item.name} x{item.quantity}</span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="divider" />
        <div className="line bold">
          <span>TOTAL TTC</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        <div className="divider" />
        <div className="bold">Détail TVA :</div>
        {Object.entries(tvaMap).map(([rate, val], idx) => (
          <div className="line" key={idx}>
            <span>{rate}%</span>
            <span>
              HT: {formatCurrency(val.base)} / TVA: {formatCurrency(val.tva)}
            </span>
          </div>
        ))}
        <div className="divider" />
        <div className="center">Merci de votre visite !</div>
        <div className="center">{new Date().toLocaleString()}</div>
      </div>

      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <button onClick={handlePrint}>🖨️ Imprimer</button>
        <button onClick={onClose}>❌ Fermer</button>
      </div>
    </div>
  );
}
