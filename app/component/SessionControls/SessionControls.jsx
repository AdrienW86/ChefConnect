import styles from "./sessionControls.module.css";

export default function SessionControls({ user, setTables, setOrders, sessionStartDate, setSessionStartDate }) {
  const startSession = async () => {
    try {
      const response = await fetch("/api/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId })
      });
      if (response.ok) {
        setSessionStartDate(new Date());
        console.log("Session démarrée !");
      }
    } catch (error) {
      console.error("Erreur :", error);
    }
  };

  const saveSession = async () => {
    try {
      await fetch("/api/update-session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId })
      });
      console.log("Session sauvegardée !");
    } catch (error) {
      console.error("Erreur :", error);
    }
  };

  return (
    <div className={styles.sessionControls}>
      <button onClick={startSession}>Démarrer session</button>
      <button onClick={saveSession}>Sauvegarder session</button>
      {sessionStartDate && <p>Début du service : {sessionStartDate.toLocaleString()}</p>}
    </div>
  );
}
