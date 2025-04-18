"use client";

import { useState } from "react";
import styles from './login.module.css'

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Connexion réussie !");
      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard"; 
    } else {
      setMessage(data.message || "Erreur lors de la connexion");
    }
  };

  return (
    <div className={styles.login}>
      <h1 className={styles.h1}>Connexion</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
         <input className={styles.input}
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className={styles.btn}>Se connecter</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
