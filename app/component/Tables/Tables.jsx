import { useState } from "react";
import TableModal from "../TableModal/TableModal";
import styles from "./tables.module.css";

export default function Tables({ tables }) {

  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedTable, setSelectedTable] = useState(null); 
  const [currentCategory, setCurrentCategory] = useState(null); 

  const openModal = (table) => {
    setSelectedTable(table);  
    setIsModalOpen(true); 
    setCurrentCategory(null); 
  };

  return (
    <div className={styles.table}>
      <div className={styles.panneau}>
        {tables
          .sort((a, b) => a - b)  
          .map((table, index) => (
            <div 
              key={index} 
              className={styles.tableItem} 
              onClick={() => openModal(table)} 
            >
              Table {table}
            </div>
          ))
        }
      </div>
      {isModalOpen && selectedTable !== null && (
        <TableModal 
          selectedTable = {selectedTable}
          setIsModalOpen={setIsModalOpen} 
        />
      )}
    </div>
  );
}