import { ref, set, get, push, remove } from 'firebase/database';
import { db } from './config';

// نوع بيانات الدفع
export interface Payment {
  id?: string;
  type: 'worker' | 'partner';
  recipientName: string;
  amount: number;
  paymentType: 'full' | 'partial' | 'none';
  date: string;
  createdAt: string;
  createdBy: string;
}

// الحصول على مرجع لقائمة المدفوعات
const getPaymentsRef = () => {
  try {
    return ref(db, 'payments');
  } catch (error) {
    console.error('خطأ في الحصول على مرجع المدفوعات:', error);
    throw new Error('فشل في الاتصال بقاعدة بيانات Firebase');
  }
};

/**
 * إضافة دفعة جديدة
 * @param payment بيانات الدفعة
 * @param updateContext دالة لتحديث سياق التطبيق (اختياري)
 * @returns وعد يتم حله مع معرف الدفعة الجديدة
 */
export const addPayment = async (payment: Omit<Payment, 'id'>, updateContext?: (payment: Payment) => void): Promise<string> => {
  console.log('بدء إضافة دفعة جديدة في Firebase');
  
  try {
    // الحصول على مرجع المدفوعات
    const paymentsRef = getPaymentsRef();
    
    // إنشاء مرجع جديد للدفعة
    const newPaymentRef = push(paymentsRef);
    const paymentId = newPaymentRef.key;
    
    if (!paymentId) {
      throw new Error('فشل في إنشاء معرف للدفعة الجديدة');
    }
    
    // إضافة معرف ووقت الإنشاء للدفعة
    const newPayment: Payment = {
      ...payment,
      id: paymentId,
      createdAt: new Date().toISOString()
    };
    
    // حفظ الدفعة في قاعدة البيانات مع مهلة زمنية
    console.log('جاري حفظ الدفعة في Firebase...');
    
    // إنشاء وعد للحفظ مع مهلة زمنية
    const savePromise = set(newPaymentRef, newPayment);
    const saveTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة حفظ الدفعة الجديدة')), 60000);
    });
    
    // محاولات إعادة المحاولة في حالة الفشل
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await Promise.race([savePromise, saveTimeoutPromise]);
        console.log(`تم حفظ الدفعة الجديدة بنجاح بعد ${attempts + 1} محاولة`);
        
        // تحديث السياق إذا تم تمرير دالة التحديث
        if (updateContext) {
          updateContext(newPayment);
        }
        
        return paymentId;
      } catch (error) {
        attempts++;
        console.warn(`فشلت المحاولة ${attempts}/${maxAttempts} لحفظ الدفعة الجديدة:`, error);
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      }
    }
    
    throw new Error('فشل في حفظ الدفعة الجديدة بعد عدة محاولات');
  } catch (error) {
    console.error('خطأ في إضافة دفعة جديدة:', error);
    throw error;
  }
};

/**
 * الحصول على جميع المدفوعات
 * @returns وعد يتم حله مع قائمة المدفوعات
 */
export const getAllPayments = async (): Promise<Payment[]> => {
  console.log('بدء الحصول على المدفوعات من Firebase');
  
  try {
    const paymentsRef = getPaymentsRef();
    
    // الحصول على المدفوعات مع مهلة زمنية
    const getPromise = get(paymentsRef);
    const getTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة الحصول على المدفوعات')), 60000);
    });
    
    const snapshot = await Promise.race([getPromise, getTimeoutPromise]) as any;
    
    if (snapshot.exists()) {
      const paymentsData = snapshot.val();
      const payments: Payment[] = Object.keys(paymentsData).map(key => ({
        id: key,
        ...paymentsData[key]
      }));
      
      console.log(`تم الحصول على ${payments.length} دفعة من Firebase`);
      return payments;
    }
    
    console.log('لا توجد مدفوعات في Firebase');
    return [];
  } catch (error) {
    console.error('خطأ في الحصول على المدفوعات:', error);
    throw error;
  }
};

/**
 * الحصول على مدفوعات لمستلم معين
 * @param recipientType نوع المستلم (عامل أو شريك)
 * @param recipientName اسم المستلم
 * @returns وعد يتم حله مع قائمة المدفوعات
 */
export const getPaymentsByRecipient = async (
  recipientType: 'worker' | 'partner',
  recipientName: string
): Promise<Payment[]> => {
  try {
    const allPayments = await getAllPayments();
    
    return allPayments.filter(
      payment => payment.type === recipientType && payment.recipientName === recipientName
    );
  } catch (error) {
    console.error(`خطأ في الحصول على مدفوعات ${recipientType} ${recipientName}:`, error);
    throw error;
  }
};

/**
 * الحصول على المدفوعات حسب الفترة الزمنية
 * @param timeFilter نوع الفلتر الزمني (اليوم، الأسبوع، الشهر، مخصص)
 * @param customDays عدد الأيام المخصصة (في حالة الفلتر المخصص)
 * @returns وعد يتم حله مع قائمة المدفوعات المفلترة
 */
export const getPaymentsByTimeFilter = async (
  timeFilter: 'today' | 'week' | 'month' | 'custom' | 'all',
  customDays?: string
): Promise<Payment[]> => {
  try {
    const allPayments = await getAllPayments();
    const now = new Date();
    
    if (timeFilter === 'all') {
      return allPayments;
    }
    
    let filtered: Payment[] = [];
    
    if (timeFilter === 'today') {
      const today = now.toDateString();
      filtered = allPayments.filter(payment => new Date(payment.date).toDateString() === today);
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = allPayments.filter(payment => new Date(payment.date) >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = allPayments.filter(payment => new Date(payment.date) >= monthAgo);
    } else if (timeFilter === 'custom' && customDays) {
      const daysAgo = new Date(now.getTime() - parseInt(customDays) * 24 * 60 * 60 * 1000);
      filtered = allPayments.filter(payment => new Date(payment.date) >= daysAgo);
    }
    
    return filtered;
  } catch (error) {
    console.error(`خطأ في الحصول على المدفوعات حسب الفترة الزمنية:`, error);
    throw error;
  }
};

/**
 * حذف دفعة من قاعدة البيانات
 * @param paymentId معرف الدفعة المراد حذفها
 * @returns وعد يتم حله عند اكتمال العملية
 */
export const deletePayment = async (paymentId: string): Promise<void> => {
  console.log('بدء حذف الدفعة من Firebase:', paymentId);
  
  try {
    // التحقق من وجود معرف للدفعة
    if (!paymentId) {
      throw new Error('معرف الدفعة مطلوب للحذف');
    }
    
    // إنشاء مرجع للدفعة
    const paymentRef = ref(db, `payments/${paymentId}`);
    
    // حذف الدفعة مع مهلة زمنية
    const deletePromise = set(paymentRef, null);
    const deleteTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة حذف الدفعة')), 60000);
    });
    
    // محاولات إعادة المحاولة في حالة الفشل
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await Promise.race([deletePromise, deleteTimeoutPromise]);
        console.log(`تم حذف الدفعة بنجاح بعد ${attempts + 1} محاولة`);
        return;
      } catch (error) {
        attempts++;
        console.warn(`فشلت المحاولة ${attempts}/${maxAttempts} لحذف الدفعة:`, error);
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      }
    }
    
    throw new Error('فشل في حذف الدفعة بعد عدة محاولات');
  } catch (error) {
    console.error('خطأ في حذف الدفعة:', error);
    throw error;
  }
};

/**
 * حذف جميع المدفوعات من قاعدة البيانات
 * @returns وعد يتم حله عند اكتمال العملية
 */
export const deleteAllPayments = async (): Promise<void> => {
  console.log('بدء حذف جميع المدفوعات من Firebase');
  
  try {
    // الحصول على مرجع لجميع المدفوعات
    const paymentsRef = getPaymentsRef();
    
    // حذف جميع المدفوعات مع مهلة زمنية
    const deletePromise = remove(paymentsRef);
    const deleteTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة حذف جميع المدفوعات')), 60000);
    });
    
    // محاولات إعادة المحاولة في حالة الفشل
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await Promise.race([deletePromise, deleteTimeoutPromise]);
        console.log(`تم حذف جميع المدفوعات بنجاح بعد ${attempts + 1} محاولة`);
        return;
      } catch (error) {
        attempts++;
        console.warn(`فشلت المحاولة ${attempts}/${maxAttempts} لحذف جميع المدفوعات:`, error);
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      }
    }
    
    throw new Error('فشل في حذف جميع المدفوعات بعد عدة محاولات');
  } catch (error) {
    console.error('خطأ في حذف جميع المدفوعات:', error);
    throw error;
  }
};