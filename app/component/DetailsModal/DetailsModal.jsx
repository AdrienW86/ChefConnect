"use client";

import React from "react";
import styles from "./recette.module.css";

export default function DetailModal({ item, type, onClose, exportToPdf, sendToComptable, user }) {
  const MONTH_NAMES = [
    "Janvier","Février","Mars","Avril","Mai","Juin",
    "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
  ];


  const getTitle = () => {
    if (type === "mois") {
      return `${MONTH_NAMES[item.month - 1]} ${item.year}`;
    } else if (type === "jour") {
      return item.day;
    } else {
      return item.year;
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} id="pdf-content">
        <h2>Détails {type} : {getTitle()}</h2>

        <p><strong>Chiffre d'affaires :</strong> {item.totalRevenue?.toFixed(2)} €</p>
        <p><strong>TVA :</strong> {
          Object.entries(item.tva || {}).map(([rate, amount]) => {
            const realTVA = (amount * Number(rate)) / (100 + Number(rate));
            return (
              <span key={rate}>
                <br />• TVA {rate}% : {realTVA.toFixed(2)} € (sur {amount.toFixed(2)} € TTC)
              </span>
            );
          })
        }</p>

        <p><strong>Paiements :</strong></p>
        <ul>
          {Object.entries(item.payments || {}).map(([method, amount]) => (
            <li key={method}>
              {method === "card" ? "CB" : method === "cash" ? "Espèces" : method === "check" ? "Chèque" : "Tickets"} : {amount.toFixed(2)} €
            </li>
          ))}
        </ul>

        <div className={styles.modalActions}>
          <button onClick={() => exportToPdf(item, type)}>Télécharger PDF</button>
          <button onClick={() => sendToComptable(item, type, user)}>Envoyer à la comptable</button>
          <button onClick={onClose} className="no-print">Fermer</button>
        </div>
      </div>
    </div>
  );
}
