import { ref, set, onValue, remove, update } from 'firebase/database';
import { db } from './config';
import { Order } from '../types';

// الحصول على مرجع لقائمة الطلبات
const ordersRef = ref(db, 'orders');

// إضافة طلب جديد أو تحديث طلب موجود
export const saveOrder = async (order: Order): Promise<void> => {
  try {
    const orderRef = ref(db, `orders/${order.id}`);
    await set(orderRef, order);
    console.log('تم حفظ الطلب بنجاح في Firebase');
  } catch (error) {
    console.error('خطأ في حفظ الطلب:', error);
    throw error;
  }
};

// حذف طلب
export const deleteOrderFromDB = async (orderId: string): Promise<void> => {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    await remove(orderRef);
    console.log('تم حذف الطلب بنجاح من Firebase');
  } catch (error) {
    console.error('خطأ في حذف الطلب:', error);
    throw error;
  }
};

// الاستماع للتغييرات في الطلبات
export const subscribeToOrders = (callback: (orders: Order[]) => void): (() => void) => {
  const unsubscribe = onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    const ordersList: Order[] = [];
    
    if (data) {
      // تحويل البيانات من كائن إلى مصفوفة
      Object.keys(data).forEach((key) => {
        ordersList.push(data[key]);
      });
    }
    
    callback(ordersList);
  }, (error) => {
    console.error('خطأ في الاشتراك بالطلبات:', error);
  });
  
  // إرجاع دالة لإلغاء الاشتراك
  return unsubscribe;
};

// تحديث طلب موجود
export const updateOrderInDB = async (orderId: string, updates: Partial<Order>): Promise<void> => {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    await update(orderRef, updates);
    console.log('تم تحديث الطلب بنجاح في Firebase');
  } catch (error) {
    console.error('خطأ في تحديث الطلب:', error);
    throw error;
  }
};