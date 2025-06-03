"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/Context/UserContext";
import { useRestaurant } from "@/app/Context/RestaurantContext";
import CategoryModal from "../CategoryModal/CategoryModal";
import styles from "./tableModal.module.css";

export default function TableModal({ selectedTable, setIsModalOpen }) {
  const { user, loading } = useUser();
  const {
   addItemToOrder,
    removeItemFromOrder,
    markAsServed,
  } = useRestaurant();

  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [ordersFromApi, setOrdersFromApi] = useState([]);

  useEffect(() => {
    if (!user || loading) return;
    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/categories?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) throw new Error("Erreur de récupération catégories");
        const data = await res.json();
        setCategories(data.categories || []);
        // console.log("Catégories chargées:", data.categories);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, [user, loading]);

  useEffect(() => {
    if (!loading && user && selectedTable) {
      // console.log(user.userId)
      const fetchOrders = async () => {
        try {
          const res = await fetch(`/api/orders/${selectedTable}?userId=${encodeURIComponent(user.userId ?? user._id)}`);
          if (!res.ok) throw new Error("Erreur récupération commandes");
          const data = await res.json();
          // console.log("Commandes reçues :", data.orders);
          setOrdersFromApi(data.orders);
        } catch (err) {
          console.error(err);
        }
      };
      fetchOrders();
    }
  }, [selectedTable, user, loading]);

  const mergedOrders = (status) => {
    if (!ordersFromApi || ordersFromApi.length === 0) return [];

    const filteredOrders = ordersFromApi.filter(
      (order) => order.status === status && order.tableNumber === selectedTable
    );

    if (filteredOrders.length === 0) return [];

    const allItems = filteredOrders.flatMap(order => order.items);

    const merged = [];

    allItems.forEach((item) => {
      const existing = merged.find((i) => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.push({ ...item });
      }
    });

    return merged;
  };

  const calculateTotalTTC = () => {
    if (!ordersFromApi || ordersFromApi.length === 0) return 0;

    const ordersForTable = ordersFromApi.filter(order => order.tableNumber === selectedTable);

    let total = 0;

    ordersForTable.forEach(order => {
      order.items.forEach(item => {
        total += item.price * item.quantity;
      });
    });

    return total.toFixed(2);
  };

  const calculateTotalTVA = () => {
    if (!ordersFromApi || ordersFromApi.length === 0) return 0;

    const ordersForTable = ordersFromApi.filter(order => order.tableNumber === selectedTable);
    let totalTVA = 0;

    ordersForTable.forEach(order => {
      order.items.forEach(item => {
        const tvaPart = item.price * item.quantity * (item.tva / (100 + item.tva));
        totalTVA += tvaPart;
      });
    });

    return totalTVA.toFixed(2);
  };

  if (loading) return <p>Chargement...</p>;
  if (!user) return <p>Utilisateur non connecté</p>;
  if (!selectedTable) return <p>Aucune table sélectionnée</p>;

  return (
    <>
      <div className={styles.tableModal}>
        <div className={styles.tableModalContent}>
          <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
            X
          </button>
          <h3 className={styles.tableNumber}>Table {selectedTable}</h3>

          {ordersFromApi.length === 0 && (
            <p>Aucune commande pour cette table.</p>
          )}
          <div className={styles.commandeBox}>
            <div className={styles.commande}>
              {mergedOrders("en cours").map((item, index) => {
                return (
                  <div key={`en-cours-${item.name}-${index}`} className={styles.itemCommande}>
                    <button
                      className={styles.btnDelete}
                      onClick={() => removeItemFromOrder(item, selectedTable, user.userId)}
                    >
                      x
                    </button>
                    <span className={styles.itemName}>
                      {item.name} (x{item.quantity})
                    </span>
                    <span className={styles.itemStatus} style={{ color: "red" }}>
                      En cours...
                    </span>
                    <span className={styles.itemPrice}>
                      {item.price.toFixed(2)}€ (TVA {item.tva}% incluse)
                    </span>
                    <button
                      className={styles.btnServi}
                      onClick={() => markAsServed(item, selectedTable)}
                    >
                      v
                    </button>
                  </div>
                );
              })}
              {mergedOrders("payée").map((item, index) => {
                return (
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
                    <span className={styles.itemPrice}>
                      {item.price.toFixed(2)}€ (TVA {item.tva}% incluse)
                    </span>
                  </div>
                );
              })}
              <h3 className={styles.total}>
                <strong>
                  Total TTC : <span className={styles.spanTotal}>{calculateTotalTTC()}€</span>
                </strong>
              </h3>
              <h4 className={styles.totalTVA}>
                TVA totale : <span>{calculateTotalTVA()}€</span>
              </h4>
            </div>
            <div className={styles.boxBtn}>
              {categories.map((category) => (
                <button
                  key={category._id}
                  className={styles.btnTableModal}
                  onClick={() => {
                    setCurrentCategory(category);
                    setIsCategoryModalOpen(true);
                  }}
                >
                  {category.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isCategoryModalOpen && currentCategory && (
        <CategoryModal
          currentCategory={currentCategory}
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          addItemToOrder={(item) => {
            addItemToOrder(item, selectedTable, user.userId);
            setIsCategoryModalOpen(false);
          }}
        />
      )}
    </>
  );
}