import React from 'react'
import { useEffect, useState } from "react";
import styles from './paymentModal.module.css'

export default function PaymentModal() {

    const [selectedQuantities, setSelectedQuantities] = useState({});

    const closePaymentModal = () => {
        setIsPaymentModalOpen(false);
      };

      const handleQuantityChange = (item, quantity) => {
        setSelectedQuantities((prevQuantities) => ({
          ...prevQuantities,
          [item.id]: quantity > item.quantity ? item.quantity : Math.max(0, quantity),
        }));
      };

  return (
    <>
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
    </>
  )
}
