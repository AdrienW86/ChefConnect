// app/not-found.js
import Link from 'next/link';
import Image from 'next/image';
import styles from './component/ErrorMessage/errorMessage.module.css'

export default function NotFound() {
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
   <div className={styles.notFoundContent}>
   <h1 className={styles.notFound}>404 - Page non trouvée</h1>
      <p className={styles.notFoundP}>Oups ! La page que vous recherchez n'existe pas.</p>
      <Link className={styles.notFoundLink} href="/">
        Retour à l'accueil
      </Link>
   </div>
   
   
   
    <footer className={styles.footer}>
  <Link className={styles.link} href="https://www.code-v.fr" target="_blank" rel="noopener noreferrer">
    Propulsé par <span className={styles.span}>Codev</span>
  </Link>
  <p className={styles.p}>&copy; {new Date().getFullYear()} Tous droits réservés.</p>
</footer>
    </>
     
  );
}
