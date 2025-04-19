// context/RestaurantContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const RestaurantContext = createContext();

export function RestaurantProvider({ children }) {
  const [orders, setOrders] = useState({});

  const addItemToOrder = (item, tableNumber) => {
    setOrders(prevOrders => {
      const currentOrders = { ...prevOrders };
      const tableOrders = currentOrders[tableNumber] || [];
  
      // Affiche les commandes actuelles pour la table
      console.log("Current orders for table", tableNumber, tableOrders);
  
      // Cherche si l'item est déjà présent dans les commandes
      const existingItem = tableOrders.find(order => order.name === item.name && order.status === "en cours");
  
      if (existingItem) {
        // Si l'item existe déjà, log et augmente la quantité
        console.log(`Item ${item.name} found, increasing quantity.`);
        existingItem.quantity += 1;
      } else {
        // Sinon, ajout de l'item
        console.log(`Adding item ${item.name} to orders.`);
        tableOrders.push({
          name: item.name,
          price: item.price,
          quantity: 1,
          status: "en cours" // Définir comme "en cours" par défaut
        });
      }
  
      // Mise à jour de l'état avec les nouvelles commandes pour la table
      currentOrders[tableNumber] = tableOrders;
      console.log("Updated orders for table", tableNumber, currentOrders[tableNumber]);
  
      return currentOrders; // Retourne les commandes mises à jour
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
