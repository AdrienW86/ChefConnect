"use client";

import React, { useEffect, useState } from "react";
import styles from "./recette.module.css";
import { useUser } from "@/app/Context/UserContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

 const exportToPdf = async (item, type, textContent) => {
   const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  const maxLineWidth = pageWidth - margin * 2;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);

  const lines = pdf.splitTextToSize(textContent, maxLineWidth);
  let y = margin;

  lines.forEach((line) => {
    if (y > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 7; // hauteur ligne
  });

  pdf.save(`rapport-${type}-${item.year || item.month || item.day}.pdf`);
};



  const sendToComptable = async (item, type, user, textContent) => {
 const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  const maxLineWidth = pageWidth - margin * 2;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);

  const lines = pdf.splitTextToSize(textContent, maxLineWidth);
  let y = margin;

  lines.forEach((line) => {
    if (y > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 7;
  });

  const pdfBase64Full = pdf.output("datauristring");
  const pdfBase64 = pdfBase64Full.split(",")[1];

  try {
    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: user.username,
        email: user.email,
        subject: `Rapport ${type} - ${item.year || item.month || item.day}`,
        message: "Voici le rapport PDF généré automatiquement.",
        pdfBase64,
        filename: `rapport-${type}-${item.year || item.month || item.day}.pdf`,
      }),
    });

    const result = await res.json();
    if (res.ok) {
      alert("Le rapport a été envoyé à la comptable.");
    } else {
      alert("Erreur : " + (result.message || "Échec de l'envoi."));
    }
  } catch (err) {
    alert("Erreur serveur : " + err.message);
  }
};

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
        </div>
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
          </div>
      </div>
    );
  };

  const closeDetail = () => setDetailItem(null);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
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
