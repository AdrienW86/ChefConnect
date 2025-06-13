'use client';

import React, { useState, useMemo } from 'react';
import styles from './paymentModal.module.css';

const PAYMENT_METHODS = ['Ticket', 'Espèces', 'CB', 'Chèque'];

export default function PaymentModal({ user, selectedTable, orders, setOrders, setIsPaymentModalOpen, removeItemsFromOrder, ticketNumber }) {
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [paidItems, setPaidItems] = useState([]);
  const [paymentAmounts, setPaymentAmounts] = useState(
    PAYMENT_METHODS.reduce((acc, method) => ({ ...acc, [method]: 0 }), {})
  );
  const [payAll, setPayAll] = useState(true);

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedQuantities({});
    setPaymentAmounts(PAYMENT_METHODS.reduce((acc, method) => ({ ...acc, [method]: 0 }), {}));
    setShowReceipt(false);
    setPaidItems([]);
  };

  const tableOrders = orders.find(order => order.tableNumber === selectedTable);
  const items = tableOrders ? tableOrders.items : [];

  const itemsWithIds = useMemo(() => {
    return items.map((item, index) => ({
      ...item,
      id: item.id ?? `temp-id-${index}`,
    }));
  }, [items]);

  const handleQuantityChange = (item, value) => {
    let quantity = parseInt(value, 10);
    if (isNaN(quantity)) {
      setSelectedQuantities(prev => ({
        ...prev,
        [item.id]: '',
      }));
      return;
    }
    if (quantity < 0) quantity = 0;
    if (quantity > item.quantity) quantity = item.quantity;

    setSelectedQuantities(prev => ({
      ...prev,
      [item.id]: quantity,
    }));
  };

  const calculateTotal = () => {
    return itemsWithIds.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateSelectedTotal = () => {
    return itemsWithIds.reduce((sum, item) => {
      const qty = selectedQuantities[item.id];
      if (qty === '' || qty === undefined) return sum;
      return sum + item.price * qty;
    }, 0);
  };

  const handlePaymentAmountChange = (method, value) => {
    let val = parseFloat(value);
    if (isNaN(val) || val < 0) val = 0;

    const otherSum = Object.entries(paymentAmounts)
      .filter(([key]) => key !== method)
      .reduce((sum, [, v]) => sum + v, 0);

    const maxAllowed = (payAll ? calculateTotal() : calculateSelectedTotal()) - otherSum;
    if (val > maxAllowed) val = maxAllowed;

    setPaymentAmounts(prev => ({
      ...prev,
      [method]: val,
    }));
  };

  const processPayment = async (payAllParam) => {
    setPayAll(payAllParam);

    const itemsToPay = payAllParam
      ? itemsWithIds
      : itemsWithIds
          .filter(item => (selectedQuantities[item.id] || 0) > 0)
          .map(item => ({
            ...item,
            quantity: selectedQuantities[item.id],
          }));

    const totalToPay = payAllParam ? calculateTotal() : calculateSelectedTotal();
    const paymentSum = Object.values(paymentAmounts).reduce((a, b) => a + b, 0);

    if (paymentSum !== totalToPay) {
      alert(`Le total des paiements (${paymentSum.toFixed(2)}€) doit être égal au total à payer (${totalToPay.toFixed(2)}€).`);
      return;
    }

    setPaidItems(itemsToPay);
    setShowReceipt(true);

    const remainingItems = payAllParam
      ? []
      : itemsWithIds.flatMap(item => {
          const paidQty = selectedQuantities[item.id] || 0;
          const remainingQty = item.quantity - paidQty;
          return remainingQty > 0 ? [{ ...item, quantity: remainingQty }] : [];
        });

    const updatedOrders = orders.map(order =>
      order.tableNumber === selectedTable
        ? { ...order, items: remainingItems }
        : order
    );

    removeItemsFromOrder(itemsToPay, selectedTable, user.userId);
    setOrders(updatedOrders);

    // 👇 Appel réel à l'API ici
    try {
      const response = await fetch("/api/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.userId,
          tableNumber: selectedTable,
          items: itemsToPay,
          total: totalToPay,
          paymentMethods: paymentAmounts
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Paiement enregistré avec succès !");
      } else {
        console.error("❌ Erreur d'enregistrement :", data.message || data.error);
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'appel API :", error);
    }
  };

  const printReceipt = () => {
    const printContent = document.getElementById('receipt').innerHTML;
    const win = window.open('', '', 'width=300,height=600');
    win.document.write(`
      <html>
        <head><title>Ticket</title></head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
  };

  const Receipt = ({ items }) => {
    const tvaMap = {};
    const format = (n) => `${n.toFixed(2)} €`;

    items.forEach(item => {
      const rate = item.tva;
      const total = item.price * item.quantity;
      const ht = total / (1 + rate / 100);
      const tva = total - ht;

      if (!tvaMap[rate]) tvaMap[rate] = { ht: 0, tva: 0 };
      tvaMap[rate].ht += ht;
      tvaMap[rate].tva += tva;
    });

    const totalHT = Object.values(tvaMap).reduce((acc, cur) => acc + cur.ht, 0);
    const totalTVA = Object.values(tvaMap).reduce((acc, cur) => acc + cur.tva, 0);

    return (
     <section className={styles.ticketContainer}>
       <div id="receipt" className={styles.ticket}>
        <div className={styles.ticketTitle}><strong>Les Délices de Saleilles</strong></div>
        <div className={styles.ticketInfos}>26 avenue de Perpignan, 66280 Saleilles</div>
         <div className={styles.ticketInfos}> 66280 Saleilles</div>
        <div className={styles.ticketPhone}>Tél: 06.50.72.95.88</div>
        <div style={{ textAlign: 'center' }}>{new Date().toLocaleString()}</div>
        <div className={styles.ticketNumber}>Ticket n° : <strong>{ticketNumber}</strong></div>
        <p> ===============================================</p>

        {items.map((item, i) => {
          const rate = item.tva;
          const totalTTC = item.price * item.quantity;
          const ht = totalTTC / (1 + rate / 100);
          return (
            <div className={styles.ticketItems} key={i}>
              <p>{item.name} x{item.quantity}</p>
              <p>{format(ht)} HT</p>
            </div>
          );
        })}
        <p> ===============================================</p>
        <div className={styles.tvaItemTicket}>
          <p> <strong>Total HT : </strong> </p>
          <p> <strong> {format(totalHT)} </strong></p>
        </div>
        <p> ===============================================</p>
        {Object.entries(tvaMap).map(([rate, val], i) => (
          <div className={styles.tvaItemTicket} key={i}>
            <p>TVA {rate}%</p> 
            <p>{format(val.tva)}</p> 
          </div>
        ))}
        <p> ===============================================</p>
         <div className={styles.tvaItemTicket}>
          <p> <strong>Total TVA :</strong></p>
          <p><strong> {format(totalTVA)} </strong></p>
         </div>
        
        <p> ===============================================</p>
        <div className={styles.tvaItemTicket}>
          <p><strong>Total TTC : </strong></p>
          <p><strong> {format(items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</strong></p>
        </div>
        <p> ===============================================</p>
        <div className={styles.ticketMode}><strong>Modes de paiement </strong></div>
        {PAYMENT_METHODS.filter(method => paymentAmounts[method] > 0).map(method => (
          <div key={method} className={styles.tvaItemTicket}>
           <p>{method}:</p>  
           <p>{format(paymentAmounts[method])}</p>
          </div>
        ))}
         <p> ===============================================</p>
        <p className={styles.ticketMessage}> Nous vous remercions de votre visite, à bientôt !</p>
      </div>
     </section>
    );
  };

  return (
    <div className={styles.paymentModal}>
      <div className={styles.paymentModalContent}>
        <button className={styles.closeBtn} onClick={closePaymentModal}>X</button>
        <h3 className={styles.paiementTitle}>Paiement de la Table {selectedTable}</h3>

        {!showReceipt ? (
          <>
            <div className={styles.paymentItems}>
              {itemsWithIds.map((item) => (
                <div key={item.id} className={styles.item}>
                  <span>{item.name} (x {item.quantity})</span>
                  <input
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={selectedQuantities[item.id] === '' ? '' : selectedQuantities[item.id] || 0}
                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className={styles.pay}>
              <label className={styles.label}>
                <input
                  type="radio"
                  checked={payAll}
                  onChange={() => setPayAll(true)}
                  className={styles.radio}
                /> Payer tout <span className={styles.span}> {calculateTotal().toFixed(2)} €</span>
              </label>
              <label className={styles.label}>
                <input
                  type="radio"
                  checked={!payAll}
                  onChange={() => setPayAll(false)}
                  className={styles.radio}
                /> Payer la sélection <span className={styles.span}> {calculateSelectedTotal().toFixed(2)} €</span>
              </label>
            </div>

            <div className={styles.paymentMethods}>
              {PAYMENT_METHODS.map(method => (
                <div key={method} className={styles.paymentMethod}>
                  <label>{method} :</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={paymentAmounts[method]}
                    onChange={(e) => handlePaymentAmountChange(method, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button
              className={styles.btnValiderPaiement}
              onClick={() => processPayment(payAll)}
              disabled={
                payAll
                  ? Object.values(paymentAmounts).reduce((a, b) => a + b, 0) !== calculateTotal()
                  : Object.values(paymentAmounts).reduce((a, b) => a + b, 0) !== calculateSelectedTotal()
              }
            >
              Valider le paiement
            </button>
          </>
        ) : (
          <>
            <Receipt items={paidItems} />
            <button className={styles.printBtn} onClick={printReceipt}>Imprimer</button>
            <button
              className={styles.closeBtnReceipt}
              onClick={() => {
                closePaymentModal();
              }}
            >
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
