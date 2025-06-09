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
        console.log(data)
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
  if (!reports) return "0.00";

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // Mois en base 1 (01 à 12)
  const currentDay = today.getDate();

  let total = 0;

  for (const year of reports) {
    const yearNumber = parseInt(year.year);

    if (type === "annuelle" && yearNumber !== currentYear) continue;

    for (const month of year.months) {
      const monthNumber = parseInt(month.month);

      if (type === "annuelle") {
        for (const day of month.days) {
          total += day.totalRevenue || 0;
        }
      }

      if (type === "mensuelle" && yearNumber === currentYear && monthNumber === currentMonth) {
        for (const day of month.days) {
          total += day.totalRevenue || 0;
        }
      }

      if (type === "journalière" && yearNumber === currentYear && monthNumber === currentMonth) {
        for (const day of month.days) {
          if (parseInt(day.day) === currentDay) {
            total += day.totalRevenue || 0;
          }
        }
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
              <h3 className={styles.h3}>Journalière</h3>
              <p className={styles.green}>{renderTotal("journalière")} €</p>
            </div>
            <div className={styles.section}>
              <h3 className={styles.h3} >Mensuelle</h3>
              <p className={styles.green}>{renderTotal("mensuelle")} €</p>
            </div>
            <div className={styles.section}>
              <h3 className={styles.h3}>Annuelle</h3>
              <p className={styles.green}>{renderTotal("annuelle")} €</p>
            </div>
          </>
        )}
        <button className={styles.details} onClick={onClose}>
            Fermer
        </button>
      </div>
      
    </div>
  );
}