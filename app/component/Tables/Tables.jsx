import { useState } from "react";
import styles from "./Tables.module.css";

export default function Tables({ tables, setTables, orders, setOrders }) {
  const [tableNumber, setTableNumber] = useState("");

  const openTable = () => {
    const num = parseInt(tableNumber, 10);
    if (isNaN(num) || tables.includes(num)) return alert("Table invalide.");
    setTables([...tables, num]);
    setOrders({ ...orders, [num]: [] });
  };

  const removeTable = (num) => {
    if (!tables.includes(num)) return;
    setTables(tables.filter((t) => t !== num));
    const updatedOrders = { ...orders };
    delete updatedOrders[num];
    setOrders(updatedOrders);
  };

  return (
    <div className={styles.tablesContainer}>
      <input 
        type="number" 
        value={tableNumber} 
        onChange={(e) => setTableNumber(e.target.value)}
        placeholder="Numéro de table"
      />
      <button onClick={openTable}>Ouvrir Table</button>

      <div className={styles.tableList}>
        {tables.map((table) => (
          <div key={table} className={styles.table}>
            Table {table}
            <button onClick={() => removeTable(table)}>✖</button>
          </div>
        ))}
      </div>
    </div>
  );
}
