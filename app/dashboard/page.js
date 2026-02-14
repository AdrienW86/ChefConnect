"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/Context/UserContext"; // Importer le contexte
import ErrorMessage from "../component/ErrorMessage/ErrorMessage";
import Header from '../component/Header/Header'
import Main from "../component/Main/Main";
import styles from "./dashboard.module.css";


import Dashboard from "../component/Header/Header";



export default function Dashboard() {
 const { user, loading } = useUser(); 
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [profit, setProfit] = useState(0);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedItemsToPay, setSelectedItemsToPay] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [sessionStartDate, setSessionStartDate] = useState(null); // Ajout de l'état pour la date de début de session
  const [session, setSession] = useState();


const calculateSessionTotal = () => {
  return sessionTest.table.reduce((total, table) => {
    const tableTotal = table.item.reduce((sum, item) => {
      return sum + (item.price * item.quantity); // Multiplie le prix par la quantité
    }, 0);
    return total + tableTotal;
  }, 0);
};

const updateUserSession = async () => {
  if (!user || !user.userId) {
    console.log("Utilisateur non défini :", user);  // Pour vérifier l'objet `user`
    console.error("Utilisateur non identifié");
    return;
  }

  try {
    console.log("Données envoyées dans la requête:", {
      userId: user.userId, 
      session: session
    });  // Vérification des données envoyées
    
    const response = await fetch("/api/update-session", {
      method: "PATCH",  // Vérifie que la méthode est bien PATCH
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId: user.userId, session: session })  // Envoi des données
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la mise à jour de la session");
    }

    console.log("Session mise à jour avec succès !");
  } catch (error) {
    console.error("Erreur :", error);
  }
};
  
  const openPaymentModal = () => {
    setSelectedItemsToPay([]); // Réinitialiser la sélection
    setIsPaymentModalOpen(true);
  };
  
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };
  
  const toggleSelectItemToPay = (item) => {
    setSelectedItemsToPay((prevSelected) => {
      if (prevSelected.find((i) => i.id === item.id)) {
        return prevSelected.filter((i) => i.id !== item.id);
      } else {
        return [...prevSelected, item];
      }
    });
  };

  const handleQuantityChange = (item, quantity) => {
    setSelectedQuantities((prevQuantities) => ({
      ...prevQuantities,
      [item.id]: quantity > item.quantity ? item.quantity : Math.max(0, quantity),
    }));
  };
   
  const processPayment = (fullPayment = false) => {
    setOrders((prevOrders) => {
      let updatedOrders = { ...prevOrders };
  
      if (fullPayment) {
        delete updatedOrders[selectedTable];
      } else {
        updatedOrders[selectedTable] = prevOrders[selectedTable].flatMap((order) => {
          const quantityToPay = selectedQuantities[order.id] || 0;
  
          if (quantityToPay >= order.quantity) {
            return [];
          } else if (quantityToPay > 0) {
            return [{ ...order, quantity: order.quantity - quantityToPay }];
          }
          return [order];
        });
      }
  
      return updatedOrders;
    });
  
    if (fullPayment) {
      setTables((prevTables) => prevTables.filter((table) => table !== selectedTable));
    }
  
    setSelectedQuantities({}); // 🧹 Réinitialise les quantités sélectionnées
    closePaymentModal();       // 🔒 Ferme la modale
  };
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
      
      setDate(`${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`);
    }, 1000); 

    return () => clearInterval(interval); 
  }, []);

  if (loading) {
    return <p className={styles.loading}>Chargement...</p>;
  }

  if (!user) {
    return <ErrorMessage />
  }
  
  return (
    <div className={styles.container}>
      <Dashboard />
      <Header />
      <section className={styles.time}>
        <p>{date}</p>
        <p> C.A de la journée : {profit} </p>
        <p>{time}</p>
        {sessionStartDate && <p>Début du service : {sessionStartDate.toLocaleString()}</p>} {/* Afficher l'heure de début de session */}
      </section>
      <section className={styles.main}>
        <Main user ={user}/>     
      </section>    
      {isPaymentModalOpen && (
        <div className={styles.paymentModal}>
          <div className={styles.paymentModalContent}>
            <button className={styles.closeBtn} onClick={closePaymentModal}>X</button>
            <h3 className={styles.paiementTitle}>Paiement de la Table {selectedTable}</h3>           
            <div className={styles.paymentItems}>
              {orders[selectedTable]?.map((item) => (
                <div key={item.id} className={styles.paymentItem}>
                  <span>{item.name} (x{item.quantity}) - {item.price * item.quantity}€</span>
                    <input
                      className={styles.paymentInput}
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={selectedQuantities[item.id] || ""}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value, 10) || 0)}
                    />
                </div>
              ))}
            </div>
            <div className={styles.paymentActions}>
              <button 
                className={styles.payFullBtn} 
                onClick={() => processPayment(true)}>Payer tout ({calculateTotal()}€)
              </button>
              <button 
                className={styles.paySelectedBtn} 
                onClick={() => processPayment(false)} 
                disabled={Object.values(selectedQuantities).every(q => q === 0)}
              >
                Payer la sélection ({Object.keys(selectedQuantities).reduce((sum, id) => {
                const item = orders[selectedTable]?.find(i => i.id === id);
                return sum + ((item?.price || 0) * (selectedQuantities[id] || 0));
                }, 0)}€)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}