// CategoryModal.jsx
"use client";

import styles from './categoryModal.module.css';

export default function CategoryModal({ currentCategory, setIsCategoryModalOpen, addItemToOrder }) {
  const products = currentCategory.products || [];

  const closeCategoryModal = () => setIsCategoryModalOpen(false);

  const handleAddItem = (item) => {
    addItemToOrder(item);
    console.log(item)
    setIsCategoryModalOpen(true)
  };

  return (
    <div className={styles.categoryModal}>
      <div className={styles.categoryModalContent}>
        <button className={styles.closeBtn} onClick={closeCategoryModal}>X</button>
        <h3 className={styles.categoryTitle}>{currentCategory.name.toUpperCase()}</h3>
        <div className={styles.categoryItems}>
          {products.map((item, index) => (
            <div key={index} className={styles.item} onClick={() => handleAddItem(item)}>
              <p>{item.name} <span className={styles.price}>{item.price}€</span> </p>             
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}