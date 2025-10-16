"use client";
import { useEffect, useState, useRef } from "react";
import Header from '@/app/component/Header/Header';
import { useUser } from "@/app/Context/UserContext";
import jsPDF from "jspdf";
import styles from "./tables.module.css"

const TicketList = () => {
  const { user, loading: userLoading } = useUser();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState({});
  const ticketRefs = useRef({});

  useEffect(() => {
    if (!user?.userId) return;

    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipe?userId=${user.userId}`);
        const data = await res.json();
        if (data.success) setTickets(data.recipes);
        else console.error(data.error);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user?.userId]);

  if (userLoading || loading) return <p>Chargement des tickets...</p>;
  if (!tickets.length) return <section> <Header /><p>Aucun ticket trouvé.</p>; </section>

  const toggleDetail = (ticketNumber) => {
    setShowDetails(prev => ({
      ...prev,
      [ticketNumber]: !prev[ticketNumber]
    }));
  };


  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recipe?userId=${user.userId}`, { method: "DELETE" });
      const data = await res.json();
      alert(data.message);
      if (data.success && onDeleted) onDeleted(); // met à jour la liste dans le parent
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };




  const handleShare = async (ticket) => {

  const items = ticket.items;
  console.log(items)

  if (!items || items.length === 0) {
    alert("Aucun article à partager.");
    return;
  }

  // 📄 PDF en A5 portrait
  const doc = new jsPDF({ orientation: "portrait", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 8;
  let y = 8;
  const usableWidth = pageWidth - 2 * marginX;

  const centerText = (text, y, fontSize = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };

  const checkPageBreak = (spaceNeeded = 6) => {
    if (y + spaceNeeded > pageHeight - 8) {
      doc.addPage();
      y = 8;
    }
  };

  const drawLineSeparator = () => {
    checkPageBreak();
    doc.setLineDashPattern([1, 1], 0);
    doc.line(marginX, y, pageWidth - marginX, y);
    doc.setLineDashPattern([], 0);
    y += 4;
  };

  const drawLineWithPrice = (label, price) => {
    checkPageBreak();
    const priceText = `${price} €`;
    const maxLabelWidth = usableWidth - doc.getTextWidth(priceText) - 4;
    const truncatedLabel = doc.splitTextToSize(label, maxLabelWidth)[0];
    doc.setFontSize(10);
    doc.text(truncatedLabel, marginX, y);
    const priceX = pageWidth - marginX - doc.getTextWidth(priceText);
    doc.text(priceText, priceX, y);
    y += 5;
  };

  // 🧾 En-tête dynamique
  centerText(ticket.restaurant.name, y, 16);
  y += 6;

  centerText(`${ticket.restaurant.address}, ${ticket.restaurant.zip}`, y, 10);
  y += 5;

  centerText(ticket.restaurant.phone, y, 10);
  y += 5;

  centerText(`Ticket n° : ${ticket.ticketNumber}`, y, 10);
  y += 5;

  centerText(`Date : ${new Date(ticket.date).toLocaleString("fr-FR")}`, y, 10);
  y += 6;

  drawLineSeparator();

  // 🧾 Liste des articles
  doc.setFontSize(10);
  items.forEach(item => {
    const label = `${item.name} x${item.quantity}`;
    const price = (item.totalTTC ?? (item.price * item.quantity)).toFixed(2);
    drawLineWithPrice(label, price);
  });

  drawLineSeparator();

  // 💰 Totaux
  drawLineWithPrice("Total HT", Number(ticket.totals.totalHT).toFixed(2));
  drawLineWithPrice("TVA", Number(ticket.totals.totalTVA).toFixed(2));
  drawLineWithPrice("Total TTC", Number(ticket.totals.totalTTC).toFixed(2));

  drawLineSeparator();

  // 👋 Message final
  checkPageBreak();
  centerText("Merci pour votre visite !", y, 14);

  // 📄 Création du PDF et partage
  const blob = doc.output("blob");
  const file = new File([blob], `ticket-${ticket.ticketNumber}.pdf`, {
    type: "application/pdf",
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Ticket de caisse",
        text: `Ticket n° ${ticket.ticketNumber}`,
      });
      return;
    } catch (err) {
      console.error("Erreur de partage :", err);
    }
  }

  const url = URL.createObjectURL(blob);
  window.open(url);
};


  return (
    <>
    <Header />
     <h2 className={styles.h2}>Liste des tickets de caisse</h2>
     <button
        onClick={handleDelete}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md mb-4 block mx-auto"
      >
        Supprimer toutes les recettes
      </button>
    <section className={styles.container}>
     
      {tickets.map((ticket) => (
        <div 
          key={ticket.ticketNumber} 
          style={{
            border: "1px dashed #000",
            width: "300px",
            margin: "20px auto",
            padding: "10px",
            fontFamily: "monospace",
            background: "#fff"
          }}
          className={styles.ticket}
          ref={el => ticketRefs.current[ticket.ticketNumber] = el}
        >
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <strong>PICARFRITES</strong><br />
            26 avenue de Perpignan<br />
            66280 Saleilles<br />
            Tél: 06.50.72.95.88
          </div>
          <p style={{ textAlign: "center", marginBottom: "10px" }}> Table numéro : {ticket.items[0].number}</p>
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <strong>Ticket n° {ticket.ticketNumber}</strong><br />
            {new Date(ticket.date).toLocaleString()}
          </div>

          <button onClick={() => toggleDetail(ticket.ticketNumber)} style={{ marginBottom: "10px", cursor: "pointer" }}>
            {showDetails[ticket.ticketNumber] ? "Cacher le détail" : "Voir le détail"}
          </button>

          <button onClick={() => handleShare(ticket)} style={{ marginLeft: "10px", cursor: "pointer" }}>
  Imprimer le ticket
</button>


          {showDetails[ticket.ticketNumber] && (
            <section>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Produit</th>
                    <th style={{ textAlign: "right" }}>HT</th>
                    <th style={{ textAlign: "right" }}>TVA</th>
                    <th style={{ textAlign: "right" }}>TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {ticket.items.map((item, i) => {
                    const tvaAmount = item.totalTTC - item.totalHT;
                    return (
                      <tr key={item.name + i}>
                        <td>{item.name} x{item.quantity}</td>
                        <td>{Number(item.totalHT).toFixed(2)}</td>
                        <td>{tvaAmount.toFixed(2)}</td>
                        <td>{item.totalTTC.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <hr />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Total HT:</div>
                <div>{ticket.totals.totalHT}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Total TVA:</div>
                <div>{ticket.totals.totalTVA}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <div>Total TTC:</div>
                <div>{ticket.totals.totalTTC}</div>
              </div>

              <hr />
              <div>
                <strong>Méthodes de paiement :</strong>
                {ticket.paymentMethods?.length ? (
                  <ul className={styles.ul}>
                    {ticket.paymentMethods.map((pm, i) => (
                      <li key={pm.method + i}>{pm.method} : {pm.amount.toFixed(2)}€</li>
                    ))}
                  </ul>
                ) :      
                   <p>Aucun paiement</p>
               }
               
              </div>

              <div style={{ textAlign: "center", marginTop: "10px" }}>
                Merci pour votre visite !
              </div>
            </section>
          )}
        </div>
      ))}
    </section>
    </>
  );
};

export default TicketList;