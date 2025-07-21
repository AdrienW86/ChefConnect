"use client"

import React, { useEffect, useState } from "react";

import { useSession } from "@/app/Context/SessionContext"; // Chemin à adapter
import { useSocket } from "@/app/Context/SocketContext";
import Tables from '../Tables/Tables';
import styles from './aside.module.css';

export default function Main({ user }) {
  const { session, setSession, closeSession } = useSession();
  const socket = useSocket();

  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableNumber, setTableNumber] = useState("");

  useEffect(() => {
    console.log("Type de session:", typeof session);
    console.log("Valeur de session:", session);

    if (!user?.userId) return;

    fetch(`/api/orders?userId=${user.userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.tables) {
          setTables(data.tables);
          setSession(prev => ({ ...prev, tables: data.tables }));
        }
      })
      .catch(err => {
        console.error("Erreur fetch tables :", err);
      });
  }, [user]);

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

    // Émettre l'événement au serveur pour informer les autres clients
    if (socket) {
      socket.emit('ouvrirTable', num);
    }

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
    }
  };

  return (
    <>
      <div className={styles.aside}>      
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
      </div>
      <Tables 
        tables={tables} 
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
      />
    </>
  );
}
