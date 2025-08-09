import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Order, Settings } from '../types';
import { subscribeToOrders, saveOrder, deleteOrderFromDB, updateOrderInDB, addNewOrder, getOrderById } from '../firebase/orderService';
import { getAuth, signOut } from 'firebase/auth';
import { Payment, getAllPayments } from '../firebase/paymentService';

interface AppContextType {
  orders: Order[];
  setOrders: (orders: Order[] | ((orders: Order[]) => Order[])) => void;
  addOrder: (newOrder: Omit<Order, 'id'>) => Promise<Order>;
  payments: Payment[];
  setPayments: (payments: Payment[] | ((payments: Payment[]) => Payment[])) => void;
  refreshPayments: () => Promise<void>;
  settings: Settings;
  setSettings: (settings: Settings | ((settings: Settings) => Settings)) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (authenticated: boolean) => void;
  userRole: 'admin' | 'viewer' | null;
  setUserRole: (role: 'admin' | 'viewer' | null) => void;
  logout: () => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrder: (updatedOrder: Order) => Promise<void>;
  isOnline: boolean; // حالة الاتصال بالإنترنت
  isSyncing: boolean; // حالة المزامنة مع Firebase
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // استخدام useState بدلاً من useLocalStorage
  const [orders, setLocalOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    pinEnabled: false,
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'admin' | 'viewer' | null>(null);
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
      
      const savedRole = localStorage.getItem('al-ain-role');
      if (savedRole) {
        setUserRole(JSON.parse(savedRole));
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

  // تحميل المدفوعات عند بدء التطبيق
  useEffect(() => {
    if (isAuthenticated && userRole) {
      refreshPayments().catch(error => {
        console.error('فشل في تحميل المدفوعات عند بدء التطبيق:', error);
      });
    }
  }, [isAuthenticated, userRole]);

  // الاشتراك في التغييرات من Firebase مع آلية إعادة المحاولة
  useEffect(() => {
    if (isOnline) {
      setIsSyncing(true);
      console.log('جاري الاتصال بـ Firebase والاشتراك في التغييرات...');
      
      // إضافة مؤقت لإعادة تعيين حالة المزامنة في حالة استمرارها لفترة طويلة مع زيادة المهلة
      const syncTimeoutId = setTimeout(() => {
        if (isSyncing) {
          console.log('تم تجاوز وقت المزامنة، إعادة تعيين الحالة...');
          setIsSyncing(false);
        }
      }, 60000); // زيادة المهلة إلى 60 ثانية كحد أقصى للمزامنة
      
      // آلية إعادة المحاولة للاشتراك في التغييرات
      let subscribeAttempts = 0;
      const maxSubscribeAttempts = 3;
      let unsubscribeFunction: (() => void) | null = null;
      
      const attemptSubscribe = async () => {
        try {
          console.log(`محاولة الاشتراك ${subscribeAttempts + 1}/${maxSubscribeAttempts}...`);
          
          unsubscribeFunction = subscribeToOrders((firebaseOrders) => {
            console.log('تم استلام تحديث من Firebase:', firebaseOrders.length, 'طلب');
            setLocalOrders(firebaseOrders);
            setIsSyncing(false);
            clearTimeout(syncTimeoutId); // إلغاء المؤقت عند نجاح المزامنة
          });
          
          // إذا وصلنا إلى هنا، فقد نجحت عملية الاشتراك
          console.log('تم الاشتراك بنجاح في تغييرات Firebase');
        } catch (error) {
          subscribeAttempts++;
          console.warn(`فشلت المحاولة ${subscribeAttempts}/${maxSubscribeAttempts} للاشتراك:`, error);
          
          if (subscribeAttempts < maxSubscribeAttempts) {
            // الانتظار قبل إعادة المحاولة
            const retryDelay = 2000 * subscribeAttempts;
            console.log(`إعادة المحاولة بعد ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return attemptSubscribe(); // إعادة المحاولة
          } else {
            console.error('فشل في الاشتراك بعد عدة محاولات');
            setIsSyncing(false);
          }
        }
      };
      
      // بدء محاولات الاشتراك
      attemptSubscribe();

      return () => {
        console.log('إلغاء الاشتراك في تغييرات Firebase');
        clearTimeout(syncTimeoutId); // تنظيف المؤقت عند إلغاء الاشتراك
        if (unsubscribeFunction) {
          unsubscribeFunction();
        }
      };
    } else {
      console.log('غير متصل بالإنترنت، لا يمكن الاشتراك في تغييرات Firebase');
    }
  }, [isOnline, isSyncing]);

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
  
  // حفظ دور المستخدم في localStorage عند تغييره
  useEffect(() => {
    try {
      localStorage.setItem('al-ain-role', JSON.stringify(userRole));
    } catch (error) {
      console.error('خطأ في حفظ دور المستخدم في localStorage:', error);
    }
  }, [userRole]);
  
  // تحديث المدفوعات من Firebase
  const refreshPayments = async () => {
    try {
      setIsSyncing(true);
      console.log('جاري تحديث المدفوعات من Firebase...');
      
      // إضافة محاولات إعادة المحاولة للحصول على أحدث البيانات
      let attempts = 0;
      const maxAttempts = 3;
      let paymentsData = [];
      
      // محاولة استرجاع المدفوعات المخزنة محليًا كنسخة احتياطية
      try {
        const cachedPayments = localStorage.getItem('al-ain-payments');
        if (cachedPayments) {
          const parsedPayments = JSON.parse(cachedPayments);
          if (Array.isArray(parsedPayments) && parsedPayments.length > 0) {
            console.log(`تم استرجاع ${parsedPayments.length} دفعة من التخزين المحلي`);
            // تعيين المدفوعات المخزنة مؤقتًا بينما نحاول الحصول على البيانات المحدثة
            setPayments(parsedPayments);
          }
        }
      } catch (cacheError) {
        console.warn('خطأ في استرجاع المدفوعات من التخزين المحلي:', cacheError);
      }
      
      while (attempts < maxAttempts) {
        try {
          // إضافة تأخير قصير قبل جلب البيانات لضمان تحديث Firebase
          if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
          
          paymentsData = await getAllPayments();
          console.log(`تم الحصول على ${paymentsData.length} دفعة من Firebase بعد ${attempts + 1} محاولة`);
          break;
        } catch (fetchError) {
          attempts++;
          console.warn(`فشلت المحاولة ${attempts}/${maxAttempts} لتحديث المدفوعات:`, fetchError);
          
          if (attempts >= maxAttempts) {
            throw fetchError;
          }
        }
      }
      
      // تحديث حالة المدفوعات في السياق
      setPayments(paymentsData);
      
      // حفظ المدفوعات في التخزين المحلي كنسخة احتياطية
      try {
        localStorage.setItem('al-ain-payments', JSON.stringify(paymentsData));
        console.log(`تم تخزين ${paymentsData.length} دفعة في التخزين المحلي`);
      } catch (storageError) {
        console.warn('خطأ في تخزين المدفوعات في التخزين المحلي:', storageError);
      }
      
      // تأخير إضافي قبل إنهاء عملية التحديث
      // هذا يضمن اكتمال جميع العمليات قبل إعادة التحميل
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('تم تحديث المدفوعات بنجاح');
      return paymentsData;
    } catch (error) {
      console.error('خطأ في تحديث المدفوعات:', error);
      
      // محاولة استرجاع المدفوعات من التخزين المحلي في حالة الفشل
      try {
        const cachedPayments = localStorage.getItem('al-ain-payments-cache');
        if (cachedPayments) {
          const parsedPayments = JSON.parse(cachedPayments);
          console.log('تم استرجاع المدفوعات من التخزين المحلي:', parsedPayments.length);
          setPayments(parsedPayments);
          return parsedPayments;
        }
      } catch (cacheError) {
        console.error('فشل في استرجاع المدفوعات من التخزين المحلي:', cacheError);
      }
      
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // دالة لتسجيل الخروج
  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      setIsAuthenticated(false);
      setUserRole(null);
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      throw error;
    }
  };
  
  // دالة لإضافة طلب جديد
  const addOrder = async (newOrder: Omit<Order, 'id'>) => {
    if (!isOnline) {
      console.error('لا يمكن إضافة طلب جديد بدون اتصال بالإنترنت');
      throw new Error('لا يمكن إضافة طلب جديد بدون اتصال بالإنترنت');
    }
    
    try {
      setIsSyncing(true);
      console.log('بدء إضافة طلب جديد...');
      
      // إضافة مؤقت لإعادة تعيين حالة المزامنة في حالة استمرارها لفترة طويلة مع زيادة المهلة
      const syncTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('انتهت مهلة إضافة الطلب، يرجى المحاولة مرة أخرى'));
        }, 60000); // زيادة المهلة إلى 60 ثانية كحد أقصى للإضافة
      });
      
      // محاولات متعددة لإضافة الطلب
      let addAttempts = 0;
      const maxAddAttempts = 3;
      let addedOrder: Order | null = null;
      
      while (addAttempts < maxAddAttempts) {
        try {
          // استخدام Promise.race للتعامل مع حالة انتهاء المهلة
          addedOrder = await Promise.race([
            addNewOrder(newOrder),
            syncTimeoutPromise
          ]) as Order;
          
          console.log(`تم إضافة الطلب بنجاح بعد ${addAttempts + 1} محاولة`);
          break; // الخروج من الحلقة في حالة النجاح
        } catch (error) {
          addAttempts++;
          console.warn(`فشلت المحاولة ${addAttempts}/${maxAddAttempts} لإضافة الطلب:`, error);
          
          if (addAttempts >= maxAddAttempts) {
            throw new Error('فشل في إضافة الطلب بعد عدة محاولات');
          }
          
          // الانتظار قبل إعادة المحاولة
          await new Promise(resolve => setTimeout(resolve, 2000 * addAttempts));
          console.log(`إعادة المحاولة ${addAttempts + 1}/${maxAddAttempts} لإضافة الطلب...`);
        }
      }
      
      if (!addedOrder) {
        throw new Error('فشل في إضافة الطلب');
      }
      
      console.log('تم إضافة الطلب بنجاح مع المعرف:', addedOrder.id);
      // Let the real-time listener handle the update to prevent duplicates
      // setLocalOrders(prevOrders => [addedOrder, ...prevOrders]);
      setIsSyncing(false);
      return addedOrder;
    } catch (error) {
      setIsSyncing(false);
      console.error('فشل في إضافة طلب جديد:', error);
      throw error;
    }
  };
  
  // دالة لتحديث الطلبات مع آلية إعادة المحاولة
  const setOrders = (ordersOrUpdater: Order[] | ((prevOrders: Order[]) => Order[])) => {
    // تحديث محلي أولاً
    setLocalOrders(ordersOrUpdater);
    
    // ثم مزامنة مع Firebase إذا كان متصلاً بالإنترنت
    if (isOnline) {
      const updatedOrders = typeof ordersOrUpdater === 'function' 
        ? ordersOrUpdater(orders)
        : ordersOrUpdater;
        
      // مزامنة كل طلب مع Firebase مع آلية إعادة المحاولة
      setIsSyncing(true);
      
      // إضافة مؤقت لإعادة تعيين حالة المزامنة في حالة استمرارها لفترة طويلة
      const syncTimeoutId = setTimeout(() => {
        if (isSyncing) {
          console.log('تم تجاوز وقت مزامنة الطلبات، إعادة تعيين الحالة...');
          setIsSyncing(false);
        }
      }, 60000); // 60 ثانية كحد أقصى للمزامنة
      
      // وظيفة مساعدة لمزامنة طلب واحد مع إعادة المحاولة
      const syncOrderWithRetry = async (order: Order, maxAttempts = 3) => {
        let attempts = 0;
        
        while (attempts < maxAttempts) {
          try {
            await saveOrder(order);
            return true; // نجاح
          } catch (error) {
            attempts++;
            console.warn(`فشلت المحاولة ${attempts}/${maxAttempts} لمزامنة الطلب ${order.id}:`, error);
            
            if (attempts >= maxAttempts) {
              console.error(`فشل في مزامنة الطلب ${order.id} بعد ${maxAttempts} محاولات`);
              return false; // فشل بعد استنفاد جميع المحاولات
            }
            
            // الانتظار قبل إعادة المحاولة
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
            console.log(`إعادة المحاولة ${attempts + 1}/${maxAttempts} لمزامنة الطلب ${order.id}...`);
          }
        }
        
        return false; // لن يصل إلى هنا عادة، ولكن للتأكد من إرجاع قيمة
      };
      
      // مزامنة جميع الطلبات مع إعادة المحاولة
      Promise.all(updatedOrders.map(order => syncOrderWithRetry(order)))
        .then(results => {
          const successCount = results.filter(result => result).length;
          console.log(`تمت مزامنة ${successCount} من ${updatedOrders.length} طلب مع Firebase`);
          setIsSyncing(false);
          clearTimeout(syncTimeoutId);
        })
        .catch(error => {
          console.error('فشل في مزامنة الطلبات مع Firebase:', error);
          setIsSyncing(false);
          clearTimeout(syncTimeoutId);
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
      console.log('بدء حذف الطلب برقم:', id);
      
      // إضافة مؤقت لإعادة تعيين حالة المزامنة في حالة استمرارها لفترة طويلة مع زيادة المهلة
      const syncTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('انتهت مهلة حذف الطلب، يرجى المحاولة مرة أخرى'));
        }, 60000); // زيادة المهلة إلى 60 ثانية كحد أقصى للحذف
      });
      
      // محاولات متعددة لحذف الطلب
      let deleteAttempts = 0;
      const maxDeleteAttempts = 3;
      
      while (deleteAttempts < maxDeleteAttempts) {
        try {
          // حذف الطلب من Firebase مع مراعاة المهلة الزمنية
          await Promise.race([deleteOrderFromDB(id), syncTimeoutPromise]);
          console.log(`تم حذف الطلب بنجاح بعد ${deleteAttempts + 1} محاولة`);
          break; // الخروج من الحلقة في حالة النجاح
        } catch (error) {
          deleteAttempts++;
          console.warn(`فشلت المحاولة ${deleteAttempts}/${maxDeleteAttempts} لحذف الطلب:`, error);
          
          if (deleteAttempts >= maxDeleteAttempts) {
            throw new Error('فشل في حذف الطلب بعد عدة محاولات');
          }
          
          // الانتظار قبل إعادة المحاولة
          await new Promise(resolve => setTimeout(resolve, 2000 * deleteAttempts));
          console.log(`إعادة المحاولة ${deleteAttempts + 1}/${maxDeleteAttempts} لحذف الطلب...`);
        }
      }
      console.log('تم حذف الطلب بنجاح برقم:', id);
      
      // حذف الطلب محلياً للتحديث الفوري
      setLocalOrders(prevOrders => prevOrders.filter(order => order.id !== id));
      
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
      console.log('AppContext: بدء تحديث الطلب...');
      
      // إضافة مؤقت لإعادة تعيين حالة المزامنة في حالة استمرارها لفترة طويلة مع زيادة المهلة
      const syncTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('انتهت مهلة تحديث الطلب، يرجى المحاولة مرة أخرى'));
        }, 60000); // زيادة المهلة إلى 60 ثانية كحد أقصى للتحديث
      });
      
      // التحقق من وجود الطلب في Firebase مع مراعاة المهلة الزمنية
      const existingOrderPromise = getOrderById(updatedOrder.id);
      const existingOrder = await Promise.race([existingOrderPromise, syncTimeoutPromise]);
      
      if (!existingOrder) {
        setIsSyncing(false);
        console.error(`AppContext: Order with ID ${updatedOrder.id} not found in Firebase`);
        throw new Error(`الطلب برقم ${updatedOrder.id} غير موجود`);
      }
      
      // محاولات متعددة لتحديث الطلب
      let updateAttempts = 0;
      const maxUpdateAttempts = 3;
      
      while (updateAttempts < maxUpdateAttempts) {
        try {
          // تحديث الطلب في Firebase مع مراعاة المهلة الزمنية
          await Promise.race([saveOrder(updatedOrder), syncTimeoutPromise]);
          console.log(`تم تحديث الطلب بنجاح بعد ${updateAttempts + 1} محاولة`);
          break; // الخروج من الحلقة في حالة النجاح
        } catch (error) {
          updateAttempts++;
          console.warn(`فشلت المحاولة ${updateAttempts}/${maxUpdateAttempts} لتحديث الطلب:`, error);
          
          if (updateAttempts >= maxUpdateAttempts) {
            throw new Error('فشل في تحديث الطلب بعد عدة محاولات');
          }
          
          // الانتظار قبل إعادة المحاولة
          await new Promise(resolve => setTimeout(resolve, 2000 * updateAttempts));
          console.log(`إعادة المحاولة ${updateAttempts + 1}/${maxUpdateAttempts} لتحديث الطلب...`);
        }
      }
      console.log('AppContext: Order updated successfully in Firebase');
      
      // تحديث الطلب محلياً للتحديث الفوري
      setLocalOrders(prevOrders => {
        return prevOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        );
      });
      
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
        addOrder,
        payments,
        setPayments,
        refreshPayments,
        settings,
        setSettings,
        isAuthenticated,
        setIsAuthenticated,
        userRole,
        setUserRole,
        logout,
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