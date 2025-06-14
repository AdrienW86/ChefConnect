"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/app/Context/UserContext";
import styles from './comptability.module.css';

export default function ComptaEmailForm({onClose}) {
  const { user, setUser, loading } = useUser();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log(user)
    if (user?.comptabilityEmail) {
      setEmail(user.comptabilityEmail);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/comptability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          comptabilityEmail: email,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user); 
        setMessage("Email comptable mis à jour !");
      } else {
        setMessage("Erreur : " + (data.message || "inconnue"));
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur de connexion au serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <p>Chargement...</p>;
  }

  return (
    <section className={styles.modal}>
      <div className={styles.modalContent}>
        
        <h2 className={styles.h2}>Email de comptabilité actuel :</h2>
            <h3 className={styles.h3}> {user.comptabilityEmail || "Non renseigné"}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="comptabilityEmail" className={styles.label}>Modifier l'adresse e-mail du comptable</label>
          <input
            id="comptabilityEmail"
            className={styles.comptabilityEmail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {message && (
            <p className={message.startsWith("Erreur") ? styles.error : styles.success}>
              {message}
            </p>
          )}
          <button className={styles.modify} type="submit" disabled={submitting}>
            {submitting ? "Mise à jour..." : "Mettre à jour"}
          </button>        
        </form>
        <button className={styles.closeBtn} onClick={onClose}> Fermer </button>
      </div>
    </section>
  );
}

