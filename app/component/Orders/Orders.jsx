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
      {Object.keys(orders).map((table) => (
        <div key={table} onClick={() => openModal(table)}>
          Table {table} ({orders[table].length} articles)
        </div>
      ))}
      {isModalOpen && selectedTable !== null && (
        <TableModal table={selectedTable} orders={orders} setOrders={setOrders} closeModal={closeModal} />
      )}
    </div>
  );
}
