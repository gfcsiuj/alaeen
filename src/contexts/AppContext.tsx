import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Order, Settings } from '../types';

interface AppContextType {
  orders: Order[];
  setOrders: (orders: Order[] | ((orders: Order[]) => Order[])) => void;
  settings: Settings;
  setSettings: (settings: Settings | ((settings: Settings) => Settings)) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (authenticated: boolean) => void;
  deleteOrder: (id: string) => void;
  updateOrder: (updatedOrder: Order) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useLocalStorage<Order[]>('al-ain-orders', []);
  const [settings, setSettings] = useLocalStorage<Settings>('al-ain-settings', {
    theme: 'light',
    pinEnabled: false,
  });
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('al-ain-auth', true);

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
  };

  return (
    <AppContext.Provider
      value={{
        orders,
        setOrders,
        settings,
        setSettings,
        isAuthenticated,
        setIsAuthenticated,
        deleteOrder,
        updateOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}