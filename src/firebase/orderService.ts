import { ref, set, onValue, remove, update, get, push, DatabaseReference } from 'firebase/database';
import { db } from './config';
import { Order } from '../types';

// الحصول على مرجع لقائمة الطلبات
const ordersRef = ref(db, 'orders');

/**
 * إضافة طلب جديد أو تحديث طلب موجود
 * @param order الطلب المراد حفظه
 * @returns وعد يتم حله عند اكتمال العملية
 */
export const saveOrder = async (order: Order): Promise<void> => {
  try {
    // التأكد من وجود معرف للطلب
    if (!order.id) {
      throw new Error('معرف الطلب مفقود');
    }
    
    const orderRef = ref(db, `orders/${order.id}`);
    await set(orderRef, order);
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
  try {
    // إنشاء مرجع جديد مع معرف فريد
    const newOrderRef = push(ordersRef);
    const newOrderId = newOrderRef.key;
    
    if (!newOrderId) {
      throw new Error('فشل في إنشاء معرف جديد للطلب');
    }
    
    // إنشاء كائن الطلب الكامل مع المعرف الجديد
    const newOrder = { ...order, id: newOrderId } as Order;
    
    // حفظ الطلب في قاعدة البيانات
    await set(newOrderRef, newOrder);
    console.log('تم إضافة طلب جديد بنجاح في Firebase:', newOrderId);
    
    return newOrder;
  } catch (error) {
    console.error('خطأ في إضافة طلب جديد:', error);
    throw error;
  }
};

/**
 * حذف طلب
 * @param orderId معرف الطلب المراد حذفه
 * @returns وعد يتم حله عند اكتمال العملية
 */
export const deleteOrderFromDB = async (orderId: string): Promise<void> => {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    
    // التحقق من وجود الطلب قبل الحذف
    const snapshot = await get(orderRef);
    if (!snapshot.exists()) {
      console.warn(`الطلب برقم ${orderId} غير موجود للحذف`);
      return;
    }
    
    await remove(orderRef);
    console.log('تم حذف الطلب بنجاح من Firebase:', orderId);
  } catch (error) {
    console.error('خطأ في حذف الطلب:', error);
    throw error;
  }
};

/**
 * الاستماع للتغييرات في الطلبات
 * @param callback دالة يتم استدعاؤها عند تغيير البيانات
 * @returns دالة لإلغاء الاشتراك
 */
export const subscribeToOrders = (callback: (orders: Order[]) => void): (() => void) => {
  console.log('بدء الاستماع للتغييرات في الطلبات...');
  
  const unsubscribe = onValue(ordersRef, (snapshot) => {
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
  }, (error) => {
    console.error('خطأ في الاشتراك بالطلبات:', error);
  });
  
  // إرجاع دالة لإلغاء الاشتراك
  return unsubscribe;
};

/**
 * تحديث طلب موجود
 * @param orderId معرف الطلب المراد تحديثه
 * @param updates التحديثات المراد إجراؤها
 * @returns وعد يتم حله عند اكتمال العملية
 */
export const updateOrderInDB = async (orderId: string, updates: Partial<Order>): Promise<void> => {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    
    // التحقق من وجود الطلب قبل التحديث
    const snapshot = await get(orderRef);
    if (!snapshot.exists()) {
      throw new Error(`الطلب برقم ${orderId} غير موجود للتحديث`);
    }
    
    await update(orderRef, updates);
    console.log('تم تحديث الطلب بنجاح في Firebase:', orderId);
  } catch (error) {
    console.error('خطأ في تحديث الطلب:', error);
    throw error;
  }
};

/**
 * الحصول على طلب واحد بواسطة المعرف
 * @param orderId معرف الطلب المراد الحصول عليه
 * @returns وعد يتم حله مع الطلب إذا وجد
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Order;
    } else {
      console.warn(`الطلب برقم ${orderId} غير موجود`);
      return null;
    }
  } catch (error) {
    console.error('خطأ في الحصول على الطلب:', error);
    throw error;
  }
};