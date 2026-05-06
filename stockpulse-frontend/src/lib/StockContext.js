'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const StockContext = createContext(null);

export function StockProvider({ children }) {
  const [stockData, setStockData] = useState(null);

  const updateStockData = useCallback((data) => {
    setStockData(data);
  }, []);

  const clearStockData = useCallback(() => {
    setStockData(null);
  }, []);

  return (
    <StockContext.Provider value={{ stockData, updateStockData, clearStockData }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStockContext() {
  const ctx = useContext(StockContext);
  if (!ctx) {
    // Return a safe fallback if used outside provider
    return { stockData: null, updateStockData: () => {}, clearStockData: () => {} };
  }
  return ctx;
}
