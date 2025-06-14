import { useState } from "react";
import styles from './comptability.module.css'

export default function ComptabilityDocument({ user, onClose }) {
  const [file, setFile] = useState(null);
console.log(user)
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const sendFile = async () => {
    if (!file) {
      alert("Merci de sélectionner un fichier.");
      return;
    }

    // Lire le fichier en base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1]; // On enlève data:xxx;base64,

      try {
        const res = await fetch("/api/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: user.username,
            email: user.email,
            subject: `Fichier envoyé : ${file.name}`,
            message: "Voici un fichier envoyé par l'utilisateur.",
            pdfBase64: base64,
            filename: file.name,
          }),
        });

        const result = await res.json();
        if (res.ok) {
          alert("Fichier envoyé avec succès !");
        } else {
          alert("Erreur : " + result.message);
        }
      } catch (err) {
        alert("Erreur serveur : " + err.message);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.modal}>
       <button onClick={onClose} className={styles.closeBtn}> X </button>
      <div className={styles.modalContent}>
       
      <input type="file" onChange={handleFileChange} className={styles.input}/>
      <button className={styles.sendBtn} onClick={sendFile}>Envoyer le fichier à la comptable</button>
      </div>
    </div>
  );
}




