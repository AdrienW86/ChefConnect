"use client";

import React, { useEffect, useState } from "react";
import styles from "./recette.module.css";
import { useUser } from "@/app/Context/UserContext";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
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
    console.log("Données reçues:", data.reports);

    if (data.success) {
      setArchives(data.reports || []);
    } else {
      setError(data.message || "Erreur inconnue");
    }
  } catch (err) {
    setError("Erreur serveur : " + err.message);
  } finally {
    setLoading(false);
  }
};
    fetchArchives();
  }, [user]);

  const toggleYear = (year) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setSelectedMonth(null);
    } else {
      setSelectedYear(year);
      setSelectedMonth(null);
    }
  };

  const toggleMonth = (month) => {
    if (selectedMonth === month) {
      setSelectedMonth(null);
    } else {
      setSelectedMonth(month);
    }
  };

  const totalMonth = (monthItem) => {
    if (!monthItem.days) return 0;
    return monthItem.days.reduce(
      (sum, day) => sum + (day.totalRevenue ?? 0),
      0
    );
  };

  const totalYear = (yearItem) => {
    if (!yearItem.months) return 0;
    return yearItem.months.reduce(
      (sum, month) => sum + totalMonth(month),
      0
    );
  };

  const closeDetail = () => setDetailItem(null);

 const DetailModal = ({ item, type, onClose }) => {
  // Calcule la somme des paiements pour un objet payments simple
  const getPaymentsTotal = (payments) => {
    if (!payments) return 0;
    return Object.values(payments).reduce((sum, val) => sum + (val ?? 0), 0);
  };

  // Calcule la somme des paiements à partir des jours d'un mois
  const calcPaymentsTotalMonth = (month) => {
    if (!month.days) return {};
    const totals = { card: 0, cash: 0, check: 0, ticket: 0 };
    month.days.forEach((day) => {
      if (day.payments) {
        totals.card += day.payments.card ?? 0;
        totals.cash += day.payments.cash ?? 0;
        totals.check += day.payments.check ?? 0;
        totals.ticket += day.payments.ticket ?? 0;
      }
    });
    return totals;
  };

  // Calcule la somme des paiements à partir des mois d'une année
  const calcPaymentsTotalYear = (year) => {
    if (!year.months) return {};
    const totals = { card: 0, cash: 0, check: 0, ticket: 0 };
    year.months.forEach((month) => {
      const monthPayments = month.payments ?? calcPaymentsTotalMonth(month);
      totals.card += monthPayments.card ?? 0;
      totals.cash += monthPayments.cash ?? 0;
      totals.check += monthPayments.check ?? 0;
      totals.ticket += monthPayments.ticket ?? 0;
    });
    return totals;
  };

  // Fonction pour récupérer et normaliser les données selon le type
  const getDetailData = (item, type) => {
    switch (type) {
      case "jour":
        return {
          totalRevenue: item.totalRevenue ?? 0,
          payments: item.payments ?? {},
          tvaTotals: item.tvaTotals ?? {},
        };
      case "mois":
        return {
          totalRevenue: item.totalRevenue ?? 0,
          payments: item.payments ?? calcPaymentsTotalMonth(item),
          tvaTotals: item.tvaTotals ?? {},
        };
      case "année":
        return {
          totalRevenue: item.totalRevenue ?? 0,
          payments: item.payments ?? calcPaymentsTotalYear(item),
          tvaTotals: item.tvaTotals ?? {},
        };
      default:
        return {
          totalRevenue: 0,
          payments: {},
          tvaTotals: {},
        };
    }
  };

  const { totalRevenue, payments, tvaTotals } = getDetailData(item, type);

  // Affiche les totaux TVA s’ils existent
  const renderTvaTotals = (tvaTotals) => {
    if (!tvaTotals || Object.keys(tvaTotals).length === 0) return null;
    return (
      <div style={{ marginTop: "1em" }}>
        <h4>Totaux TVA :</h4>
        <ul>
          {Object.entries(tvaTotals).map(([rate, amount]) => (
            <li key={rate}>
              TVA {rate} % : {amount.toFixed(2)} €
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        <h3 className={styles.h3}> Détails {type}{" "}
  {type === "mois" && item.month
    ? MONTH_NAMES[item.month - 1]
    : item.year || item.day || ""}</h3>

        <p><strong>Total revenu :</strong> {totalRevenue.toFixed(2)} €</p>

        <div>
          <h4 className={styles.h4}>Répartition des paiements :</h4>
          <ul className={styles.ul}>
            <li className={styles.li}>Carte bancaire (CB) : {(payments.card ?? 0).toFixed(2)} €</li>
            <li className={styles.li}>Espèces : {(payments.cash ?? 0).toFixed(2)} €</li>
            <li className={styles.li}>Chèque : {(payments.check ?? 0).toFixed(2)} €</li>
            <li className={styles.li}>Tickets : {(payments.ticket ?? 0).toFixed(2)} €</li>
            <li className={styles.li}><strong>Total paiements : {getPaymentsTotal(payments).toFixed(2)} €</strong></li>
          </ul>
        </div>

        {renderTvaTotals(tvaTotals)}
      </div>
    </div>
  );
};


  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        <h2 className={styles.title}>Recettes Archivées</h2>

        {loading && <p>Chargement...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && (
          <>
            {archives.length === 0 ? (
              <p>Aucune recette archivée disponible.</p>
            ) : (
              <ul className={styles.archiveList}>
                {archives.map((yearItem) => (
                  <li key={yearItem._id} className={styles.archiveItem}>
                    <div>
                      <button
                        className={styles.yearButton}
                        onClick={() => toggleYear(yearItem.year)}
                      >
                        Année {yearItem.year} - Total :{" "}
                        {totalYear(yearItem).toFixed(2)} €{" "}
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
                                onClick={() => toggleMonth(monthItem.month)}
                              >
                                Mois {MONTH_NAMES[parseInt(monthItem.month, 10) - 1]} - Total :{" "}
                                {totalMonth(monthItem).toFixed(2)} €{" "}
                                {selectedMonth === monthItem.month ? "▲" : "▼"}
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
                                    <div>
                                      <strong>Jour {dayItem.day} :</strong>{" "}
                                      {(dayItem.totalRevenue ?? 0).toFixed(2)} €<br />
                                      <small>
                                        Paiements:{" "}
                                        {`CB: ${dayItem.payments.card ?? 0} € - Espèces: ${dayItem.payments.cash ?? 0} € - Chèque: ${dayItem.payments.check ?? 0} € - Tickets: ${dayItem.payments.ticket ?? 0} €`}
                                      </small>
                                      <button
                                        className={styles.detailButton}
                                        onClick={() => setDetailItem({ item: dayItem, type: "jour" })}
                                      >
                                        Voir le détail
                                      </button>
                                    </div>
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
            )}
          </>
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