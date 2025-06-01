"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/app/Context/UserContext";
import ProductManager from "@/app/component/ProductManager/ProductManager";
import styles from "./paramsCard.module.css";

export default function ParamsCard({ onClose }) {
  const { user, loading } = useUser();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Charger les catégories dès que user est disponible
  useEffect(() => {
    if (!user || loading) return;

    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `/api/categories?email=${encodeURIComponent(user.email)}`
        );
        if (!res.ok) throw new Error("Erreur de récupération");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Erreur fetch catégories:", err);
      }
    };

    fetchCategories();
  }, [user, loading]);

  const selectedCategory = categories.find(
    (cat) => cat._id === selectedCategoryId
  );

  // Création catégorie
  const handleCreate = async () => {
    if (!newCategory.trim()) return alert("Le nom de la catégorie est requis");

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory, email: user.email }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      setCategories((prev) => [...prev, data.category]);
      setNewCategory("");
    } catch (err) {
      console.error("Erreur création catégorie :", err.message);
    }
  };

 // Suppression catégorie
const handleDelete = async (id) => {
  if (!confirm("Supprimer cette catégorie ?")) return;

  try {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: user.email }), // <-- fournis l'email ici
    });

    if (!res.ok) throw new Error("Erreur suppression catégorie");

    setCategories(categories.filter((cat) => cat._id !== id));
    if (selectedCategoryId === id) setSelectedCategoryId(null);
  } catch (err) {
    console.error(err);
  }
};


 const handleEdit = async (id) => {
  if (!editedName.trim()) return alert("Le nom de la catégorie est requis");

  try {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: user.email,    
        name: editedName.trim(),
      }),
    });

    if (!res.ok) throw new Error("Erreur modification catégorie");

    const updatedCat = await res.json();

    setCategories(categories.map(cat =>
      cat._id === id ? updatedCat : cat
    ));
    
    setEditingId(null);
    setEditedName("");
  } catch (err) {
    console.error(err);
  }
};



  // Gestion produits (passée au composant ProductManager)
  const addProduct = async (product) => {
    if (!product.name.trim() || product.price === undefined || isNaN(product.price))
      return;
    if (!selectedCategory) return;

    try {
      const updatedProducts = [...selectedCategory.products, product];
      const res = await fetch(`/api/categories/${selectedCategoryId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts }),
      });
      if (!res.ok) throw new Error("Erreur ajout produit");
      const updatedCat = await res.json();
      setCategories(
        categories.map((cat) =>
          cat._id === selectedCategoryId ? updatedCat : cat
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (index) => {
    if (!selectedCategory) return;
    try {
      const updatedProducts = selectedCategory.products.filter(
        (_, i) => i !== index
      );
      const res = await fetch(`/api/categories/${selectedCategoryId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts }),
      });
      if (!res.ok) throw new Error("Erreur suppression produit");
      const updatedCat = await res.json();
      setCategories(
        categories.map((cat) =>
          cat._id === selectedCategoryId ? updatedCat : cat
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const editProduct = async (index, newProduct) => {
    if (!newProduct.name.trim() || newProduct.price === undefined || isNaN(newProduct.price))
      return;
    if (!selectedCategory) return;

    try {
      const updatedProducts = selectedCategory.products.map((prod, i) =>
        i === index ? newProduct : prod
      );
      const res = await fetch(`/api/categories/${selectedCategoryId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts }),
      });
      if (!res.ok) throw new Error("Erreur modification produit");
      const updatedCat = await res.json();
      setCategories(
        categories.map((cat) =>
          cat._id === selectedCategoryId ? updatedCat : cat
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const closeProductModal = () => {
    setSelectedCategoryId(null);
  };

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} onClick={onClose}>
        X
      </button>
      <h2 className={styles.h2}>Gestion des Catégories</h2>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div className={styles.input}>
            <input
              className={styles.add}
              type="text"
              placeholder="Nouvelle catégorie"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button className={styles.btn} onClick={handleCreate}>
              Ajouter
            </button>
          </div>

          <ul className={styles.ul}>
            {categories.map((cat) => (
              <li className={styles.li} key={cat._id}>
                {editingId === cat._id ? (
                  <section className={styles.modifyCard}>
                    <input
                      className={styles.modifyInput}
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                    <button
                      className={styles.modifyBtn}
                      onClick={() => handleEdit(cat._id)}
                    >
                      Enregistrer
                    </button>
                    <button
                      className={styles.modifyBtn}
                      onClick={() => setEditingId(null)}
                    >
                      Annuler
                    </button>
                  </section>
                ) : (
                  <section className={styles.card}>
                    <h3 className={styles.h3}>{cat.name}</h3>
                    <button
                      className={styles.catBtn}
                      onClick={() => {
                        setEditingId(cat._id);
                        setEditedName(cat.name);
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      className={styles.catBtn}
                      onClick={() => handleDelete(cat._id)}
                    >
                      Supprimer
                    </button>
                    <button
                      className={styles.catBtn}
                      onClick={() => setSelectedCategoryId(cat._id)}
                    >
                      Voir les produits
                    </button>
                  </section>
                )}
              </li>
            ))}
          </ul>

          {selectedCategory && (
            <ProductManager
              category={selectedCategory}
              onClose={closeProductModal}
              onAddProduct={addProduct}
              onDeleteProduct={deleteProduct}
              onEditProduct={editProduct}
            />
          )}
        </>
      )}
    </div>
  );
}