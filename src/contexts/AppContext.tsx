import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Order, Settings } from '../types';
import { subscribeToOrders, saveOrder, deleteOrderFromDB, updateOrderInDB } from '../firebase/orderService';

interface AppContextType {
  orders: Order[];
  setOrders: (orders: Order[] | ((orders: Order[]) => Order[])) => void;
  settings: Settings;
  setSettings: (settings: Settings | ((settings: Settings) => Settings)) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (authenticated: boolean) => void;
  deleteOrder: (id: string) => void;
  updateOrder: (updatedOrder: Order) => void;
  isOnline: boolean; // حالة الاتصال بالإنترنت
  isSyncing: boolean; // حالة المزامنة مع Firebase
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [orders, setLocalOrders] = useLocalStorage<Order[]>('al-ain-orders', []);
  const [settings, setSettings] = useLocalStorage<Settings>('al-ain-settings', {
    theme: 'light',
    pinEnabled: false,
  });
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('al-ain-auth', true);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // تتبع حالة الاتصال بالإنترنت
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // الاشتراك في التغييرات من Firebase
  useEffect(() => {
    if (isOnline) {
      setIsSyncing(true);
      const unsubscribe = subscribeToOrders((firebaseOrders) => {
        console.log('تم استلام تحديث من Firebase:', firebaseOrders);
        setLocalOrders(firebaseOrders);
        setIsSyncing(false);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isOnline]);

  // دالة لتحديث الطلبات محلياً وفي Firebase
  const setOrders = (ordersOrUpdater: Order[] | ((prevOrders: Order[]) => Order[])) => {
    // تحديث محلي أولاً
    setLocalOrders(ordersOrUpdater);
    
    // ثم مزامنة مع Firebase إذا كان متصلاً بالإنترنت
    if (isOnline) {
      const updatedOrders = typeof ordersOrUpdater === 'function' 
        ? ordersOrUpdater(orders)
        : ordersOrUpdater;
        
      // مزامنة كل طلب مع Firebase
      updatedOrders.forEach(order => {
        saveOrder(order).catch(error => {
          console.error('فشل في مزامنة الطلب مع Firebase:', error);
        });
      });
    }
  };

  const deleteOrder = (id: string) => {
    // حذف محلي
    setLocalOrders(prev => prev.filter(order => order.id !== id));
    
    // حذف من Firebase إذا كان متصلاً بالإنترنت
    if (isOnline) {
      deleteOrderFromDB(id).catch(error => {
        console.error('فشل في حذف الطلب من Firebase:', error);
      });
    }
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
      
      // تحديث الطلب محلياً
      setLocalOrders(prev => {
        const newOrders = prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        );
        console.log('AppContext: Updated orders locally:', newOrders);
        return newOrders;
      });
      
      // تحديث الطلب في Firebase إذا كان متصلاً بالإنترنت
      if (isOnline) {
        saveOrder(updatedOrder).then(() => {
          console.log('AppContext: Order updated successfully in Firebase');
        }).catch(error => {
          console.error('AppContext: Error updating order in Firebase:', error);
        });
      }
      
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
        isOnline,
        isSyncing,
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