import styles from "./tableModal.module.css";

export default function TableModal({ table, orders, setOrders, closeModal }) {
  const addItemToOrder = (item) => {
    setOrders((prevOrders) => {
      const updatedOrders = { ...prevOrders };
      updatedOrders[table] = [...(updatedOrders[table] || []), item];
      return updatedOrders;
    });
  };

  const removeItemFromOrder = (index) => {
    setOrders((prevOrders) => {
      const updatedOrders = { ...prevOrders };
      updatedOrders[table].splice(index, 1);
      return updatedOrders;
    });
  };

  return (
    <div className={styles.modal}>
      <button onClick={closeModal}>X</button>
      <h3>Table {table}</h3>
      <ul>
        {orders[table]?.map((item, index) => (
          <li key={index}>
            {item.name} - {item.price}€
            <button onClick={() => removeItemFromOrder(index)}>✖</button>
          </li>
        ))}
      </ul>
      <button onClick={() => addItemToOrder({ name: "Coca", price: 5 })}>Ajouter Coca</button>
    </div>
  );
}
