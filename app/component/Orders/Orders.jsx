import { useState } from "react";
import TableModal from "../TableModal/TableModal";
import styles from "./orders.module.css";

export default function Orders({ orders, setOrders }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (table) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTable(null);
  };

  return (
    <div className={styles.ordersContainer}>
      <h3>Commandes en cours</h3>
      {Object.keys(orders).map((table) => {
        // Formatage du nombre d'articles pour chaque table
        const totalItems = orders[table].reduce((acc, item) => acc + item.quantity, 0);

        return (
          <div
            key={table}
            onClick={() => openModal(table)}
            className={styles.tableItem}
          >
            <span>Table {table}</span>
            <span>({totalItems} article{totalItems > 1 ? "s" : ""})</span>
          </div>
        );
      })}
      {isModalOpen && selectedTable !== null && (
        <TableModal
          table={selectedTable}
          orders={orders}
          setOrders={setOrders}
          closeModal={closeModal}
        />
      )}
    </div>
  );
}

