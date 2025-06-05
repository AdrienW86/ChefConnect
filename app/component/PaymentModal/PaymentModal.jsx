'use client';

import React, { useState, useMemo } from 'react';
import styles from './paymentModal.module.css';

const PAYMENT_METHODS = ['Ticket', 'Espèces', 'CB', 'Chèque'];

export default function PaymentModal({ user, selectedTable, orders, setOrders, setIsPaymentModalOpen, removeItemsFromOrder }) {
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
      const rate = item.tvaRate || 10;
      const total = item.price * item.quantity;
      const ht = total / (1 + rate / 100);
      const tva = total - ht;

      if (!tvaMap[rate]) tvaMap[rate] = { ht: 0, tva: 0 };
      tvaMap[rate].ht += ht;
      tvaMap[rate].tva += tva;
    });

    return (
      <div id="receipt" style={{ fontFamily: 'monospace', width: '72mm', padding: '10px' }}>
        <div style={{ textAlign: 'center' }}><strong>Les Délices de Saleilles</strong></div>
        <div style={{ textAlign: 'center' }}>26 avenue de Perpignan, 66280</div>
        <div style={{ textAlign: 'center' }}>Tél: 0650729588</div>
        <hr />
        {items.map((item, i) => (
          <div key={i}>
            {item.name} x{item.quantity} .......... {format(item.price * item.quantity)}
          </div>
        ))}
        <hr />
        {Object.entries(tvaMap).map(([rate, val], i) => (
          <div key={i}>TVA {rate}% - HT: {format(val.ht)} / TVA: {format(val.tva)}</div>
        ))}
        <hr />
        <div><strong>Total TTC : {format(items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</strong></div>
        <hr />
        <div><strong>Modes de paiement :</strong></div>
        {PAYMENT_METHODS.map(method => (
          <div key={method}>
            {method}: {format(paymentAmounts[method])}
          </div>
        ))}
        <hr />
        <div style={{ textAlign: 'center' }}>{new Date().toLocaleString()}</div>
      </div>
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
                /> Payer tout <span className={styles.span}>({calculateTotal().toFixed(2)}€)</span>
              </label>
              <br />
              <label className={styles.label}>
                <input
                  type="radio"
                  checked={!payAll}
                  onChange={() => setPayAll(false)}
                  className={styles.radio}
                  disabled={itemsWithIds.length === 0}
                /> Payer la sélection <span className={styles.span}>({calculateSelectedTotal().toFixed(2)}€)</span>
              </label>
            </div>

            {!payAll && (
              <div className={styles.selection}>
                <h4 className={styles.h4}>Articles sélectionnés à payer :</h4>
                {itemsWithIds.filter(item => (selectedQuantities[item.id] || 0) > 0).length === 0 ? (
                  <p className={styles.p}>Aucun article sélectionné</p>
                ) : (
                  <ul>
                    {itemsWithIds.filter(item => (selectedQuantities[item.id] || 0) > 0).map(item => (
                      <li key={item.id} className={styles.p}>
                        {item.name} x {selectedQuantities[item.id]} = {(item.price * selectedQuantities[item.id]).toFixed(2)}€
                      </li>
                    ))}
                  </ul>
                )}
                <div><strong>Total sélectionné : <span className={styles.span}>{calculateSelectedTotal().toFixed(2)} €</span></strong></div>
              </div>
            )}
            <div className={styles.paymentMethods}>
              <h4 className={styles.h5}>Répartir le paiement :</h4>
              {PAYMENT_METHODS.map(method => (
                <div key={method} className={styles.paymentType}>
                  <strong>{method} :&nbsp; </strong>
                  <div className={styles.label2}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmounts[method]}
                      onChange={(e) => handlePaymentAmountChange(method, e.target.value)}
                      max={payAll ? calculateTotal() : calculateSelectedTotal()}
                    />
                    €
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.paymentActions} style={{ marginTop: 20 }}>
              <button
                className={styles.payFullBtn}
                onClick={() => processPayment(payAll)}
                disabled={payAll ? calculateTotal() === 0 : calculateSelectedTotal() === 0}
              >
                Valider le paiement
              </button>
            </div>
          </>
        ) : (
          <>
            <Receipt items={paidItems} />
            <div className={styles.paymentActions}>
              <button className={styles.printBtn} onClick={printReceipt}>🖨️ Imprimer le ticket</button>
              <button className={styles.closeBtn} onClick={closePaymentModal}>Fermer</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}