"use client";

import { useState } from "react";
import styles from "./productManager.module.css";

export default function ProductManager({ category, onClose, onAddProduct, onDeleteProduct, onEditProduct }) {
  const [newProduct, setNewProduct] = useState({ name: "", price: "" });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editProductData, setEditProductData] = useState({ name: "", price: "" });

  const handleAdd = () => {
    const price = parseFloat(newProduct.price);
    if (!newProduct.name.trim() || isNaN(price)) return;
    onAddProduct({ name: newProduct.name.trim(), price });
    setNewProduct({ name: "", price: "" });
  };

  const handleEdit = (index) => {
    const price = parseFloat(editProductData.price);
    if (!editProductData.name.trim() || isNaN(price)) return;
    onEditProduct(index, { name: editProductData.name.trim(), price });
    setEditingIndex(null);
    setEditProductData({ name: "", price: "" });
  };

  return (
    <div className={styles.modal}>
      <div className={styles.card}>
        <h3 className={styles.title}>Produits de la catégorie : <strong>{category.name}</strong></h3>

        <div className={styles.newProduct}>
          <input
            className={styles.input}
            type="text"
            placeholder="Nom du produit"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <input
            className={styles.input}
            type="number"
            placeholder="Prix"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          />
          <button className={styles.button} onClick={handleAdd}>Ajouter</button>
        </div>

        <ul className={styles.list}>
          {category.products.map((product, index) => (
            <li key={index} className={styles.item}>
              {editingIndex === index ? (
                <>
                  <input
                    className={styles.input}
                    type="text"
                    value={editProductData.name}
                    onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })}
                  />
                  <input
                    className={styles.input}
                    type="number"
                    value={editProductData.price}
                    onChange={(e) => setEditProductData({ ...editProductData, price: e.target.value })}
                  />
                  <button className={styles.smallBtn} onClick={() => handleEdit(index)}>OK</button>
                  <button className={styles.smallBtn} onClick={() => setEditingIndex(null)}>Annuler</button>
                </>
              ) : (
                <>
                  <span>{product.name} — {product.price.toFixed(2)} €</span>
                  <div className={styles.actions}>
                    <button
                      className={styles.smallBtn}
                      onClick={() => {
                        setEditingIndex(index);
                        setEditProductData({ name: product.name, price: product.price });
                      }}
                    >
                      Modifier
                    </button>
                    <button className={styles.smallBtn} onClick={() => onDeleteProduct(index)}>Supprimer</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        <button className={styles.closeBtn} onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}


