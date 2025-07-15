"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./recette.module.css";
import { useUser } from "@/app/Context/UserContext";
import jsPDF from "jspdf";
import "jspdf-autotable";

const MONTH_NAMES = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];

export default function RecettesArchiveModal({ onClose }) {
  const { user } = useUser();
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => {
    if (!user?.userId) return;
    const fetchArchives = async () => {
      try {
        const res = await fetch("/api/reports/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.userId }),
        });
        const data = await res.json();
        setArchives(data.success ? data.reports || [] : []);
        setError(data.success ? null : data.message);
      } catch (err) {
        setError("Erreur serveur : " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArchives();
  }, [user]);

  const totalMonth = (m) => m.days?.reduce((sum, d) => sum + (d.totalRevenue || 0), 0) || 0;
  const totalYear = (y) => y.months?.reduce((sum, m) => sum + totalMonth(m), 0) || 0;

  const calcTvaTotalMonth = (month) => {
    const totals = {};
    month.days?.forEach((day) => {
      const tva = day.tva;
      if (tva) {
        Object.entries(tva).forEach(([k, v]) => {
          const rate = k.replace("tva", "").replace("_", ".");
          totals[rate] = (totals[rate] || 0) + v;
        });
      }
    });
    return totals;
  };

  const calcTvaTotalYear = (year) => {
    const totals = {};
    year.months?.forEach((m) => {
      const monthTva = calcTvaTotalMonth(m);
      Object.entries(monthTva).forEach(([rate, amt]) => {
        totals[rate] = (totals[rate] || 0) + amt;
      });
    });
    return totals;
  };

  function createPdfDoc(item, type) {
  const getPaymentsTotal = (payments) =>
    Object.values(payments || {}).reduce((s, v) => s + (v || 0), 0);

  const calcPaymentsMonth = (m) => {
    const totals = { card: 0, cash: 0, check: 0, ticket: 0 };
    m.days?.forEach((d) => {
      const p = d.payments || {};
      totals.card += p.card || 0;
      totals.cash += p.cash || 0;
      totals.check += p.check || 0;
      totals.ticket += p.ticket || 0;
    });
    return totals;
  };

  const calcPaymentsYear = (y) => {
    const totals = { card: 0, cash: 0, check: 0, ticket: 0 };
    y.months?.forEach((m) => {
      const p = m.payments || calcPaymentsMonth(m);
      Object.entries(p).forEach(([k, v]) => (totals[k] += v || 0));
    });
    return totals;
  };

  const { payments, totalRevenue, tvaTotals } = (() => {
    switch (type) {
      case "jour":
        return {
          payments: item.payments || {},
          totalRevenue: item.totalRevenue || 0,
          tvaTotals: item.tva
            ? Object.fromEntries(
                Object.entries(item.tva).map(([k, v]) => [
                  k.replace("tva", "").replace("_", "."),
                  v,
                ])
              )
            : {},
        };
      case "mois":
        return {
          payments: item.payments || calcPaymentsMonth(item),
          totalRevenue: totalMonth(item),
          tvaTotals: calcTvaTotalMonth(item),
        };
      case "année":
        return {
          payments: item.payments || calcPaymentsYear(item),
          totalRevenue: totalYear(item),
          tvaTotals: calcTvaTotalYear(item),
        };
      default:
        return { payments: {}, totalRevenue: 0, tvaTotals: {} };
    }
  })();

  const totalTVAReelle = tvaTotals
    ? Object.entries(tvaTotals).reduce((acc, [rate, amount]) => {
        const rateNum = Number(rate);
        const realTVA = (amount * rateNum) / (100 + rateNum);
        return acc + realTVA;
      }, 0)
    : 0;

  const doc = new jsPDF();

  const titleDate =
    type === "mois" && item.month
      ? MONTH_NAMES[item.month - 1]
      : item.year || item.day || "";

  // Ajout du contenu (titre, tableaux, etc.) → copie de ta fonction
  doc.setFontSize(16);
  doc.text(`Les Délices de Saleilles ${type} ${titleDate}`, 14, 20);

 function drawKeyValueTable(item, startX, startY) {
  const rowHeight = 8;
  const col1Width = 90;
  const col2Width = 40;
  const valueOffsetRight = 20; // nouveau décalage vers la droite

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");

  let y = startY;

  item.forEach(([key, value]) => {
    doc.text(key, startX + 2, y + 6);
    doc.text(value, startX + col1Width + valueOffsetRight, y + 6, { align: "right" });

    doc.line(startX, y, startX + col1Width + col2Width + valueOffsetRight - 20, y);
    doc.line(startX, y + rowHeight, startX + col1Width + col2Width + valueOffsetRight - 20, y + rowHeight);
    doc.line(startX, y, startX, y + rowHeight);
    doc.line(startX + col1Width, y, startX + col1Width, y + rowHeight);
    doc.line(startX + col1Width + col2Width, y, startX + col1Width + col2Width, y + rowHeight);

    y += rowHeight;
  });

  return y;
}

  const summaryData = [
    ["Chiffre d'affaires", `${totalRevenue.toFixed(2)} €`],
    ["TVA", `${totalTVAReelle.toFixed(2)} €`],
    ["Bénéfices", `${(totalRevenue - totalTVAReelle).toFixed(2)} €`],
  ];

  let currentY = drawKeyValueTable(summaryData, 14, 30) + 10;

  const paymentsData = Object.entries(payments).map(([key, value]) => [
    key === "card"
      ? "Carte bancaire (CB)"
      : key === "cash"
      ? "Espèces"
      : key === "check"
      ? "Chèque"
      : "Tickets",
    `${(value || 0).toFixed(2)} €`,
  ]);
  paymentsData.push(["Total paiements", `${getPaymentsTotal(payments).toFixed(2)} €`]);

  currentY = drawKeyValueTable(paymentsData, 14, currentY) + 10;

  if (tvaTotals && Object.keys(tvaTotals).length > 0) {
    const tvaData = Object.entries(tvaTotals).map(([rate, amount]) => {
      const realTVA = (amount * Number(rate)) / (100 + Number(rate));
      return [`TVA ${rate} %`, `${realTVA.toFixed(2)} €`, `(sur ${amount.toFixed(2)} € TTC)`];
    });

    const rowHeight = 8;
    const colWidths = [50, 50, 70];
    let y = currentY;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    const headers = ["Taux TVA", "Montant TVA réelle", "Base TTC"];
    headers.forEach((h, i) => {
      doc.text(h, 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2, y + 6);
    });

    doc.line(14, y, 14 + colWidths.reduce((a, b) => a + b, 0), y);
    doc.line(14, y + rowHeight, 14 + colWidths.reduce((a, b) => a + b, 0), y + rowHeight);
    let xPos = 14;
    doc.line(xPos, y, xPos, y + rowHeight);
    colWidths.forEach((w) => {
      xPos += w;
      doc.line(xPos, y, xPos, y + rowHeight);
    });

    y += rowHeight;

    doc.setFont("helvetica", "normal");
    tvaData.forEach((row) => {
      let x = 14;
      row.forEach((cell, i) => {
        doc.text(cell, x + 2, y + 6);
        x += colWidths[i];
      });

      doc.line(14, y, 14 + colWidths.reduce((a, b) => a + b, 0), y);
      doc.line(14, y + rowHeight, 14 + colWidths.reduce((a, b) => a + b, 0), y + rowHeight);

      x = 14;
      doc.line(x, y, x, y + rowHeight);
      colWidths.forEach((w) => {
        x += w;
        doc.line(x, y, x, y + rowHeight);
      });

      y += rowHeight;
    });
  }

  return doc;
}

 

function exportToPdf(item, type) {
  const doc = createPdfDoc(item, type);
  const titleDate =
    type === "mois" && item.month
      ? MONTH_NAMES[item.month - 1]
      : item.year || item.day || "";

  doc.save(`rapport_${type}_${titleDate || ""}.pdf`);
}




async function sendToComptable(item, type, user) {
  const doc = createPdfDoc(item, type);

  // pdf en base64 sans le préfixe "data:application/pdf;base64,"
  const pdfBase64 = doc.output("datauristring").split(",")[1];

  const filename =
    `rapport_${type}_` +
    (type === "mois" && item.month
      ? MONTH_NAMES[item.month - 1]
      : item.year || item.day || "") +
    ".pdf";

  // Envoi via fetch à ton API mail
  try {
    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: user.username,
        email: user.email,
        subject: `Rapport ${type}`,
        message: "Voici le rapport PDF généré automatiquement.",
        pdfBase64,
        filename,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Erreur lors de l’envoi du mail");
    }

    alert("Email envoyé avec le PDF en pièce jointe !");
  } catch (err) {
    alert("Erreur : " + err.message);
  }
}


  const DetailModal = ({ item, type, onClose }) => {
    const getPaymentsTotal = (payments) =>
      Object.values(payments || {}).reduce((s, v) => s + (v || 0), 0);

    const calcPaymentsMonth = (m) => {
      const totals = { card: 0, cash: 0, check: 0, ticket: 0 };
      m.days?.forEach((d) => {
        const p = d.payments || {};
        totals.card += p.card || 0;
        totals.cash += p.cash || 0;
        totals.check += p.check || 0;
        totals.ticket += p.ticket || 0;
      });
      return totals;
    };

    const calcPaymentsYear = (y) => {
      const totals = { card: 0, cash: 0, check: 0, ticket: 0 };
      y.months?.forEach((m) => {
        const p = m.payments || calcPaymentsMonth(m);
        Object.entries(p).forEach(([k, v]) => (totals[k] += v || 0));
      });
      return totals;
    };

    const { payments, totalRevenue, tvaTotals } = (() => {
      switch (type) {
        case "jour":
          return {
            payments: item.payments || {},
            totalRevenue: item.totalRevenue || 0,
            tvaTotals: item.tva
              ? Object.fromEntries(
                  Object.entries(item.tva).map(([k, v]) => [
                    k.replace("tva", "").replace("_", "."),
                    v,
                  ])
                )
              : {},
          };
        case "mois":
          return {
            payments: item.payments || calcPaymentsMonth(item),
            totalRevenue: totalMonth(item),
            tvaTotals: calcTvaTotalMonth(item),
          };
        case "année":
          return {
            payments: item.payments || calcPaymentsYear(item),
            totalRevenue: totalYear(item),
            tvaTotals: calcTvaTotalYear(item),
          };
        default:
          return { payments: {}, totalRevenue: 0, tvaTotals: {} };
      }
    })();

    const totalTVAReelle = tvaTotals
      ? Object.entries(tvaTotals).reduce((acc, [rate, amount]) => {
          const rateNum = Number(rate);
          const realTVA = (amount * rateNum) / (100 + rateNum);
          return acc + realTVA;
        }, 0)
      : 0;

    return (
      <div className={styles.detailOverlay} onClick={onClose}>
        <div id="pdf-content" className={styles.detailContent} onClick={(e) => e.stopPropagation()}>
          <button  className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
          <h3 className={styles.h3}>
            Détails {type}{" "}
            {type === "mois" && item.month
              ? MONTH_NAMES[item.month - 1]
              : item.year || item.day || ""}
          </h3>
          <p className={styles.pDetails}>
            <strong className={styles.underline2}>Chiffre d'affaires :</strong>
            <span className={styles.totalRevenue}> {totalRevenue.toFixed(2)} € </span> 
          </p>
           <p className={styles.pDetails}>
            <strong className={styles.underline2}>TVA :</strong>
             <span className={styles.totalTvaReel}> {totalTVAReelle.toFixed(2)} €</span>
          </p>
            <p className={styles.pDetails2}>
            <strong className={styles.underline2}>Bénéfices :</strong> 
            <span className={styles.totalRevenue} >{(totalRevenue - totalTVAReelle).toFixed(2)} € </span>
          </p>

          <div>
            <h4 className={styles.h4}>Répartition des paiements :</h4>
            <ul className={styles.ul}>
              {["card", "cash", "check", "ticket"].map((k) => (
                <li key={k} className={styles.li}>
                  {k === "card"
                    ? "Carte bancaire (CB)"
                    : k === "cash"
                    ? "Espèces"
                    : k === "check"
                    ? "Chèque"
                    : "Tickets"}{" "}
                  : <span className={styles.totalRevenue}>{(payments[k] || 0).toFixed(2)} € </span>
                </li>
              ))}
              <li className={styles.li}>
                <strong> <span className={styles.underline}> Total paiements :</span> <span className={styles.totalRevenue}> {getPaymentsTotal(payments).toFixed(2)} €</span></strong>
              </li>
            </ul>
          </div>
          {tvaTotals && Object.keys(tvaTotals).length > 0 && (
            <div style={{ marginTop: "1em" }}>
              <h4 className={styles.h7}>Totaux TVA :</h4>
              <ul className={styles.ul}>
                {Object.entries(tvaTotals).map(([rate, amount]) => {
                  const realTVA = (amount * Number(rate)) / (100 + Number(rate));
                  return (
                    <li className={styles.li} key={rate}>
                     <strong> TVA {rate} % :</strong>  <span className={styles.totalTvaReel}> {realTVA.toFixed(2)} €</span>  (sur <span className={styles.totalRevenue}>{amount.toFixed(2)} € </span> TTC)
                    </li>
                  );
                })}
              </ul>
            </div>
          )}   
              <div className={styles.btnContainer}>
            <button
            className={styles.pdfButton}
            onClick={() => exportToPdf(item, type)}
          >
            Exporter en PDF
          </button>
          <button
            className={styles.sendButton}
            onClick={() => sendToComptable(item, type, user)}
          >
            Envoyer à la comptable
          </button>
           <button
            className={styles.closeButtonModal}
            onClick={() => onClose()}
          >
            Fermer
          </button>
          </div>
        </div>
          
      </div>
    );
  };

  const closeDetail = () => setDetailItem(null);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <Link className={styles.closeButton} href="/dashboard">
          ✕
        </Link>
        <h2 className={styles.title}>Recettes Archivées</h2>

        {loading && <p>Chargement...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && (
          archives.length === 0 ? (
            <p>Aucune recette archivée disponible.</p>
          ) : (
            <ul className={styles.archiveList}>
              {archives.map((yearItem) => (
                <li key={yearItem._id} className={styles.archiveItem}>
                  <div>
                    <button
                      className={styles.yearButton}
                      onClick={() => {
                        setSelectedYear(selectedYear === yearItem.year ? null : yearItem.year);
                        setSelectedMonth(null);
                      }}
                    >
                      Année {yearItem.year} – Total : {totalYear(yearItem).toFixed(2)} €{" "}
                      {selectedYear === yearItem.year ? "▲" : "▼"}
                    </button>
                    <button
                      className={styles.detailButton}
                      onClick={() => setDetailItem({ item: yearItem, type: "année" })}
                    >
                      Voir le détail
                    </button>
                  </div>

                  {selectedYear === yearItem.year && yearItem.months && (
                    <ul className={styles.monthList}>
                      {yearItem.months.map((monthItem) => (
                        <li key={monthItem._id} className={styles.monthItem}>
                          <div>
                            <button
                              className={styles.monthButton}
                              onClick={() =>
                                setSelectedMonth(
                                  selectedMonth === monthItem.month ? null : monthItem.month
                                )
                              }
                            >
                              {MONTH_NAMES[monthItem.month - 1]} – Total :{" "}
                              {totalMonth(monthItem).toFixed(2)} € {selectedMonth === monthItem.month ? "▲" : "▼"}
                            </button>
                            <button
                              className={styles.detailButton}
                              onClick={() => setDetailItem({ item: monthItem, type: "mois" })}
                            >
                              Voir le détail
                            </button>
                          </div>

                          {selectedMonth === monthItem.month && monthItem.days && (
                            <ul className={styles.dayList}>
                              {monthItem.days.map((dayItem) => (
                                <li key={dayItem._id} className={styles.dayItem}>
                                  <span>{dayItem.day}</span> - Total : {dayItem.totalRevenue.toFixed(2)} €
                                  <button
                                    className={styles.detailButton}
                                    onClick={() => setDetailItem({ item: dayItem, type: "jour" })}
                                  >
                                    Voir le détail
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )
        )}

        {detailItem && (
          <DetailModal
            item={detailItem.item}
            type={detailItem.type}
            onClose={closeDetail}
          />
        )}
      </div>
    </div>
  );
}
