// context/RestaurantContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const RestaurantContext = createContext();

export function RestaurantProvider({ children }) {
  const [orders, setOrders] = useState({});

const addItemToOrder = (item, tableNumber) => {
  setOrders(prevOrders => {
    const currentOrders = { ...prevOrders };
    const tableOrders = currentOrders[tableNumber] ? [...currentOrders[tableNumber]] : [];

    const existingIndex = tableOrders.findIndex(order => order.name === item.name && order.status === "en cours");
    if (existingIndex !== -1) {
      // Créer une nouvelle copie de l’item modifié
      const updatedItem = { ...tableOrders[existingIndex], quantity: tableOrders[existingIndex].quantity + 1 };
      tableOrders[existingIndex] = updatedItem;
    } else {
      tableOrders.push({
        id: Date.now(),  // ou uuid
        name: item.name,
        price: item.price,
        quantity: 1,
        status: "en cours",
      });
    }

    currentOrders[tableNumber] = tableOrders;
    return currentOrders;
  });
};


  const removeItemFromOrder = (item, tableNumber) => {
    setOrders(prevOrders => {
      const updatedOrders = { ...prevOrders };
      updatedOrders[tableNumber] = updatedOrders[tableNumber].filter(order => order.name !== item.name);
      return updatedOrders;
    });
  };

  const markAsServed = (item, tableNumber) => {
    setOrders(prevOrders => {
      const updatedOrders = { ...prevOrders };
      updatedOrders[tableNumber] = updatedOrders[tableNumber].map(order => {
        if (order.name === item.name && order.status === "en cours") {
          return { ...order, status: "servi" };
        }
        return order;
      });
      return updatedOrders;
    });
  };

  const calculateTotal = (tableNumber) => {
    const tableOrders = orders[tableNumber] || [];
    return tableOrders.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <RestaurantContext.Provider value={{ orders, addItemToOrder, removeItemFromOrder, markAsServed, calculateTotal }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  return useContext(RestaurantContext);
}
