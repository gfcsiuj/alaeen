import { ref, set, onValue, remove, update, get, push, DatabaseReference } from 'firebase/database';
import { db } from './config';
import { Order } from '../types';

/**
 * حذف جميع الطلبات من قاعدة البيانات
 * @returns وعد يتم حله عند اكتمال العملية
 */
export const deleteAllOrders = async (): Promise<void> => {
  console.log('بدء حذف جميع الطلبات من Firebase');
  
  try {
    // الحصول على مرجع لجميع الطلبات
    const ordersRef = getOrdersRef();
    
    // حذف جميع الطلبات مع مهلة زمنية
    const deletePromise = remove(ordersRef);
    const deleteTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة حذف جميع الطلبات')), 60000);
    });
    
    // محاولات إعادة المحاولة في حالة الفشل
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await Promise.race([deletePromise, deleteTimeoutPromise]);
        console.log(`تم حذف جميع الطلبات بنجاح بعد ${attempts + 1} محاولة`);
        
        // التحقق من نجاح الحذف
        const verifyPromise = get(ordersRef);
        const verifyTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('انتهت مهلة التحقق من حذف جميع الطلبات')), 30000);
        });
        
        const verifySnapshot = await Promise.race([verifyPromise, verifyTimeoutPromise]) as any;
        
        if (verifySnapshot.exists()) {
          throw new Error('فشل في حذف جميع الطلبات - لا تزال الطلبات موجودة');
        }
        
        return;
      } catch (error) {
        attempts++;
        console.warn(`فشلت المحاولة ${attempts}/${maxAttempts} لحذف جميع الطلبات:`, error);
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      }
    }
    
    throw new Error('فشل في حذف جميع الطلبات بعد عدة محاولات');
  } catch (error) {
    console.error('خطأ في حذف جميع الطلبات:', error);
    throw error;
  }
};

// الحصول على مرجع لقائمة الطلبات
let ordersRef;

// دالة للحصول على مرجع الطلبات مع التأكد من صحة الاتصال
const getOrdersRef = () => {
  try {
    // إعادة تهيئة المرجع في كل مرة للتأكد من استخدام أحدث اتصال بقاعدة البيانات
    ordersRef = ref(db, 'orders');
    return ordersRef;
  } catch (error) {
    console.error('خطأ في الحصول على مرجع الطلبات:', error);
    throw new Error('فشل في الاتصال بقاعدة بيانات Firebase');
  }
};

// تهيئة مرجع الطلبات
ordersRef = getOrdersRef();

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
    
    // الحصول على مرجع محدث لقاعدة البيانات
    let orderRef;
    let savePromise;
    let timeoutPromise;
    
    try {
      // إنشاء مرجع للطلب
      orderRef = ref(db, `orders/${order.id}`);
      
      // حفظ الطلب في قاعدة البيانات مع مهلة زمنية
      console.log('جاري حفظ الطلب في Firebase...');
    } catch (refError) {
      console.error('خطأ في إنشاء مرجع الطلب:', refError);
      throw new Error('فشل في الاتصال بقاعدة بيانات Firebase');
    }
    
    // إنشاء وعد مع مهلة زمنية أطول
    savePromise = set(orderRef, updatedOrder);
    timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة حفظ الطلب')), 90000); // زيادة المهلة إلى 90 ثانية
    });
    
    // محاولات إعادة المحاولة في حالة الفشل
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await Promise.race([savePromise, timeoutPromise]);
        console.log(`تم حفظ الطلب بنجاح بعد ${attempts + 1} محاولة`);
        break; // الخروج من الحلقة في حالة النجاح
      } catch (error) {
        attempts++;
        console.warn(`فشلت المحاولة ${attempts}/${maxAttempts} لحفظ الطلب:`, error);
        
        if (attempts >= maxAttempts) {
          throw error; // إعادة رمي الخطأ بعد استنفاد جميع المحاولات
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        console.log(`إعادة المحاولة ${attempts + 1}/${maxAttempts} لحفظ الطلب...`);
      }
    }
    
    // التحقق من نجاح الحفظ مع مهلة زمنية أطول ومحاولات متعددة
    let verifyAttempts = 0;
    const maxVerifyAttempts = 3;
    let snapshot: any = null;
    
    while (verifyAttempts < maxVerifyAttempts) {
      try {
        const checkPromise = get(orderRef);
        const checkTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('انتهت مهلة التحقق من حفظ الطلب')), 60000); // زيادة المهلة إلى 60 ثانية
        });
        
        snapshot = await Promise.race([checkPromise, checkTimeoutPromise]) as any;
        
        if (snapshot.exists()) {
          console.log(`تم التحقق من حفظ الطلب بنجاح بعد ${verifyAttempts + 1} محاولة`);
          break; // الخروج من الحلقة في حالة النجاح
        } else {
          throw new Error('الطلب غير موجود في قاعدة البيانات');
        }
      } catch (error) {
        verifyAttempts++;
        console.warn(`فشلت المحاولة ${verifyAttempts}/${maxVerifyAttempts} للتحقق من حفظ الطلب:`, error);
        
        if (verifyAttempts >= maxVerifyAttempts) {
          throw new Error('فشل في التحقق من حفظ الطلب بعد عدة محاولات');
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * verifyAttempts));
        console.log(`إعادة المحاولة ${verifyAttempts + 1}/${maxVerifyAttempts} للتحقق من حفظ الطلب...`);
      }
    }
    
    if (!snapshot || !snapshot.exists()) {
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
    
    // الحصول على مرجع محدث للطلبات
    const currentOrdersRef = getOrdersRef();
    
    // إنشاء مرجع جديد مع معرف فريد
    const newOrderRef = push(currentOrdersRef);
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
    
    // حفظ الطلب في قاعدة البيانات مع مهلة زمنية
    console.log('جاري حفظ الطلب في Firebase...');
    
    // إنشاء وعد للحفظ مع مهلة زمنية أطول ومحاولات متعددة
    const savePromise = set(newOrderRef, newOrder);
    const saveTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة حفظ الطلب الجديد')), 60000); // زيادة المهلة إلى 60 ثانية
    });
    
    // محاولات إعادة المحاولة في حالة الفشل
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await Promise.race([savePromise, saveTimeoutPromise]);
        console.log(`تم حفظ الطلب الجديد بنجاح بعد ${attempts + 1} محاولة`);
        break; // الخروج من الحلقة في حالة النجاح
      } catch (error) {
        attempts++;
        console.warn(`فشلت المحاولة ${attempts}/${maxAttempts} لحفظ الطلب الجديد:`, error);
        
        if (attempts >= maxAttempts) {
          throw error; // إعادة رمي الخطأ بعد استنفاد جميع المحاولات
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        console.log(`إعادة المحاولة ${attempts + 1}/${maxAttempts} لحفظ الطلب الجديد...`);
      }
    }
    
    console.log('تم إضافة طلب جديد بنجاح في Firebase:', newOrderId);
    
    // التحقق من نجاح الإضافة مع مهلة زمنية أطول ومحاولات متعددة
    const savedOrderRef = ref(db, `orders/${newOrderId}`);
    
    // محاولات متعددة للتحقق
    let verifyAttempts = 0;
    const maxVerifyAttempts = 3;
    let snapshot: any = null;
    
    while (verifyAttempts < maxVerifyAttempts) {
      try {
        const checkPromise = get(savedOrderRef);
        const verifyTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('انتهت مهلة التحقق من إضافة الطلب')), 60000); // زيادة المهلة إلى 60 ثانية
        });
        
        snapshot = await Promise.race([checkPromise, verifyTimeoutPromise]) as any;
        
        if (snapshot.exists()) {
          console.log(`تم التحقق من إضافة الطلب الجديد بنجاح بعد ${verifyAttempts + 1} محاولة`);
          break; // الخروج من الحلقة في حالة النجاح
        } else {
          throw new Error('الطلب الجديد غير موجود في قاعدة البيانات');
        }
      } catch (error) {
        verifyAttempts++;
        console.warn(`فشلت المحاولة ${verifyAttempts}/${maxVerifyAttempts} للتحقق من إضافة الطلب الجديد:`, error);
        
        if (verifyAttempts >= maxVerifyAttempts) {
          throw new Error('فشل في التحقق من إضافة الطلب الجديد بعد عدة محاولات');
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * verifyAttempts));
        console.log(`إعادة المحاولة ${verifyAttempts + 1}/${maxVerifyAttempts} للتحقق من إضافة الطلب الجديد...`);
      }
    }
    
    if (!snapshot || !snapshot.exists()) {
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
    
    // التحقق من وجود الطلب قبل الحذف مع محاولات متعددة
    const orderRef = ref(db, `orders/${orderId}`);
    
    // محاولات متعددة للتحقق
    let checkAttempts = 0;
    const maxCheckAttempts = 3;
    let snapshot: any = null;
    
    while (checkAttempts < maxCheckAttempts) {
      try {
        const checkPromise = get(orderRef);
        const checkTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('انتهت مهلة التحقق من وجود الطلب')), 60000); // زيادة المهلة إلى 60 ثانية
        });
        
        snapshot = await Promise.race([checkPromise, checkTimeoutPromise]) as any;
        
        if (snapshot.exists()) {
          console.log(`تم التحقق من وجود الطلب بنجاح بعد ${checkAttempts + 1} محاولة`);
          break; // الخروج من الحلقة في حالة النجاح
        } else {
          console.warn(`الطلب برقم ${orderId} غير موجود للحذف`);
          return; // لا داعي لرمي خطأ إذا كان الطلب غير موجود أصلاً
        }
      } catch (error) {
        checkAttempts++;
        console.warn(`فشلت المحاولة ${checkAttempts}/${maxCheckAttempts} للتحقق من وجود الطلب:`, error);
        
        if (checkAttempts >= maxCheckAttempts) {
          throw new Error('فشل في التحقق من وجود الطلب بعد عدة محاولات');
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * checkAttempts));
        console.log(`إعادة المحاولة ${checkAttempts + 1}/${maxCheckAttempts} للتحقق من وجود الطلب...`);
      }
    }
    
    // حذف الطلب من قاعدة البيانات مع مهلة زمنية
    console.log('جاري حذف الطلب من Firebase...');
    
    const deletePromise = remove(orderRef);
    const deleteTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة حذف الطلب')), 30000);
    });
    
    await Promise.race([deletePromise, deleteTimeoutPromise]);
    
    // التحقق من نجاح الحذف مع محاولات متعددة
    let verifyAttempts = 0;
    const maxVerifyAttempts = 3;
    let verifySnapshot: any = null;
    
    while (verifyAttempts < maxVerifyAttempts) {
      try {
        const verifyPromise = get(orderRef);
        const verifyTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('انتهت مهلة التحقق من حذف الطلب')), 60000); // زيادة المهلة إلى 60 ثانية
        });
        
        verifySnapshot = await Promise.race([verifyPromise, verifyTimeoutPromise]) as any;
        
        if (!verifySnapshot.exists()) {
          console.log(`تم التحقق من نجاح حذف الطلب بعد ${verifyAttempts + 1} محاولة`);
          break; // الخروج من الحلقة في حالة النجاح
        } else {
          throw new Error('الطلب لا يزال موجود في قاعدة البيانات');
        }
      } catch (error) {
        verifyAttempts++;
        console.warn(`فشلت المحاولة ${verifyAttempts}/${maxVerifyAttempts} للتحقق من نجاح الحذف:`, error);
        
        if (verifyAttempts >= maxVerifyAttempts) {
          throw new Error('فشل في التحقق من نجاح حذف الطلب بعد عدة محاولات');
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * verifyAttempts));
        console.log(`إعادة المحاولة ${verifyAttempts + 1}/${maxVerifyAttempts} للتحقق من نجاح الحذف...`);
      }
    }
    
    if (verifySnapshot && verifySnapshot.exists()) {
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
  
  // إنشاء مؤقت للتحقق من الاتصال مع زيادة المهلة
  let connectionTimeout: NodeJS.Timeout | null = null;
  let connectionAttempts = 0;
  const maxConnectionAttempts = 3;
  
  // إعادة تعيين المؤقت مع محاولات إعادة الاتصال
  const resetConnectionTimeout = () => {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
    
    connectionTimeout = setTimeout(() => {
      console.warn(`انتهت مهلة انتظار البيانات من Firebase (60 ثانية) - المحاولة ${connectionAttempts + 1}/${maxConnectionAttempts}`);
      
      connectionAttempts++;
      if (connectionAttempts < maxConnectionAttempts) {
        console.log(`إعادة محاولة الاتصال بـ Firebase (${connectionAttempts + 1}/${maxConnectionAttempts})...`);
        resetConnectionTimeout(); // إعادة تعيين المؤقت للمحاولة التالية
      } else {
        console.error('فشلت جميع محاولات الاتصال بـ Firebase');
        callback([]); // استدعاء رد النداء بقائمة فارغة بعد استنفاد جميع المحاولات
        connectionAttempts = 0; // إعادة تعيين العداد للمحاولات المستقبلية
      }
    }, 60000); // زيادة المهلة إلى 60 ثانية
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
    
    // التحقق من وجود الطلب قبل التحديث مع محاولات متعددة
    console.log('جاري التحقق من وجود الطلب...');
    
    // محاولات متعددة للتحقق
    let checkAttempts = 0;
    const maxCheckAttempts = 3;
    let snapshot: any = null;
    
    while (checkAttempts < maxCheckAttempts) {
      try {
        const checkPromise = get(orderRef);
        const checkTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('انتهت مهلة التحقق من وجود الطلب')), 60000); // زيادة المهلة إلى 60 ثانية
        });
        
        snapshot = await Promise.race([checkPromise, checkTimeoutPromise]) as any;
        
        if (snapshot.exists()) {
          console.log(`تم التحقق من وجود الطلب بنجاح بعد ${checkAttempts + 1} محاولة`);
          break; // الخروج من الحلقة في حالة النجاح
        } else {
          throw new Error(`الطلب برقم ${orderId} غير موجود للتحديث`);
        }
      } catch (error) {
        checkAttempts++;
        console.warn(`فشلت المحاولة ${checkAttempts}/${maxCheckAttempts} للتحقق من وجود الطلب:`, error);
        
        if (checkAttempts >= maxCheckAttempts) {
          throw new Error('فشل في التحقق من وجود الطلب بعد عدة محاولات');
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * checkAttempts));
        console.log(`إعادة المحاولة ${checkAttempts + 1}/${maxCheckAttempts} للتحقق من وجود الطلب...`);
      }
    }
    
    if (!snapshot || !snapshot.exists()) {
      throw new Error(`الطلب برقم ${orderId} غير موجود للتحديث`);
    }
    
    // إضافة طابع زمني للتحديث
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // تحديث الطلب في قاعدة البيانات مع مهلة زمنية أطول ومحاولات متعددة
    console.log('جاري تحديث الطلب في Firebase...');
    
    // محاولات متعددة للتحديث
    let updateAttempts = 0;
    const maxUpdateAttempts = 3;
    
    while (updateAttempts < maxUpdateAttempts) {
      try {
        const updatePromise = update(orderRef, updatedData);
        const updateTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('انتهت مهلة تحديث الطلب')), 60000); // زيادة المهلة إلى 60 ثانية
        });
        
        await Promise.race([updatePromise, updateTimeoutPromise]);
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
    
    // البحث عن الطلب مع مهلة زمنية أطول ومحاولات متعددة
    console.log('جاري البحث عن الطلب...');
    
    // محاولات متعددة للبحث
    let searchAttempts = 0;
    const maxSearchAttempts = 3;
    let snapshot: any = null;
    
    while (searchAttempts < maxSearchAttempts) {
      try {
        const getPromise = get(orderRef);
        const searchTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('انتهت مهلة البحث عن الطلب')), 60000); // زيادة المهلة إلى 60 ثانية
        });
        
        snapshot = await Promise.race([getPromise, searchTimeoutPromise]) as any;
        
        if (snapshot.exists()) {
          console.log(`تم العثور على الطلب بنجاح بعد ${searchAttempts + 1} محاولة`);
          break; // الخروج من الحلقة في حالة النجاح
        } else {
          console.log(`الطلب برقم ${orderId} غير موجود`);
          return null;
        }
      } catch (error) {
        searchAttempts++;
        console.warn(`فشلت المحاولة ${searchAttempts}/${maxSearchAttempts} للبحث عن الطلب:`, error);
        
        if (searchAttempts >= maxSearchAttempts) {
          throw new Error('فشل في البحث عن الطلب بعد عدة محاولات');
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * searchAttempts));
        console.log(`إعادة المحاولة ${searchAttempts + 1}/${maxSearchAttempts} للبحث عن الطلب...`);
      }
    }
    
    if (!snapshot || !snapshot.exists()) {
      console.log(`الطلب برقم ${orderId} غير موجود`);
      return null;
    }
    
    const orderData = snapshot.val() as Order;
    console.log(`تم العثور على الطلب برقم ${orderId}`);
    return orderData;
  } catch (error) {
    console.error('خطأ في الحصول على الطلب:', error);
    throw error;
  }
};