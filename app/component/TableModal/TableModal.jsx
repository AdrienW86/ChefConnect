"use client";

import { useEffect, useState } from "react";
import { useRestaurant } from "@/app/Context/RestaurantContext";
import CategoryModal from "../CategoryModal/CategoryModal";
import styles from "./tableModal.module.css";

export default function TableModal({ selectedTable, setIsModalOpen }) {

  const { orders, addItemToOrder, removeItemFromOrder, markAsServed, calculateTotal, setSelectedItemsToPay, setIsPaymentModalOpen } = useRestaurant();
  const [currentCategory, setCurrentCategory] = useState(null); 
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); 
  
  const closeModal = () => {
    setIsModalOpen(false); 
  };

  const openPaymentModal = () => {
    setSelectedItemsToPay([]); 
    setIsPaymentModalOpen(true);
  };

  const openCategoryModal = (category) => {
    setCurrentCategory(category);
    setIsCategoryModalOpen(true); 
  };

  return (
    <>    
      <div className={styles.tableModal}>
        <div className={styles.tableModalContent}>
          <button className={styles.closeBtn} onClick={closeModal}>X</button>
          <h3 className={styles.tableNumber}>Table {selectedTable}</h3>
          <div className={styles.commandeBox}>
            <div className={styles.commande}>  
              {orders[selectedTable] && orders[selectedTable]
                .filter(item => item.status === "en cours")  // Filtrer les éléments en "en cours"
                .reduce((acc, item) => {
                  const existingItem = acc.find(order => order.name === item.name);
                  if (existingItem) {
                    existingItem.quantity += item.quantity;
                  } else {
                    acc.push({ ...item });
                  }
                  return acc;
                }, [])
              .map((item) => (
                <div key={item.id} className={styles.itemCommande}>
                  <button
                    className={styles.btnDelete}
                    onClick={() => removeItemFromOrder(item, selectedTable)}
                  >
                  x
                  </button>
                  <span className={styles.itemName}>
                    {item.name} (x{item.quantity})  {/* Affichage de la quantité totale */}
                  </span> 
                  <span className={styles.itemStatus} style={{ color: "red" }}>
                    En cours...
                      <button className={styles.btnServi} onClick={() => markAsServed(item, selectedTable)}>v</button>
                  </span>        
                  
                  <span className={styles.itemPrice}>{item.quantity * item.price}€</span>
                </div>
              ))}
              {orders[selectedTable] && orders[selectedTable]
                .filter(item => item.status === "servi")  // Filtrer les éléments en "servi"
                .reduce((acc, item) => {
                  const existingItem = acc.find(order => order.name === item.name);
                  if (existingItem) {
                    existingItem.quantity += item.quantity;
                  } else {
                    acc.push({ ...item });
                  }
                  return acc;
                }, [])
                .map((item) => (
                  <div key={item.id} className={styles.itemCommande}>
                    <span className={styles.itemName}>
                      {item.name} (x{item.quantity})  {/* Affichage de la quantité totale */}
                    </span> 
                    <span className={styles.itemStatus} style={{ color: "green" }}>
                      Servi
                    </span>
                    <button
                    className={styles.btnDelete}
                    onClick={() => removeItemFromOrder(item, selectedTable)}
                  >
                    x
                  </button>
                    <span className={styles.itemPrice}>{item.quantity * item.price}€</span>
                  </div>
                ))}
              <h3 className={styles.total}>  <strong>Total : <span className={styles.spanTotal}>{calculateTotal(selectedTable)}€</span></strong></h3>
            </div>
            <div className={styles.menuAside}>
              <button className={styles.btnTableModalValid} > VALIDER </button>
              <button className={styles.btnTableModal} onClick={() => openCategoryModal("boissons")}> BOISSONS </button>
              <button className={styles.btnTableModal} onClick={() => openCategoryModal("entrees")}> ENTREES </button>
              <button className={styles.btnTableModal} onClick={() => openCategoryModal("plats")}> PLATS </button>
              <button className={styles.btnTableModal} onClick={() => openCategoryModal("desserts")}> DESSERTS </button>
              <button className={styles.btnTableModal} onClick={() => openCategoryModal("menus")}> MENUS </button>
              <button className={styles.btnTableModalPay} onClick={openPaymentModal}> PAYER </button>
            </div>
          </div>
        </div>
      </div> 
      {isCategoryModalOpen && currentCategory && (
        <CategoryModal 
          currentCategory={currentCategory}
          isCategoryModalOpen={isCategoryModalOpen}
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          addItemToOrder={(item) => {
            // Ajouter directement l'item via addItemToOrder sans dupliquer l'ajout
            addItemToOrder(item, selectedTable);
            setIsCategoryModalOpen(false); // Fermer la modale après ajout
          }}
        />
      )}
    </>
  );
}
