import Image from "next/image";
import Link from "next/link";
import Login from "./component/Login/Login";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/logo.png"
          alt="logo"
          width={150}
          height={150}
          priority
        />       
      </main>
      <section className={styles.content}> 
        <Login />       
      </section>   
      <footer className={styles.footer}>
        <Link className={styles.link} href="https://www.code-v.fr" target="_blank" rel="noopener noreferrer">
          Propulsé par <span className={styles.span}>Codev</span>
        </Link>
        <p className={styles.p}>&copy; {new Date().getFullYear()} Tous droits réservés.</p>
      </footer>
    </div>
  );
}