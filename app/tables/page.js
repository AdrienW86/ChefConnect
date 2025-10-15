"use client";
import { useEffect, useState, useRef } from "react";
import Header from '@/app/component/Header/Header';
import { useUser } from "@/app/Context/UserContext";
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
  if (!tickets.length) return <p>Aucun ticket trouvé.</p>;

  const toggleDetail = (ticketNumber) => {
    setShowDetails(prev => ({
      ...prev,
      [ticketNumber]: !prev[ticketNumber]
    }));
  };

  const printTicket = (ticketNumber) => {
    const ticketElement = ticketRefs.current[ticketNumber];
    if (!ticketElement) return;

    const printWindow = window.open("", "PRINT", "height=600,width=400");
    printWindow.document.write("<html><head><title>Ticket</title>");
    printWindow.document.write("<style>body{font-family:monospace;} table{width:100%;border-collapse:collapse;} th,td{text-align:right;} th{text-align:left;}</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write(ticketElement.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <>
    <Header />
     <h2 className={styles.h2}>Liste des tickets de caisse</h2>
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

          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <strong>Ticket n° {ticket.ticketNumber}</strong><br />
            {new Date(ticket.date).toLocaleString()}
          </div>

          <button onClick={() => toggleDetail(ticket.ticketNumber)} style={{ marginBottom: "10px", cursor: "pointer" }}>
            {showDetails[ticket.ticketNumber] ? "Cacher le détail" : "Voir le détail"}
          </button>

          <button onClick={() => printTicket(ticket.ticketNumber)} style={{ marginLeft: "10px", cursor: "pointer" }}>
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
                ) : <p>Aucun paiement</p>}
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