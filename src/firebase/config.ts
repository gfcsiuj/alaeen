import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// تكوين Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBRcnQjoWhXjVwmI1ZYsQS5VWSE_7_BEXs",
  authDomain: "aleayin-88731.firebaseapp.com",
  databaseURL: "https://aleayin-88731-default-rtdb.firebaseio.com",
  projectId: "aleayin-88731",
  storageBucket: "aleayin-88731.appspot.com",
  messagingSenderId: "994260785657",
  appId: "1:994260785657:web:b4d834f9037d8985360528",
  measurementId: "G-DZ4M525RX7"
};

console.log('تهيئة Firebase...');

// تهيئة Firebase مع معالجة الأخطاء
let app;
let db;
let analytics;

try {
  // تهيئة التطبيق
  app = initializeApp(firebaseConfig);
  console.log('تم تهيئة تطبيق Firebase بنجاح');
  
  // تهيئة قاعدة البيانات
  db = getDatabase(app);
  console.log('تم تهيئة قاعدة البيانات بنجاح');
  
  // تهيئة التحليلات
  try {
    analytics = getAnalytics(app);
    console.log('تم تهيئة التحليلات بنجاح');
  } catch (analyticsError) {
    console.warn('تعذر تهيئة التحليلات:', analyticsError);
    analytics = null;
  }
} catch (error) {
  console.error('خطأ في تهيئة Firebase:', error);
  throw new Error('فشل في تهيئة Firebase. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.');
}

// إضافة مستمع للاتصال بقاعدة البيانات
try {
  if (db) {
    // استخدام الدوال المستوردة بالفعل في أعلى الملف
    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log('متصل بقاعدة بيانات Firebase');
      } else {
        console.warn('غير متصل بقاعدة بيانات Firebase');
      }
    });
  }
} catch (error) {
  console.warn('تعذر إعداد مستمع الاتصال:', error);
}

export { db, analytics };