"use client"

import React from 'react'
import { useEffect, useState } from "react";
import Tables from '../Tables/Tables';
import styles from './aside.module.css'

export default function Aside({user}) {

    const [session, setSession] = useState();
    const [tables, setTables] = useState([]);
    const [tableNumber, setTableNumber] = useState(""); 
    useEffect(() => {
        console.log("User reçu :", user);
             
        if (user?.userId) {
          startSession(user.userId);
        }
      }, [user?.userId]); 

    const addTableToSession = async (tableNumber) => {
        if (!user || !user.userId) {
          console.error("Utilisateur non identifié");
          return;
        }
      
        const table = {
          number : tableNumber,
          item :[]
        }
      
        setSession(table) 
      
        try {
          const response = await fetch("/api/update-session", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId: user.userId,  })
          });
      
          if (!response.ok) {
            throw new Error("Erreur lors de la mise à jour de la session");
          }
      
          console.log("Table ajoutée avec succès !");
        } catch (error) {
          console.error("Erreur lors de l'ajout de la table:", error);
        }
      };
    
    const startSession = async (userId) => {
        try {
          const response = await fetch("/api/start-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId, session: session })
          });
      
          if (!response.ok) {
            throw new Error("Erreur lors de l'ajout de la session");
          }
          setSession(session); 
          console.log("Session ajoutée avec succès");
        } catch (error) {
          console.error("Erreur :", error);
        }
      };

      const updateUserSession = async () => {
        if (!user || !user.userId) {
          console.log("Utilisateur non défini :", user);  
          console.error("Utilisateur non identifié");
          return;
        }
      
        try {
          console.log("Données envoyées dans la requête:", {
            userId: user.userId, 
            session: session
          });  
          
          const response = await fetch("/api/update-session", {
            method: "PATCH",  
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId: user.userId, session: session }) 
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
        console.log(updatedTables)
        addTableToSession(num);   
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
          setTables(tables.filter(table => table !== num)); // Supprime la table si confirmé
        }
      };

  return (
    <div className={styles.aside}>
        <button 
            className={styles.startBtn} 
            onClick={()=>startSession(user.userId)}
        > 
            Démarrer service
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
            className= {styles.stopBtn} 
            onClick={()=>updateUserSession(user.userId)}
        > 
            Fermer session
        </button>
       <Tables tables = {tables}/>       
    </div>
  )
}