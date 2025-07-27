"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/Context/UserContext";
import { useRestaurant } from "@/app/Context/RestaurantContext";
import { v4 as uuidv4 } from 'uuid';
import PaymentModal from "../PaymentModal/PaymentModal";
import CategoryModal from "../CategoryModal/CategoryModal";
import PrintTicket from "../PrintTicket/PrintTicket";
import styles from "./tableModal.module.css";

export default function TableModal({ selectedTable, setIsModalOpen }) {
  const { user, loading } = useUser();
  const {
    orders,
    setOrders,
    addItemToOrder,
    removeItemFromOrder,
    removeItemsFromOrder,
  } = useRestaurant();

  const [ticketNumber, setTicketNumber] = useState('');
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersFromApi, setOrdersFromApi] = useState([]);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    setTicketNumber(uuidv4());
  }, []);

  useEffect(() => {
    if (!user || loading) return;
    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/categories?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) throw new Error("Erreur de récupération catégories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, [user, loading]);

  useEffect(() => {
    if (!loading && user && selectedTable) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await fetch(`/api/orders/${selectedTable}?userId=${encodeURIComponent(user.userId ?? user._id)}`);
          if (!res.ok) throw new Error("Erreur récupération commandes");
          const data = await res.json();
          setOrdersFromApi(data.orders);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingOrders(false); 
        }
      };
      fetchOrders();
    }
  }, [selectedTable, user, loading]);

  const currentOrders = orders[selectedTable] && orders[selectedTable].length > 0
    ? orders[selectedTable]
    : ordersFromApi;

  const mergedOrders = (status) => {
    if (!currentOrders || currentOrders.length === 0) return [];

    const filteredOrders = currentOrders.filter(order => order.status === status);

    if (filteredOrders.length === 0) return [];

    const allItems = filteredOrders.flatMap(order => order.items);

    const merged = [];

    allItems.forEach((item) => {
      const existing = merged.find((i) => i.name === item.name);
      if (existing) {
        existing.quantity += Number(item.quantity) || 0;
      } else {
        merged.push({ ...item, quantity: Number(item.quantity) || 0 });
      }
    });

    return merged;
  };

  const calculateTotalTTC = () => {
    if (!currentOrders || currentOrders.length === 0) return 0;

    const ordersForTable = currentOrders.filter(order => order.tableNumber === selectedTable);

    let total = 0;

    ordersForTable.forEach(order => {
      order.items.forEach(item => {
        total += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      });
    });

    return total;
  };

  const calculateTVAAndHT = () => {
    if (!currentOrders || currentOrders.length === 0) {
      return { tvaDetails: {}, totalTVA: 0, totalHT: 0 };
    }

    const ordersForTable = currentOrders.filter(order => order.tableNumber === selectedTable);

    const tvaByRate = {};
    let totalTVA = 0;
    let totalHT = 0;

    ordersForTable.forEach(order => {
      order.items.forEach(item => {
        const taux = Number(item.tva) || 0;
        const prix = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        const tvaPart = prix * (taux / (100 + taux));
        totalTVA += tvaPart;

        const htPart = prix - tvaPart;
        totalHT += htPart;

        if (tvaByRate[taux]) {
          tvaByRate[taux] += tvaPart;
        } else {
          tvaByRate[taux] = tvaPart;
        }
      });
    });

    Object.keys(tvaByRate).forEach(rate => {
      tvaByRate[rate] = tvaByRate[rate].toFixed(2);
    });

    return {
      tvaDetails: tvaByRate,
      totalTVA: totalTVA.toFixed(2),
      totalHT: totalHT.toFixed(2),
    };
  };

const handleShare = async () => {
  const items = mergedOrders("en cours");

  if (!items || items.length === 0) {
    alert("Aucun article à partager.");
    return;
  }

  const totalTTC = calculateTotalTTC();
  const { tvaDetails, totalTVA, totalHT } = calculateTVAAndHT();

  // Construire le texte du ticket
  const lines = items.map(item =>
    `• ${item.name} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)}€`
  );

  const summary = [
    `🪑 Table ${selectedTable}`,
    `Total TTC : ${totalTTC.toFixed(2)}€`,
    `Total HT : ${totalHT}€`,
    `TVA : ${totalTVA}€`,
    "",
    ...lines
  ].join("\n");

  // Options de partage
  const shareData = {
    title: `Ticket Table ${selectedTable}`,
    text: summary
  };

  // Vérifier compatibilité de navigator.share
  if (navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
    } catch (error) {
      console.error("Erreur de partage:", error);
    }
  } else if (navigator.share) {
    // Pour compatibilité minimale
    try {
      await navigator.share(shareData);
    } catch (error) {
      console.error("Erreur de partage:", error);
    }
  } else {
    alert("Le partage n'est pas pris en charge sur ce navigateur.");
  }
};





  if (loading || loadingOrders) return <p>Chargement des données...</p>;
  if (!user) return <p>Utilisateur non connecté</p>;
  if (!selectedTable) return <p>Aucune table sélectionnée</p>;

  const totalTTC = calculateTotalTTC();
  const { tvaDetails, totalTVA, totalHT } = calculateTVAAndHT();

  return (
    <>
      <div className={styles.tableModal}>
        <div className={styles.tableModalContent}>
          <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>X</button>
          <h3 className={styles.tableNumber}>Table {selectedTable}</h3>
          {currentOrders.length === 0 && <p className={styles.not}>Aucune commande pour cette table.</p>}
          <div className={styles.commandeBox}>
            <div className={styles.commande}>
              {mergedOrders("en cours").map((item, index) => (
                <div key={`en-cours-${item.name}-${index}`} className={styles.itemCommande}>
                  <button className={styles.btnDelete} onClick={() => removeItemFromOrder(item, selectedTable, user.userId)}>x</button>
                  <span className={styles.itemName}>{item.name} (x{item.quantity})</span>
                  <span className={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)}€</span>
                </div>
              ))}
              <h3 className={styles.totalHT}>Total HT : <span className={styles.spanTotal}>{totalHT}€</span></h3>
              <h3 className={styles.totalTVA}>
                <div className={styles.tvaBreakdown}>
                  {Object.entries(tvaDetails).map(([rate, amount]) => (
                    <div key={rate} className={styles.rate}>TVA {rate}% : <span className={styles.tva}>{amount}€</span></div>
                  ))}
                </div>
              </h3>
              <div className={styles.totalTVA}>Total TVA : <span className={styles.tva}>{totalTVA}€</span></div>
              <h3 className={styles.total}><strong>Total TTC : <span className={styles.spanTotal}>{totalTTC.toFixed(2)}€</span></strong></h3>
            </div>
            <div className={styles.boxBtn}>
              {categories.map((category) => (
                <button key={category._id} className={styles.btnTableModal} onClick={() => { setCurrentCategory(category); setIsCategoryModalOpen(true); }}>
                  {category.name.toUpperCase()}
                </button>
              ))}
              <div className={styles.paymentBtnContainer}>
                <button className={styles.printBtn} onClick={setIsPrintOpen}>IMPRIMER</button>
                <button className={styles.paymentBtn} onClick={() => setIsPaymentModalOpen(true)}>PAYER</button>
                <button className={styles.shareBtn} onClick={handleShare}>PARTAGER</button> 
              </div>
            </div>
          </div>
        </div>
      </div>
      {isPrintOpen && (
        <PrintTicket orders={currentOrders} totalTTC={totalTTC} totalHT={totalHT} totalTVA={totalTVA} tvaDetails={tvaDetails} ticketNumber={ticketNumber} selectedTable={selectedTable} setIsPrintOpen={setIsPrintOpen} />
      )}
      {isPaymentModalOpen && (
        <PaymentModal ticketNumber={ticketNumber} user={user} selectedTable={selectedTable} orders={currentOrders} setOrders={setOrders} totalTTC={totalTTC} totalHT={totalHT} totalTVA={totalTVA} tvaDetails={tvaDetails} removeItemsFromOrder={removeItemsFromOrder} setIsPaymentModalOpen={setIsPaymentModalOpen} />
      )}
      {isCategoryModalOpen && currentCategory && (
        <CategoryModal currentCategory={currentCategory} setIsCategoryModalOpen={setIsCategoryModalOpen} addItemToOrder={(item) => { addItemToOrder(item, selectedTable, user.userId); setIsCategoryModalOpen(false); }} />
      )}
    </>
  );
}