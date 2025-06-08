"use client";

import React, { useEffect, useState } from "react";
import styles from "./recette.module.css";
import { useUser } from "@/app/Context/UserContext";

const MONTH_NAMES = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

export default function RecettesArchiveModal({ onClose }) {
  const { user } = useUser();
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [detailItem, setDetailItem] = useState(null); // <-- état pour la modale détail

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

  // Fermer la modale détail
  const closeDetail = () => setDetailItem(null);

  // Petite modale détail simple
  const DetailModal = ({ item, type, onClose }) => (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        <h3>Détails {type}</h3>
        <pre style={{whiteSpace: "pre-wrap"}}>
          {JSON.stringify(item, null, 2)}
        </pre>
      </div>
    </div>
  );

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
                        onClick={() => setDetailItem({item: yearItem, type: "année"})}
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
                                onClick={() => setDetailItem({item: monthItem, type: "mois"})}
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
                                        onClick={() => setDetailItem({item: dayItem, type: "jour"})}
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

