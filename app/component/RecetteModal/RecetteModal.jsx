"use client";

import React, { useEffect, useState } from "react";
import styles from "./recette.module.css";
import { useUser } from "@/app/Context/UserContext";

export default function RecettesModal({ onClose }) {
  const { user } = useUser();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.userId }),
        });

        const data = await res.json();
        if (data.success) {
          setReports(data.reports);
        } else {
          console.error("Erreur API:", data.message || data.error);
        }
      } catch (err) {
        console.error("Erreur serveur:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const renderTotal = (type) => {
    if (!reports) return 0;
    let total = 0;

    for (const year of reports) {
      for (const month of year.months) {
        for (const day of month.days) {
          if (type === "journalière") total += day.totalRevenue;
        }
        if (type === "mensuelle") {
          total += month.days.reduce((acc, d) => acc + d.totalRevenue, 0);
        }
      }
      if (type === "annuelle") {
        for (const month of year.months) {
          total += month.days.reduce((acc, d) => acc + d.totalRevenue, 0);
        }
      }
    }

    return total.toFixed(2);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
        <h2 className={styles.title}>Recettes</h2>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <div className={styles.section}>
              <h3>Recette journalière</h3>
              <p>{renderTotal("journalière")} €</p>
            </div>
            <div className={styles.section}>
              <h3>Recette mensuelle</h3>
              <p>{renderTotal("mensuelle")} €</p>
            </div>
            <div className={styles.section}>
              <h3>Recette annuelle</h3>
              <p>{renderTotal("annuelle")} €</p>
            </div>
          </>
        )}
        <button className={styles.details} onClick={onClose}>
            Voir le détail
        </button>
      </div>
      
    </div>
  );
}

