"use client";

import React, { useState } from "react";
import ParamsCard from "../ParamsCard/ParamsCard";
import { useUser } from "@/app/Context/UserContext";
import RecettesModal from "../RecetteModal/RecetteModal";
import ComptabilityDocument from "../ComptabilityDocument/ComptabilityDocument";
import RecetteArchive from "../RecetteArchive/RecetteArchive";
import ComptaEmailForm from "../Comptability/Comptability";
import Profil from '../Profil/Profil'
import Link from "next/link";
import Image from "next/image";
import styles from "./header.module.css";

export default function Dashboard() {
  const { user, loading } = useUser(); 
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [isLinkOpen, setIsLinkOpen] = useState(false); 
  const [isProfil, setIsProfil] = useState(false);
  const [isRecetteOpen, setIsRecetteOpen] = useState(false);
  const [isArchiveRecetteOpen, setIsArchiveRecetteOpen] = useState(false);
  const [isComptabilityOpen, setIsComptabilityOpen] = useState(false)
    const [isComptabilityDocumentOpen, setIsComptabilityDocumentOpen] = useState(false)

   const [file, setFile] = useState(null);

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
            name: user.name,
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


  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

    const toggleProfil = () => {
    setIsProfil(!isProfil);
  };

    const toggleLink = () => {
    setIsLinkOpen(!isLinkOpen);
  };

    const toggleComptability = () => {
    setIsComptabilityOpen(!isComptabilityOpen);
  };

   const toggleComptabilityDocument = () => {
    setIsComptabilityDocumentOpen(!isComptabilityOpen);
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Êtes-vous sûr de vouloir vous déconnecter ? Votre session en cours sera perdue.");
    
    if (confirmLogout) {
      try {
        await fetch("/api/auth/logout", { method: "POST" }); 
        window.location.href = "/"; 
      } catch (error) {
        console.error("Erreur lors de la déconnexion", error);
      }
    }
  };
  
  return (
    <header className={styles.header}>
      <div className={styles.boxLogo}>
        <Image
          className={styles.logo}
          src="/logo.png"
          alt="logo"
          width={85}
          height={85}
          priority
        />
      </div>
      <div className={styles.titleBox}>
        <h1 className={styles.title}>{user.username}</h1>
      </div>
      <div className={styles.boxParams}>           
        <button className={styles.paramsButton} onClick={toggleMenu}>
         Paramètres
        </button>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Déconnexion
        </button>          
        {isMenuOpen && (
          <section className={styles.dropdownMenu}>
            <button onClick={toggleMenu} className={styles.closeModal}> X </button>
            <div className={styles.profil}>
              <h3 className={styles.h3}> Profil </h3>
               <div className={styles.boxBtn}>
                 <Link className={styles.paramsButton} href ='menu'> Editer la carte
                  </Link>
                  <button className={styles.paramsButton} onClick={() => setIsProfil(true)}> 
                    Modifier profil
                  </button>
                   {isProfil && <Profil onClose={() => setIsProfil(false)} />}
                </div>
            </div>   
            <div className={styles.profil}>
              <h3 className={styles.h3}> Recettes </h3>
                <div className={styles.boxBtn}>
                  <button className={styles.paramsButton} onClick={() => setIsRecetteOpen(true)}>
                  Recettes courantes
                </button>
                {isRecetteOpen && <RecettesModal onClose={() => setIsRecetteOpen(false)} />}
                <Link className={styles.paramsButton} href ="/recettes">
                  Recettes archivées
                </Link>
                {isArchiveRecetteOpen && <RecetteArchive onClose={() => setIsArchiveRecetteOpen(false)} />}
                </div>
            </div>   
            <div className={styles.profil2}>
              <h3 className={styles.h3}> Comptabilité </h3>
                <div className={styles.boxBtn}>
                 <button className={styles.paramsButton} onClick={() =>setIsComptabilityDocumentOpen(true)}> 
                  Envoyer à la comptable
                  </button>
                   {isComptabilityDocumentOpen && <ComptabilityDocument user={user} onClose={() => setIsComptabilityDocumentOpen(false)} />}
                  <button className={styles.paramsButton} onClick={() =>setIsComptabilityOpen(true)}> 
                    Paramètres comptable
                  </button>
                   {isComptabilityOpen && <ComptaEmailForm onClose={() => setIsComptabilityOpen(false)} />}
                </div>
            </div>          
          </section>
        )}
      </div>
    </header>      
  );
}
