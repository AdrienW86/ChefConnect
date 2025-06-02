"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/Context/UserContext";
import { useRestaurant } from "@/app/Context/RestaurantContext";
import CategoryModal from "../CategoryModal/CategoryModal";
import styles from "./tableModal.module.css";

export default function TableModal({ selectedTable, setIsModalOpen }) {
  const { user, loading } = useUser();
  const {
    orders,
    addItemToOrder,
    removeItemFromOrder,
    markAsServed,
    calculateTotal,
    setSelectedItemsToPay,
    setIsPaymentModalOpen,
  } = useRestaurant();

  const [currentCategory, setCurrentCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (!user || loading) return;

    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/categories?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) throw new Error("Erreur de récupération");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Erreur fetch catégories:", err);
      }
    };

    fetchCategories();
  }, [user, loading]);

  // Fusionner les items avec même nom et status, pour un affichage simplifié
  const mergedOrders = (status) => {
    if (!orders[selectedTable]) return [];
    const filtered = orders[selectedTable].filter((item) => item.status === status);
    const merged = [];

    filtered.forEach((item) => {
      const existing = merged.find((i) => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.push({ ...item });
      }
    });

    return merged;
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openCategoryModal = (category) => {
    setCurrentCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleAddItem = (item) => {
    addItemToOrder(item, selectedTable);
  };

  return (
    <>
      <div className={styles.tableModal}>
        <div className={styles.tableModalContent}>
          <button className={styles.closeBtn} onClick={closeModal}>
            X
          </button>
          <h3 className={styles.tableNumber}>Table {selectedTable}</h3>

          <div className={styles.commandeBox}>
            <div className={styles.commande}>
              {/* Items "en cours" */}
              {mergedOrders("en cours").map((item, index) => (
                <div key={`en-cours-${item.name}-${index}`} className={styles.itemCommande}>
                  <button
                    className={styles.btnDelete}
                    onClick={() => removeItemFromOrder(item, selectedTable)}
                  >
                    x
                  </button>
                  <span className={styles.itemName}>
                    {item.name} (x{item.quantity})
                  </span>
                  <span className={styles.itemStatus} style={{ color: "red" }}>
                    En cours...
                    <button
                      className={styles.btnServi}
                      onClick={() => markAsServed(item, selectedTable)}
                    >
                      v
                    </button>
                  </span>
                  <span className={styles.itemPrice}>{item.quantity * item.price}€</span>
                </div>
              ))}

              {/* Items "servi" */}
              {mergedOrders("servi").map((item, index) => (
                <div key={`servi-${item.name}-${index}`} className={styles.itemCommande}>
                  <span className={styles.itemName}>
                    {item.name} (x{item.quantity})
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

              <h3 className={styles.total}>
                <strong>
                  Total : <span className={styles.spanTotal}>{calculateTotal(selectedTable)}€</span>
                </strong>
              </h3>
            </div>

            {/* Boutons des catégories */}
            <div className={styles.boxBtn}>
              {categories.map((category) => (
                <button
                  key={category._id}
                  className={styles.btnTableModal}
                  onClick={() => openCategoryModal(category)}
                >
                  {category.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal catégorie */}
      {isCategoryModalOpen && currentCategory && (
        <CategoryModal
          currentCategory={currentCategory}
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          addItemToOrder={handleAddItem}
        />
      )}
    </>
  );
}
