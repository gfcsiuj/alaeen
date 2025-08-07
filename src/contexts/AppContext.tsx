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
    console.log('AppContext: updateOrder called with:', updatedOrder);
    console.log('AppContext: Current orders before update:', orders);
    
    try {
      // التحقق من وجود البيانات الأساسية
      if (!updatedOrder.id) {
        console.error('AppContext: Cannot update order - missing ID');
        throw new Error('معرف الطلب مفقود');
      }
      
      if (!updatedOrder.customerName) {
        console.error('AppContext: Cannot update order - missing customer name');
        throw new Error('اسم العميل مفقود');
      }
      
      if (!updatedOrder.serviceType) {
        console.error('AppContext: Cannot update order - missing service type');
        throw new Error('نوع الخدمة مفقود');
      }
      
      // البحث عن الطلب المراد تحديثه
      const orderExists = orders.some(order => order.id === updatedOrder.id);
      if (!orderExists) {
        console.error(`AppContext: Order with ID ${updatedOrder.id} not found`);
        throw new Error(`الطلب برقم ${updatedOrder.id} غير موجود`);
      }
      
      // العثور على الطلب الأصلي للمقارنة
      const originalOrder = orders.find(order => order.id === updatedOrder.id);
      console.log('AppContext: Original order:', originalOrder);
      
      // تحديث الطلب
      setOrders(prev => {
        const newOrders = prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        );
        console.log('AppContext: Updated orders:', newOrders);
        return newOrders;
      });
      
      console.log('AppContext: Order updated successfully');
    } catch (error) {
      console.error('AppContext: Error in updateOrder:', error);
      throw error; // إعادة رمي الخطأ ليتم التعامل معه في المكون
    }
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