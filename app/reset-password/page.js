"use client"

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation du mot de passe (exemple simple)
    if (password.length < 6) {
      setMessage("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setMessage(data.message);

    // Si le mot de passe a été réinitialisé avec succès, redirige vers la page de connexion
    if (res.ok) {
      setTimeout(() => {
        router.push("/");  // Redirige vers la page de connexion après 2 secondes
      }, 2000);
    }
  };

  return (
    <div>
      <h2>Réinitialisation du mot de passe</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Changer le mot de passe</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
