"use client";

import { createContext, useContext, useState } from "react";

const RestaurantContext = createContext();

export function RestaurantProvider({ children }) {
  // Structure : orders = { [tableNumber]: [orders] }
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchOrdersForTable = async (tableNumber, userId) => {
    console.log(userId)
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${tableNumber}?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("Erreur récupération commandes");
      const data = await res.json();
      setOrders((prev) => ({ ...prev, [tableNumber]: data.orders || [] }));
    } catch (err) {
      console.error("Erreur fetchOrdersForTable:", err);
    } finally {
      setLoading(false);
    }
  };

  const addItemToOrder = async (item, tableNumber, userId) => {
    console.log(item)
    console.log(userId)
    try {
      const res = await fetch(`/api/orders/${tableNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, userId }),
      });
      if (!res.ok) throw new Error("Erreur ajout commande");
      const data = await res.json();

      setOrders((prev) => {
        const tableOrders = prev[tableNumber] || [];
        // Remplacer la commande mise à jour
        const others = tableOrders.filter((o) => o._id !== data.order._id);
        return { ...prev, [tableNumber]: [...others, data.order] };
      });
    } catch (error) {
      console.error("Erreur addItemToOrder:", error);
    }
  };

  const removeItemFromOrder = async (item, tableNumber, userId) => {
    try {
      const res = await fetch(`/api/orders/${tableNumber}/remove-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, userId }),
      });
      if (!res.ok) throw new Error("Erreur suppression commande");
      const data = await res.json();

      setOrders((prev) => {
        const tableOrders = prev[tableNumber] || [];
        // Remplacer la commande mise à jour
        const others = tableOrders.filter((o) => o._id !== data.order._id);
        return { ...prev, [tableNumber]: [...others, data.order] };
      });
    } catch (error) {
      console.error("Erreur removeItemFromOrder:", error);
    }
  };

  const markAsServed = async (item, tableNumber, userId) => {
    try {
      const res = await fetch(`/api/orders/${tableNumber}/mark-served`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, userId }),
      });
      if (!res.ok) throw new Error("Erreur marquage servi");
      const data = await res.json();

      setOrders((prev) => {
        const tableOrders = prev[tableNumber] || [];
        // Remplacer la commande mise à jour
        const others = tableOrders.filter((o) => o._id !== data.order._id);
        return { ...prev, [tableNumber]: [...others, data.order] };
      });
    } catch (error) {
      console.error("Erreur markAsServed:", error);
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        orders,
        loading,
        fetchOrdersForTable,
        addItemToOrder,
        removeItemFromOrder,
        markAsServed,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  return useContext(RestaurantContext);
}
