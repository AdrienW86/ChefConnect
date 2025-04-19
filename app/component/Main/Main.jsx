"use client"

import React, { useEffect, useState } from "react";
import Tables from '../Tables/Tables';
import styles from './aside.module.css'

export default function Main({ user }) {
  const [session, setSession] = useState(null);
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");

  useEffect(() => {
    if (user?.userId) {
      startSession(user.userId);
    }
  }, [user?.userId]);

  const startSession = async (userId) => {
    try {
      const response = await fetch("/api/start-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, session: session }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la session");
      }

      console.log("Session démarrée avec succès");
      setSession({ userId, tables: [] });
    } catch (error) {
      console.error("Erreur :", error);
    }
  };

  const updateUserSession = async () => {
    if (!user || !user.userId || !session) {
      console.error("Utilisateur ou session non définis");
      return;
    }

    try {
      const response = await fetch("/api/update-session", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.userId, session }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la session");
      }

      console.log("Session mise à jour avec succès !");
    } catch (error) {
      console.error("Erreur :", error);
    }
  };

  const openTable = () => {
    const num = parseInt(tableNumber, 10);
    if (isNaN(num) || num < 1 || num > 50) {
      alert("Veuillez entrer un numéro de table valide entre 1 et 50.");
      return;
    }

    if (tables.includes(num)) {
      alert("Ce numéro de table est déjà pris.");
      return;
    }

    const updatedTables = [...tables, num];
    setTables(updatedTables);

    // Mise à jour de la session avec les tables ouvertes
    setSession(prevSession => ({
      ...prevSession,
      tables: updatedTables
    }));

    console.log(updatedTables);
  };

  const cancelTable = () => {
    const tableToCancel = prompt("Entrez le numéro de la table à annuler (entre 1 et 50) :");
    const num = parseInt(tableToCancel, 10);

    if (isNaN(num) || num < 1 || num > 50) {
      alert("Veuillez entrer un numéro de table valide.");
      return;
    }

    if (!tables.includes(num)) {
      alert("Cette table n'existe pas.");
      return;
    }

    const isConfirmed = window.confirm(`Êtes-vous sûr de vouloir annuler la table ${num} ?`);

    if (isConfirmed) {
      const updatedTables = tables.filter(table => table !== num);
      setTables(updatedTables);

      // Mise à jour de la session après annulation
      setSession(prevSession => ({
        ...prevSession,
        tables: updatedTables
      }));
    }
  };

  return (
    <>
      <div className={styles.aside}>
        <button
          className={styles.startBtn}
          onClick={() => startSession(user.userId)}
        >
          Démarrer session
        </button>
        <input
          type="number"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder="Numéro de table"
          className={styles.inputTable}
        />
        <button
          className={styles.mainBtn}
          onClick={openTable}
        >
          Ouvrir table
        </button>
        <button
          className={styles.mainBtn}
          onClick={cancelTable}
        >
          Annuler table
        </button>
        <button
          className={styles.mainBtn}
          onClick={updateUserSession}
        >
          Sauvegarder Session
        </button>
        <button
          className={styles.mainBtn}
        >
          Clôturer table
        </button>
        <button
          className={styles.stopBtn}
          onClick={() => updateUserSession(user.userId)}
        >
          Fermer session
        </button>
      </div>
      <Tables tables={tables} />
    </>
  );
}
