"use client";

import { createContext, useContext, useState } from "react";

const RestaurantContext = createContext();

export function RestaurantProvider({ children }) {
  // Structure : orders = { [tableNumber]: [orders] }
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchOrdersForTable = async (tableNumber, userId) => {
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
  // Mise à jour locale immédiate
  setOrders(prev => {
    const tableOrders = prev[tableNumber] || [];
    // Supposons qu'on a qu'une seule commande "en cours" par table
    let order = tableOrders.find(o => o.status === "en cours");

    if (order) {
      // Met à jour les items dans la commande
      const existingItem = order.items.find(i => i.name === item.name);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        order.items.push(item);
      }
      // Recalcul total localement
      order.total += item.price * item.quantity;
      // Replace la commande dans le tableau
      const others = tableOrders.filter(o => o._id !== order._id);
      return { ...prev, [tableNumber]: [...others, order] };
    } else {
      // Pas de commande existante, création locale simple
      const newOrder = {
        _id: "temp_" + Date.now(), // ID temporaire
        tableNumber,
        items: [item],
        total: item.price * item.quantity,
        status: "en cours",
      };
      return { ...prev, [tableNumber]: [...tableOrders, newOrder] };
    }
  });

  // Puis appel au backend pour sauvegarder la modif
  try {
    const res = await fetch(`/api/orders/${tableNumber}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, userId }),
    });
    if (!res.ok) throw new Error("Erreur ajout commande");
    const data = await res.json();

    // Corriger la commande locale avec la version du serveur
    setOrders(prev => {
      const tableOrders = prev[tableNumber] || [];
      const others = tableOrders.filter(o => o._id !== data.order._id && !o._id.startsWith("temp_"));
      return { ...prev, [tableNumber]: [...others, data.order] };
    });
  } catch (error) {
    console.error("Erreur addItemToOrder:", error);
    // Ici tu pourrais revenir en arrière sur la modif locale si tu veux (rollback)
  }
};


const removeItemFromOrder = async (item, tableNumber, userId) => {
  // Mise à jour locale immédiate
  setOrders(prev => {
    const tableOrders = prev[tableNumber] || [];
    let order = tableOrders.find(o => o.status === "en cours");
    if (!order) return prev; // rien à faire si pas de commande en cours

    // Filtrer l'item à retirer
    const newItems = order.items.filter(i => i.name !== item.name);

    // Calculer le nouveau total
    const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const updatedOrder = { ...order, items: newItems, total: newTotal };

    // Remplacer la commande dans la liste
    const others = tableOrders.filter(o => o._id !== order._id);
    return { ...prev, [tableNumber]: [...others, updatedOrder] };
  });

  // Appel au backend pour supprimer l'item
  try {
    const res = await fetch(
      `/api/orders/${tableNumber}/${encodeURIComponent(item.name)}?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Erreur suppression commande");
    const data = await res.json();

    // Corriger la commande locale avec la version serveur
    setOrders(prev => {
      const tableOrders = prev[tableNumber] || [];
      const others = tableOrders.filter(o => o._id !== data.order._id && !o._id.startsWith("temp_"));
      return { ...prev, [tableNumber]: [...others, data.order] };
    });
  } catch (error) {
    console.error("Erreur removeItemFromOrder:", error);
    // Optionnel: rollback si suppression échoue (ex: recharger commande serveur)
    // Tu peux appeler fetchOrdersForTable(tableNumber, userId) ici par exemple
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