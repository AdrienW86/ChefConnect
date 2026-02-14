export default function Maintenance() {
  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      textAlign: "center",
      backgroundColor: "#f8f8f8",
      fontFamily: "Arial, sans-serif",
      color: "#333",
      padding: "20px"
    }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>Site en maintenance</h1>
      <p style={{ fontSize: "1.25rem" }}>
        Nous revenons très bientôt.<br />
        Merci de votre patience.
      </p>
    </main>
  );
}
