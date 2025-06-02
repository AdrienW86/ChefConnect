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
 async function addProduct(product) {
  if (!selectedCategoryId) {
    console.error("Aucune catégorie sélectionnée");
    return;
  }
  try {
    const res = await fetch(`/api/categories/${selectedCategoryId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,  // l'email de l'utilisateur connecté
        name: product.name,
        price: product.price,
        tva: product.tva ?? 0,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erreur inconnue");
    }

    const data = await res.json();

    // Met à jour la catégorie en local (à adapter selon ta réponse API)
    setCategories(categories.map(cat =>
      cat._id === selectedCategoryId ? data : cat
    ));
  } catch (error) {
    console.error("Erreur addProduct :", error.message);
  }
}

  // Dans ParamsCard.js (ou ProductManager.js), modifie deleteProduct et editProduct :

// Suppression produit
const deleteProduct = async (categoryId, productId) => {
  if (!categoryId) return;
  if (!confirm("Supprimer ce produit ?")) return;

  try {
    const res = await fetch(`/api/categories/${categoryId}/products/${productId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: user.email }),
    });

    if (!res.ok) {
      let errorMsg = "Erreur suppression produit";
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch {
        errorMsg = await res.text();
      }
      throw new Error(errorMsg);
    }

    setCategories(categories.map(cat => {
      if (cat._id === categoryId) {
        return {
          ...cat,
          products: cat.products.filter(p => p._id !== productId)
        };
      }
      return cat;
    }));

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};


// Modification produit
const editProduct = async (productId, newProduct) => {
  if (!newProduct.name.trim() || newProduct.price === undefined || isNaN(newProduct.price))
    return;
  if (!selectedCategory) return;

  try {
    const res = await fetch(`/api/categories/${selectedCategoryId}/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        name: newProduct.name.trim(),
        price: newProduct.price,
        tva: newProduct.tva ?? 0,
      }),
    });
    if (!res.ok) throw new Error("Erreur modification produit");

    const updatedProduct = await res.json();

    // Mettre à jour localement le produit modifié
    setCategories(categories.map(cat => {
      if (cat._id === selectedCategoryId) {
        return {
          ...cat,
          products: cat.products.map(p => p._id === productId ? updatedProduct : p),
        };
      }
      return cat;
    }));

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
                      className={styles.modifyBtnGreen}
                      onClick={() => handleEdit(cat._id)}
                    >
                      Enregistrer
                    </button>
                    <button
                      className={styles.modifyBtnRed}
                      onClick={() => setEditingId(null)}
                    >
                      Annuler
                    </button>
                  </section>
                ) : (
                  <section className={styles.card}>
                    <h3 className={styles.h3}>{cat.name}</h3>
                    <button
                      className={styles.catBtnGreen}
                      onClick={() => {
                        setEditingId(cat._id);
                        setEditedName(cat.name);
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      className={styles.catBtnRed}
                      onClick={() => handleDelete(cat._id)}
                    >
                      Supprimer
                    </button>
                    <button
                      className={styles.catBtnWhite}
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
  onDeleteProduct={deleteProduct} // On passe la fonction, pas l'appel
  onEditProduct={editProduct}
/>

          )}
        </>
      )}
    </div>
  );
}