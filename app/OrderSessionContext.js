import { createContext, useState, useContext, useEffect } from "react";

const OrderSessionContext = createContext();

export const useOrderSession = () => useContext(OrderSessionContext);

export const OrderSessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const res = await fetch("/api/session");
      const data = await res.json();
      setSession(data);
    };
    fetchSession();
  }, []);

  const startSession = async () => {
    const res = await fetch("/api/session", { method: "POST" });
    const newSession = await res.json();
    setSession(newSession);
  };

  const addTable = async (tableNumber) => {
    if (!session) return;

    const updatedTables = [...session.tables, { number: tableNumber, items: [] }];
    const res = await fetch("/api/session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session._id, update: { tables: updatedTables } }),
    });

    const updatedSession = await res.json();
    setSession(updatedSession);
  };

  const addOrder = async (tableNumber, item) => {
    if (!session) return;

    const updatedTables = session.tables.map((table) =>
      table.number === tableNumber ? { ...table, items: [...table.items, item] } : table
    );

    const newProfit = session.profit + item.price;
    
    const res = await fetch("/api/session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session._id, update: { tables: updatedTables, profit: newProfit } }),
    });

    const updatedSession = await res.json();
    setSession(updatedSession);
  };

  const addPayment = async (paymentType, amount) => {
    if (!session) return;

    const updatedPayment = { ...session.payment, [paymentType]: session.payment[paymentType] + amount };

    const res = await fetch("/api/session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session._id, update: { payment: updatedPayment } }),
    });

    const updatedSession = await res.json();
    setSession(updatedSession);
  };

  return (
    <OrderSessionContext.Provider value={{ session, startSession, addTable, addOrder, addPayment }}>
      {children}
    </OrderSessionContext.Provider>
  );
};
