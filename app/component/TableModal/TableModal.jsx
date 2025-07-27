"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/Context/UserContext";
import { useRestaurant } from "@/app/Context/RestaurantContext";
import { v4 as uuidv4 } from 'uuid';
import PaymentModal from "../PaymentModal/PaymentModal";
import CategoryModal from "../CategoryModal/CategoryModal";
import jsPDF from "jspdf";
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



  function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () =>
    (Math.floor(Math.random() * 16)).toString(16)
  );
  return timestamp + random;
}



   const handleCustomPriceWithTVA = (tvaRate) => {
  const name = prompt(`Nom du produit (TVA ${tvaRate}%) ?`);
  if (!name) return;

  const priceInput = prompt("Prix ?");
  const price = parseFloat(priceInput);
  if (isNaN(price) || price <= 0) {
    alert("Prix invalide");
    return;
  }

  const _id = generateObjectId();

  const item = {
    _id, // 👈 ID comme MongoDB
    name,
    price,
    quantity: 1,
    tva: tvaRate,
  };
  console.log(item)

  addItemToOrder(item,selectedTable,user.userId);
};

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

  // 📄 Création du PDF au format A5 paysage
  const doc = new jsPDF({ orientation: "landscape", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // 📍 Marges et calculs
  const leftMargin = 15;
  const rightMargin = 15;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // 📍 Fonctions utilitaires
  const centerText = (text, y) => {
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };

  const drawLineSeparator = (y) => {
    const startX = leftMargin;
    const endX = pageWidth - rightMargin;

    doc.setLineDashPattern([1, 1], 0); // 👉 ligne pointillée : 1pt trait, 1pt espace
    doc.line(startX, y, endX, y);
    doc.setLineDashPattern([], 0); // 🔁 réinitialise à ligne pleine

    return y + 7; // ajoute 7 unités d’espace après la ligne (margin-bottom)
  };

  const drawLineWithPrice = (label, price, y) => {
    const priceText = `${price} €`;
    const labelMaxWidth = contentWidth - doc.getTextWidth(priceText) - 5;
    const truncatedLabel = doc.splitTextToSize(label, labelMaxWidth)[0];
    doc.text(truncatedLabel, leftMargin, y);
    const priceX = pageWidth - rightMargin - doc.getTextWidth(priceText);
    doc.text(priceText, priceX, y);
  };

  // 🧾 En-tête centré
  doc.setFontSize(20);
  centerText("PICARFRITES", y);
  y += 10;

  doc.setFontSize(14);
  centerText("26 avenue de Perpignan, 66280 Saleilles", y);
  y += 7;

  centerText("06 50 72 95 88", y);
  y += 8;

  centerText(`Table : ${selectedTable}`, y);
  y += 7;

  centerText(`Date : ${new Date().toLocaleString("fr-FR")}`, y);
  y += 8;

  y = drawLineSeparator(y);

  // 🧾 Liste des articles alignée
  doc.setFontSize(12);
  items.forEach(item => {
    const label = `${item.name} x${item.quantity}`;
    const price = (item.price * item.quantity).toFixed(2);
    drawLineWithPrice(label, price, y);
    y += 7;
  });

  y = drawLineSeparator(y);

  // 💰 Totaux
  drawLineWithPrice("Total HT", Number(totalHT).toFixed(2), y);
  y += 7;
  y = drawLineSeparator(y);

  drawLineWithPrice("TVA", Number(totalTVA).toFixed(2), y);
  y += 7;
  y = drawLineSeparator(y);

  drawLineWithPrice("Total TTC", Number(totalTTC).toFixed(2), y);
  y += 10;

  y = drawLineSeparator(y);

  // 👋 Message de fin
  doc.setFontSize(20);
  centerText("Merci de votre visite !", y);

  // 📄 Création du PDF
  const blob = doc.output("blob");
  const file = new File([blob], `ticket-table-${selectedTable}.pdf`, {
    type: "application/pdf",
  });

  // 📱 Partage natif si possible
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Ticket de caisse",
        text: `Ticket de la table ${selectedTable}`,
      });
      return;
    } catch (err) {
      console.error("Erreur de partage :", err);
    }
  }

  // 💻 Sinon : ouverture du PDF
  const url = URL.createObjectURL(blob);
  window.open(url);
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
              <div className={styles.freeBox}>
                <button
                  className={styles.freeItem}
                  onClick={() => handleCustomPriceWithTVA(5.5)}
                >
                  PRIX LIBRE (TVA 5.5%)
                </button>         
                <button
                  className={styles.freeItem}
                  onClick={() => handleCustomPriceWithTVA(10)}          
                >
                  PRIX LIBRE (TVA 10%)
                </button>
              </div>
              <div className={styles.paymentBtnContainer}>
                <button className={styles.printBtn} onClick={handleShare}>IMPRIMER</button>
                <button className={styles.paymentBtn} onClick={() => setIsPaymentModalOpen(true)}>PAYER</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isPaymentModalOpen && (
        <PaymentModal ticketNumber={ticketNumber} user={user} selectedTable={selectedTable} orders={currentOrders} setOrders={setOrders} totalTTC={totalTTC} totalHT={totalHT} totalTVA={totalTVA} tvaDetails={tvaDetails} removeItemsFromOrder={removeItemsFromOrder} setIsPaymentModalOpen={setIsPaymentModalOpen} />
      )}
      {isCategoryModalOpen && currentCategory && (
        <CategoryModal currentCategory={currentCategory} setIsCategoryModalOpen={setIsCategoryModalOpen} addItemToOrder={(item) => { addItemToOrder(item, selectedTable, user.userId); setIsCategoryModalOpen(false); }} />
      )}
    </>
  );
}