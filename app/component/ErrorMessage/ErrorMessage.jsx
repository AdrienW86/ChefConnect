import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './errorMessage.module.css'

export default function ErrorMessage() {
  return (
    <>
    <header className={styles.header}>
      <div className={styles.boxLogo}>
        <Image
          className={styles.logo}
          src="/logo.png"
          alt="logo"
          width={250}
          height={250}
          priority
        />
      </div>      
    </header>   
    <div className={styles.content}>
    <h1 className={styles.title}>Accès refusé. Vous devez être connecté pour accéder à cette page. </h1>
    <p className={styles.message}> Cliquez sur le lien ci-dessous pour revenir à l'accueil </p>
    <p className={styles.message}>↓</p>
    <Link className={styles.home} href ="/"> Accueil </Link>
   
    </div>
    <footer className={styles.footer}>
  <Link className={styles.link} href="https://www.code-v.fr" target="_blank" rel="noopener noreferrer">
    Propulsé par <span className={styles.span}>Codev</span>
  </Link>
  <p className={styles.p}>&copy; {new Date().getFullYear()} Tous droits réservés.</p>
</footer>
    </>
  )
}
