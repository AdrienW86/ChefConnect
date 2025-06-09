"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/app/Context/UserContext"; 
import styles from "./profil.module.css";

export default function UserSettingsModal({ onClose }) {
  const { user, setUser, loading } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/profil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, name, email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        setMessage("Paramètres mis à jour avec succès !");
        setPassword(""); 
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

  if (loading || !user) return <p>Chargement...</p>;

  return (
    <section className={styles.modal}>
      <div className={styles.modalContent}>
        <h2 className={styles.h2}>Modifier mes paramètres</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="name">Nom :</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="email">Email :</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Nouveau mot de passe :</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Laissez vide pour ne pas changer"
          />

          {message && (
            <p className={message.startsWith("Erreur") ? styles.error : styles.success}>
              {message}
            </p>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? "Mise à jour..." : "Mettre à jour"}
          </button>
        </form>
        <button onClick={onClose} className={styles.closeBtn}>
          Fermer
        </button>
      </div>
    </section>
  );
}
