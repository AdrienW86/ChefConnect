"use client";

import React, { createContext, useContext, useState } from "react";

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);

  // Fonction pour fermer la session
  const closeSession = () => setSession(null);

  return (
    <SessionContext.Provider value={{ session, setSession, closeSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
