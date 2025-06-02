"use client";

import { useState } from "react";
import styles from "./productManager.module.css";

export default function ProductManager({ category, onClose, onAddProduct, onDeleteProduct, onEditProduct }) {
  const [newProduct, setNewProduct] = useState({ name: "", price: "", tva: "" });
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProductData, setEditProductData] = useState({ name: "", price: "", tva: "" });

  const handleAdd = () => {
    const price = parseFloat(newProduct.price);
    const tva = parseFloat(newProduct.tva);
    if (!newProduct.name.trim() || isNaN(price) || isNaN(tva)) return;
    onAddProduct({ name: newProduct.name.trim(), price, tva });
    setNewProduct({ name: "", price: "", tva: "" });
  };

  const handleEdit = (productId) => {
    const price = parseFloat(editProductData.price);
    const tva = parseFloat(editProductData.tva);
    if (!editProductData.name.trim() || isNaN(price) || isNaN(tva)) return;
    onEditProduct(productId, { name: editProductData.name.trim(), price, tva });
    setEditingProductId(null);
    setEditProductData({ name: "", price: "", tva: "" });
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
          <input
            className={styles.input}
            type="number"
            placeholder="TVA (%)"
            value={newProduct.tva}
            onChange={(e) => setNewProduct({ ...newProduct, tva: e.target.value })}
          />
          <button className={styles.button} onClick={handleAdd}>Ajouter</button>
        </div>

        <ul className={styles.list}>
          {category.products.map((product) => (
            <li key={product._id} className={styles.item}>
              {editingProductId === product._id ? (
                <>
                  <input
                    className={styles.input2}
                    type="text"
                    value={editProductData.name}
                    onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })}
                  />
                  <input
                    className={styles.input2}
                    type="number"
                    value={editProductData.price}
                    onChange={(e) => setEditProductData({ ...editProductData, price: e.target.value })}
                  />
                  <input
                    className={styles.input2}
                    type="number"
                    value={editProductData.tva}
                    onChange={(e) => setEditProductData({ ...editProductData, tva: e.target.value })}
                  />
                 <div className={styles.btnDiv}>
                   <button className={styles.smallBtnGreen} onClick={() => handleEdit(product._id)}>Valider</button>
                    <button className={styles.smallBtnRed} onClick={() => setEditingProductId(null)}>Annuler</button>
                 </div>
                </>
              ) : (
                <>
                  <p className={styles.productHeader}>{product.name}  <span className={styles.price}>{product.price.toFixed(2)} € </span></p>
                  <p className={styles.productHeader}> TVA : <span className={styles.tva}> {product.tva.toFixed(2)}%</span></p>
                  <div className={styles.actions}>
                    <button
                      className={styles.smallBtnGreen}
                      onClick={() => {
                        setEditingProductId(product._id);
                        setEditProductData({
                          name: product.name,
                          price: product.price,
                          tva: product.tva,
                        });
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      className={styles.smallBtnRed}
                      onClick={() => onDeleteProduct(category._id, product._id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        <button className={styles.closeBtn} onClick={onClose}>X</button>
      </div>
    </div>
  );
}

