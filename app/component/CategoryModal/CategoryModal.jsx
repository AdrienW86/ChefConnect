"use client";

import { useEffect, useState } from "react";
import styles from './categoryModal.module.css';

export default function CategoryModal({ currentCategory, isCategoryModalOpen, setIsCategoryModalOpen, addItemToOrder }) {

  // Catégories d'articles
  const boissons = [
    { name: "Coca-cola", price: 5 },
    { name: "Soda", price: 4 },
    { name: "Perrier", price: 3 },
  ];

  const entrees = [
    { name: "Nems", price: 8 },
    { name: "Samoussa", price: 10 },
    { name: "Quiche", price: 5 },
  ];

  const plats = [
    { name: "Tartare", price: 18 },
    { name: "Dorade", price: 15 },
    { name: "Rumsteak", price: 20 },
  ];

  const desserts = [
    { name: "Crême catalane", price: 9 },
    { name: "Tiramisu", price: 10 },
    { name: "Mousse au chocolat", price: 7 },
  ];

  const menus = [
    { name: "menu découverte", price: 18 },
    { name: "Menu karaoké", price: 16 },
    { name: "Menu fondue chinoise", price: 24 },
  ];

  // Fonction pour récupérer les articles en fonction de la catégorie
  const getCurrentCategoryItems = () => {
    switch (currentCategory) {
      case "boissons":
        return boissons;
      case "entrees":
        return entrees;
      case "plats":
        return plats;
      case "desserts":
        return desserts;
      case "menus":
        return menus;
      default:
        return [];
    }
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false); // Ferme la modale des catégories
  };

  const handleAddItem = (item) => {
    // Appel de la fonction `addItemToOrder` avec l'élément à ajouter
    addItemToOrder(item);
    setIsCategoryModalOpen(false); // Ferme la modale après ajout
  };

  return (
    <div className={styles.categoryModal}>
      <div className={styles.categoryModalContent}>
        <button className={styles.closeBtn} onClick={closeCategoryModal}>X</button>
        <h3 className={styles.categoryTitle}>{currentCategory.toUpperCase()}</h3>
        <div className={styles.categoryItems}>
          {getCurrentCategoryItems().map((item, index) => (
            <div key={index} className={styles.item} onClick={() => handleAddItem(item)}>
              <span>{item.name} - {item.price}€</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

