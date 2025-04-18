"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./header.module.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [loading, setLoading] = useState(true);  

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/verify");  
        const data = await res.json();

        if (res.ok) {
          setUser(data.user);  
          console.log("User récupéré :", data.user);
        } else {
          setUser(null);  
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token", error);
        setUser(null);
      } finally {
        setLoading(false);  
      }
    };

    fetchUserData(); 
  }, []);

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!user) {
    return <p>Accès refusé. Vous devez être connecté pour accéder à cette page.</p>;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
          width={50}
          height={50}
          priority
        />
      </div>
      <div className={styles.titleBox}>
        <h1 className={styles.title}>{user.username}</h1>
      </div>
      <div className={styles.boxParams}>      
        <Image
          onClick={toggleMenu}
          className={styles.params}
          src="/params-grey2.svg"
          alt="button params"
          width={50}
          height={50}
          priority
        />   
        <button className={styles.logoutButton} onClick={handleLogout}>
          Déconnexion
        </button>          
        {isMenuOpen && (
          <section className={styles.dropdownMenu}>
            <button onClick={toggleMenu} className={styles.closeModal}> X </button>
            <div className={styles.profil}>
              <h3 className={styles.h3}> Profil </h3>
                <a href="#">Consulter</a>
                <a href="#">Modifier</a>
                <a href="#">Editer la carte</a>
            </div>   
            <div className={styles.profil}>
              <h3 className={styles.h3}> Recettes </h3>
                <a href="#">Journalière</a>
                <a href="#">Mensuelle</a>
                <a href="#">Annuelle</a>
            </div>   
            <div className={styles.comptes}>
              <h3 className={styles.h3}> Comptabilité </h3>
                <a href="#">Envoyer à la comptable</a>
                <a href="#">Modifier l'adresse comptable</a>
            </div>          
          </section>
        )}
      </div>
    </header>      
  );
}