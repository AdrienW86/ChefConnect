"use client";

import React, { useState } from "react";
import ParamsCard from "../ParamsCard/ParamsCard";
import { useUser } from "@/app/Context/UserContext";
import RecettesModal from "../RecetteModal/RecetteModal";
import RecetteArchive from "../RecetteArchive/RecetteArchive";
import ComptaEmailForm from "../Comptability/Comptability";
import Profil from '../Profil/Profil'
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
                 <button className={styles.paramsButton} onClick={() => toggleLink(true)}> Editer la carte
                  </button>
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
                <button className={styles.paramsButton} onClick={() => setIsArchiveRecetteOpen(true)}>
                  Recettes archivées
                </button>
                {isArchiveRecetteOpen && <RecetteArchive onClose={() => setIsArchiveRecetteOpen(false)} />}
                </div>
            </div>   
            <div className={styles.profil2}>
              <h3 className={styles.h3}> Comptabilité </h3>
                <div className={styles.boxBtn}>
                 <button className={styles.paramsButton} onClick={toggleLink}> Envoyer à la comptable
                  </button>
                  <button className={styles.paramsButton} onClick={() =>setIsComptabilityOpen(true)}> 
                    Paramètres comptable
                  </button>
                   {isComptabilityOpen && <ComptaEmailForm onClose={() => setIsComptabilityOpen(false)} />}
                </div>
            </div>          
          </section>
        )}
      </div>
      {isLinkOpen && <ParamsCard onClose={toggleLink} />}

    </header>      
  );
}
