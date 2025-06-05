"use client";

import { createContext, useContext, useState } from "react";

const RestaurantContext = createContext();

export function RestaurantProvider({ children }) {
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
    if (!item.quantity || item.quantity <= 0) {
    item.quantity = 1;
  }
  setOrders(prev => {
    const tableOrders = prev[tableNumber] || [];
    let order = tableOrders.find(o => o.status === "en cours");

    if (order) {
      const updatedItems = [...order.items];
      const index = updatedItems.findIndex(i => i.name === item.name);

      if (index !== -1) {
        updatedItems[index] = {
          ...updatedItems[index],
          quantity: updatedItems[index].quantity + item.quantity,
        };
      } else {
        updatedItems.push({ ...item }); // clone de item pour éviter référence directe
      }

      const updatedTotal = updatedItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      const updatedOrder = { ...order, items: updatedItems, total: updatedTotal };
      const others = tableOrders.filter(o => o._id !== order._id);
      return { ...prev, [tableNumber]: [...others, updatedOrder] };
    } else {
      const newOrder = {
        _id: "temp_" + Date.now(),
        tableNumber,
        items: [{ ...item }],
        total: item.price * item.quantity,
        status: "en cours",
      };
      return { ...prev, [tableNumber]: [...tableOrders, newOrder] };
    }
  });

  try {
    const res = await fetch(`/api/orders/${tableNumber}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, userId }),
    });
    if (!res.ok) throw new Error("Erreur ajout commande");
    const data = await res.json();

    setOrders(prev => {
      if (!data.order || !data.order._id) return prev;
      const tableOrders = prev[tableNumber] || [];
      const others = tableOrders.filter(o => o && o._id && o._id !== data.order._id && !o._id.startsWith("temp_"));
      return { ...prev, [tableNumber]: [...others, data.order] };
    });
  } catch (error) {
    console.error("Erreur addItemToOrder:", error);
  }
};

  const removeItemFromOrder = async (item, tableNumber, userId) => {
    setOrders(prev => {
      const tableOrders = prev[tableNumber] || [];
      let order = tableOrders.find(o => o.status === "en cours");
      if (!order) return prev;

      const newItems = order.items.filter(i => i.name !== item.name);
      const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      if (newItems.length === 0) {
        // Supprimer la commande si plus d'items
        const others = tableOrders.filter(o => o._id !== order._id);
        return { ...prev, [tableNumber]: others };
      } else {
        const updatedOrder = { ...order, items: newItems, total: newTotal };
        const others = tableOrders.filter(o => o._id !== order._id);
        return { ...prev, [tableNumber]: [...others, updatedOrder] };
      }
    });

    try {
      const res = await fetch(
        `/api/orders/${tableNumber}/${encodeURIComponent(item.name)}?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erreur suppression commande");
      const data = await res.json();

      setOrders(prev => {
        if (!data.order || !data.order._id) return prev;
        const tableOrders = prev[tableNumber] || [];
        const others = tableOrders.filter(o => o && o._id && o._id !== data.order._id && !o._id.startsWith("temp_"));
        return { ...prev, [tableNumber]: [...others, data.order] };
      });
    } catch (error) {
      console.error("Erreur removeItemFromOrder:", error);
    }
  };

 const removeItemsFromOrder = async (itemsToRemove, tableNumber, userId) => {
  setOrders(prev => {
    const tableOrders = prev[tableNumber] || [];
    let order = tableOrders.find(o => o.status === "en cours");
    if (!order) return prev;

    const newItems = order.items.filter(
      i => !itemsToRemove.some(r => r.name === i.name)
    );
    const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    if (newItems.length === 0) {
      const others = tableOrders.filter(o => o._id !== order._id);
      return { ...prev, [tableNumber]: others };
    } else {
      const updatedOrder = { ...order, items: newItems, total: newTotal };
      const others = tableOrders.filter(o => o._id !== order._id);
      return { ...prev, [tableNumber]: [...others, updatedOrder] };
    }
  });

  try {
    const res = await fetch(`/api/orders/${tableNumber}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, items: itemsToRemove }),
    });
    if (!res.ok) throw new Error("Erreur suppression groupée");

    const data = await res.json();
    if (data.order) {
      setOrders(prev => {
        const tableOrders = prev[tableNumber] || [];
        const updatedOrders = tableOrders.map(o =>
          o._id === data.order._id ? data.order : o
        );
        return { ...prev, [tableNumber]: updatedOrders };
      });
    }
  } catch (err) {
    console.error("Erreur bulk remove:", err);
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

      setOrders(prev => {
        if (!data.order || !data.order._id) return prev;
        const tableOrders = prev[tableNumber] || [];
        const others = tableOrders.filter(o => o && o._id && o._id !== data.order._id);
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
        setOrders,
        fetchOrdersForTable,
        addItemToOrder,
        removeItemFromOrder,
        removeItemsFromOrder,
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
