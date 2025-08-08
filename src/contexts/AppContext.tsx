import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Order, Settings } from '../types';
import { subscribeToOrders, saveOrder, deleteOrderFromDB, updateOrderInDB, addNewOrder, getOrderById } from '../firebase/orderService';

interface AppContextType {
  orders: Order[];
  setOrders: (orders: Order[] | ((orders: Order[]) => Order[])) => void;
  addOrder: (newOrder: Omit<Order, 'id'>) => Promise<Order>;
  settings: Settings;
  setSettings: (settings: Settings | ((settings: Settings) => Settings)) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (authenticated: boolean) => void;
  deleteOrder: (id: string) => Promise<void>;
  updateOrder: (updatedOrder: Order) => Promise<void>;
  isOnline: boolean; // حالة الاتصال بالإنترنت
  isSyncing: boolean; // حالة المزامنة مع Firebase
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // استخدام useState بدلاً من useLocalStorage
  const [orders, setLocalOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    pinEnabled: false,
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // استرجاع الإعدادات من localStorage عند بدء التطبيق
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('al-ain-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      
      const savedAuth = localStorage.getItem('al-ain-auth');
      if (savedAuth) {
        setIsAuthenticated(JSON.parse(savedAuth));
      }
    } catch (error) {
      console.error('خطأ في استرجاع الإعدادات من localStorage:', error);
    }
  }, []);

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
      console.log('جاري الاتصال بـ Firebase والاشتراك في التغييرات...');
      
      const unsubscribe = subscribeToOrders((firebaseOrders) => {
        console.log('تم استلام تحديث من Firebase:', firebaseOrders.length, 'طلب');
        setLocalOrders(firebaseOrders);
        setIsSyncing(false);
      });

      return () => {
        console.log('إلغاء الاشتراك في تغييرات Firebase');
        unsubscribe();
      };
    } else {
      console.log('غير متصل بالإنترنت، لا يمكن الاشتراك في تغييرات Firebase');
    }
  }, [isOnline]);

  // حفظ الإعدادات في localStorage عند تغييرها
  useEffect(() => {
    try {
      localStorage.setItem('al-ain-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات في localStorage:', error);
    }
  }, [settings]);
  
  // حفظ حالة المصادقة في localStorage عند تغييرها
  useEffect(() => {
    try {
      localStorage.setItem('al-ain-auth', JSON.stringify(isAuthenticated));
    } catch (error) {
      console.error('خطأ في حفظ حالة المصادقة في localStorage:', error);
    }
  }, [isAuthenticated]);
  
  // دالة لإضافة طلب جديد
  const addOrder = async (newOrder: Omit<Order, 'id'>) => {
    if (!isOnline) {
      console.error('لا يمكن إضافة طلب جديد بدون اتصال بالإنترنت');
      throw new Error('لا يمكن إضافة طلب جديد بدون اتصال بالإنترنت');
    }
    
    try {
      setIsSyncing(true);
      const addedOrder = await addNewOrder(newOrder);
      // لا نحتاج لتحديث الحالة محلياً لأن Firebase ستقوم بإرسال التحديث عبر الاشتراك
      setIsSyncing(false);
      return addedOrder;
    } catch (error) {
      setIsSyncing(false);
      console.error('فشل في إضافة طلب جديد:', error);
      throw error;
    }
  };
  
  // دالة لتحديث الطلبات (لن تستخدم عادة لأن Firebase تقوم بالمزامنة تلقائياً)
  const setOrders = (ordersOrUpdater: Order[] | ((prevOrders: Order[]) => Order[])) => {
    // تحديث محلي أولاً
    setLocalOrders(ordersOrUpdater);
    
    // ثم مزامنة مع Firebase إذا كان متصلاً بالإنترنت
    if (isOnline) {
      const updatedOrders = typeof ordersOrUpdater === 'function' 
        ? ordersOrUpdater(orders)
        : ordersOrUpdater;
        
      // مزامنة كل طلب مع Firebase
      setIsSyncing(true);
      Promise.all(updatedOrders.map(order => saveOrder(order)))
        .then(() => {
          console.log('تمت مزامنة جميع الطلبات مع Firebase');
          setIsSyncing(false);
        })
        .catch(error => {
          console.error('فشل في مزامنة الطلبات مع Firebase:', error);
          setIsSyncing(false);
        });
    }
  };

  const deleteOrder = async (id: string) => {
    if (!isOnline) {
      console.error('لا يمكن حذف الطلب بدون اتصال بالإنترنت');
      throw new Error('لا يمكن حذف الطلب بدون اتصال بالإنترنت');
    }
    
    try {
      setIsSyncing(true);
      await deleteOrderFromDB(id);
      // لا نحتاج لتحديث الحالة محلياً لأن Firebase ستقوم بإرسال التحديث عبر الاشتراك
      setIsSyncing(false);
    } catch (error) {
      setIsSyncing(false);
      console.error('فشل في حذف الطلب من Firebase:', error);
      throw error;
    }
  };

  const updateOrder = async (updatedOrder: Order) => {
    console.log('AppContext: updateOrder called with:', updatedOrder.id);
    
    if (!isOnline) {
      console.error('لا يمكن تحديث الطلب بدون اتصال بالإنترنت');
      throw new Error('لا يمكن تحديث الطلب بدون اتصال بالإنترنت');
    }
    
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
      
      setIsSyncing(true);
      
      // التحقق من وجود الطلب في Firebase
      const existingOrder = await getOrderById(updatedOrder.id);
      if (!existingOrder) {
        setIsSyncing(false);
        console.error(`AppContext: Order with ID ${updatedOrder.id} not found in Firebase`);
        throw new Error(`الطلب برقم ${updatedOrder.id} غير موجود`);
      }
      
      // تحديث الطلب في Firebase
      await saveOrder(updatedOrder);
      console.log('AppContext: Order updated successfully in Firebase');
      
      // لا نحتاج لتحديث الحالة محلياً لأن Firebase ستقوم بإرسال التحديث عبر الاشتراك
      setIsSyncing(false);
    } catch (error) {
      setIsSyncing(false);
      console.error('AppContext: Error in updateOrder:', error);
      throw error; // إعادة رمي الخطأ ليتم التعامل معه في المكون
    }
  };

  return (
    <AppContext.Provider
      value={{
        orders,
        setOrders,
        addOrder, // إضافة دالة addOrder الجديدة
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