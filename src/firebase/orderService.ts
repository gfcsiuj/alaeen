import { ref, set, onValue, remove, update, get, push, DatabaseReference } from 'firebase/database';
import { db } from './config';
import { Order } from '../types';

// الحصول على مرجع لقائمة الطلبات
const ordersRef = ref(db, 'orders');

/**
 * حفظ طلب (إضافة أو تحديث طلب موجود)
 * @param order الطلب المراد حفظه
 * @returns وعد يتم حله عند اكتمال العملية
 */
export const saveOrder = async (order: Order): Promise<void> => {
  console.log('بدء حفظ الطلب في Firebase:', order.id);
  
  try {
    // التحقق من وجود معرف للطلب
    if (!order.id) {
      throw new Error('معرف الطلب مطلوب للحفظ');
    }
    
    // إضافة طابع زمني للتحديث
    const updatedOrder = {
      ...order,
      updatedAt: new Date().toISOString()
    };
    
    // إنشاء مرجع للطلب
    const orderRef = ref(db, `orders/${order.id}`);
    
    // حفظ الطلب في قاعدة البيانات مع مهلة زمنية
    console.log('جاري حفظ الطلب في Firebase...');
    
    // إنشاء وعد مع مهلة زمنية
    const savePromise = set(orderRef, updatedOrder);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة حفظ الطلب')), 15000);
    });
    
    await Promise.race([savePromise, timeoutPromise]);
    
    // التحقق من نجاح الحفظ
    const snapshot = await get(orderRef);
    if (!snapshot.exists()) {
      throw new Error('فشل في التحقق من حفظ الطلب');
    }
    
    console.log('تم حفظ الطلب بنجاح في Firebase:', order.id);
  } catch (error) {
    console.error('خطأ في حفظ الطلب:', error);
    throw error;
  }
};

/**
 * إضافة طلب جديد مع إنشاء معرف فريد
 * @param order الطلب المراد إضافته (بدون معرف)
 * @returns وعد يتم حله مع الطلب المضاف بمعرف جديد
 */
export const addNewOrder = async (order: Omit<Order, 'id'>): Promise<Order> => {
  console.log('بدء إضافة طلب جديد في Firebase...');
  
  try {
    // التحقق من البيانات الأساسية قبل الإضافة
    if (!order.customerName) {
      throw new Error('اسم العميل مطلوب لإضافة طلب جديد');
    }
    
    if (!order.serviceType) {
      throw new Error('نوع الخدمة مطلوب لإضافة طلب جديد');
    }
    
    // إنشاء مرجع جديد مع معرف فريد
    const newOrderRef = push(ordersRef);
    const newOrderId = newOrderRef.key;
    
    if (!newOrderId) {
      throw new Error('فشل في إنشاء معرف جديد للطلب');
    }
    
    console.log('تم إنشاء معرف جديد للطلب:', newOrderId);
    
    // إنشاء كائن الطلب الكامل مع المعرف الجديد
    const newOrder = { ...order, id: newOrderId } as Order;
    
    // إضافة طابع زمني للإنشاء إذا لم يكن موجوداً
    if (!newOrder.createdAt) {
      newOrder.createdAt = new Date().toISOString();
    }
    
    // حفظ الطلب في قاعدة البيانات
    console.log('جاري حفظ الطلب في Firebase...');
    await set(newOrderRef, newOrder);
    console.log('تم إضافة طلب جديد بنجاح في Firebase:', newOrderId);
    
    // التحقق من نجاح الإضافة
    const savedOrderRef = ref(db, `orders/${newOrderId}`);
    const snapshot = await get(savedOrderRef);
    
    if (!snapshot.exists()) {
      throw new Error('فشل في التحقق من إضافة الطلب');
    }
    
    console.log('تم التحقق من إضافة الطلب بنجاح');
    return newOrder;
  } catch (error) {
    console.error('خطأ في إضافة طلب جديد:', error);
    throw error;
  }
};

/**
 * حذف طلب من قاعدة البيانات
 * @param orderId معرف الطلب المراد حذفه
 * @returns وعد يتم حله عند اكتمال العملية
 */
export const deleteOrderFromDB = async (orderId: string): Promise<void> => {
  console.log('بدء حذف الطلب من Firebase:', orderId);
  
  try {
    // التحقق من وجود معرف الطلب
    if (!orderId) {
      throw new Error('معرف الطلب مطلوب للحذف');
    }
    
    // التحقق من وجود الطلب قبل الحذف
    const orderRef = ref(db, `orders/${orderId}`);
    
    // التحقق من وجود الطلب مع مهلة زمنية
    console.log('جاري التحقق من وجود الطلب...');
    const checkPromise = get(orderRef);
    const checkTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة التحقق من وجود الطلب')), 15000);
    });
    
    const snapshot = await Promise.race([checkPromise, checkTimeoutPromise]) as any;
    
    if (!snapshot.exists()) {
      console.warn(`الطلب برقم ${orderId} غير موجود للحذف`);
      return; // لا داعي لرمي خطأ إذا كان الطلب غير موجود أصلاً
    }
    
    // حذف الطلب من قاعدة البيانات مع مهلة زمنية
    console.log('جاري حذف الطلب من Firebase...');
    
    const deletePromise = remove(orderRef);
    const deleteTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة حذف الطلب')), 15000);
    });
    
    await Promise.race([deletePromise, deleteTimeoutPromise]);
    
    // التحقق من نجاح الحذف
    const verifyPromise = get(orderRef);
    const verifyTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة التحقق من حذف الطلب')), 15000);
    });
    
    const verifySnapshot = await Promise.race([verifyPromise, verifyTimeoutPromise]) as any;
    
    if (verifySnapshot.exists()) {
      throw new Error('فشل في حذف الطلب من قاعدة البيانات');
    }
    
    console.log('تم حذف الطلب بنجاح من Firebase:', orderId);
  } catch (error) {
    console.error('خطأ في حذف الطلب:', error);
    throw error;
  }
};

/**
 * الاشتراك في تحديثات الطلبات
 * @param callback دالة رد النداء التي سيتم استدعاؤها عند تغيير البيانات
 * @returns دالة لإلغاء الاشتراك
 */
export const subscribeToOrders = (callback: (orders: Order[]) => void): (() => void) => {
  console.log('بدء الاشتراك في تحديثات الطلبات...');
  
  // إنشاء مؤقت للتحقق من الاتصال
  let connectionTimeout: NodeJS.Timeout | null = null;
  
  // إعادة تعيين المؤقت
  const resetConnectionTimeout = () => {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
    
    connectionTimeout = setTimeout(() => {
      console.warn('انتهت مهلة انتظار البيانات من Firebase (15 ثانية)');
      callback([]); // استدعاء رد النداء بقائمة فارغة في حالة انتهاء المهلة
    }, 15000);
  };
  
  // بدء مؤقت الاتصال الأولي
  resetConnectionTimeout();
  
  try {
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      // إلغاء المؤقت عند استلام البيانات
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      try {
        console.log('تم استلام تحديث للطلبات من Firebase');
        const data = snapshot.val();
        const ordersList: Order[] = [];
        
        if (data) {
          // تحويل البيانات من كائن إلى مصفوفة
          Object.keys(data).forEach((key) => {
            ordersList.push(data[key]);
          });
          
          // ترتيب الطلبات حسب تاريخ الإنشاء (الأحدث أولاً)
          ordersList.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        }
        
        console.log(`تم استلام ${ordersList.length} طلب من Firebase`);
        callback(ordersList);
      } catch (processingError) {
        console.error('خطأ في معالجة بيانات الطلبات:', processingError);
        callback([]); // استدعاء رد النداء بقائمة فارغة في حالة حدوث خطأ
      }
    }, (error) => {
      console.error('خطأ في الاشتراك بالطلبات:', error);
      
      // إلغاء المؤقت في حالة حدوث خطأ
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      callback([]); // استدعاء رد النداء بقائمة فارغة في حالة حدوث خطأ
    });
    
    // تعديل دالة إلغاء الاشتراك لتنظيف المؤقت
    return () => {
      console.log('إلغاء الاشتراك في تحديثات الطلبات');
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      unsubscribe();
    };
  } catch (setupError) {
    console.error('خطأ في إعداد الاشتراك بالطلبات:', setupError);
    
    // إلغاء المؤقت في حالة حدوث خطأ في الإعداد
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    
    callback([]); // استدعاء رد النداء بقائمة فارغة في حالة حدوث خطأ
    
    // إرجاع دالة فارغة لإلغاء الاشتراك في حالة فشل الإعداد
    return () => {};
  }
};

/**
 * تحديث طلب موجود
 * @param orderId معرف الطلب المراد تحديثه
 * @param updates التحديثات المراد إجراؤها
 * @returns وعد يتم حله عند اكتمال العملية
 */
export const updateOrderInDB = async (orderId: string, updates: Partial<Order>): Promise<void> => {
  console.log('بدء تحديث الطلب في Firebase:', orderId);
  
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    
    // التحقق من وجود الطلب قبل التحديث مع مهلة زمنية
    console.log('جاري التحقق من وجود الطلب...');
    const checkPromise = get(orderRef);
    const checkTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة التحقق من وجود الطلب')), 15000);
    });
    
    const snapshot = await Promise.race([checkPromise, checkTimeoutPromise]) as any;
    
    if (!snapshot.exists()) {
      throw new Error(`الطلب برقم ${orderId} غير موجود للتحديث`);
    }
    
    // إضافة طابع زمني للتحديث
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // تحديث الطلب في قاعدة البيانات مع مهلة زمنية
    console.log('جاري تحديث الطلب في Firebase...');
    
    const updatePromise = update(orderRef, updatedData);
    const updateTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة تحديث الطلب')), 15000);
    });
    
    await Promise.race([updatePromise, updateTimeoutPromise]);
    
    console.log('تم تحديث الطلب بنجاح في Firebase:', orderId);
  } catch (error) {
    console.error('خطأ في تحديث الطلب:', error);
    throw error;
  }
};

/**
 * الحصول على طلب بواسطة المعرف
 * @param orderId معرف الطلب
 * @returns وعد يتم حله مع الطلب إذا وجد، أو null إذا لم يوجد
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  console.log('بدء البحث عن الطلب في Firebase:', orderId);
  
  try {
    // التحقق من وجود معرف الطلب
    if (!orderId) {
      throw new Error('معرف الطلب مطلوب للبحث');
    }
    
    const orderRef = ref(db, `orders/${orderId}`);
    
    // البحث عن الطلب مع مهلة زمنية
    console.log('جاري البحث عن الطلب...');
    
    const getPromise = get(orderRef);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة البحث عن الطلب')), 15000);
    });
    
    const snapshot = await Promise.race([getPromise, timeoutPromise]) as any;
    
    if (snapshot.exists()) {
      const orderData = snapshot.val() as Order;
      console.log(`تم العثور على الطلب برقم ${orderId}`);
      return orderData;
    } else {
      console.log(`الطلب برقم ${orderId} غير موجود`);
      return null;
    }
  } catch (error) {
    console.error('خطأ في الحصول على الطلب:', error);
    throw error;
  }
};