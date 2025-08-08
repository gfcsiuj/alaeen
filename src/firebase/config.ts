import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
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
  
  // تهيئة قاعدة البيانات مع إعدادات محسنة
  db = getDatabase(app, {
    // تعيين مهلة الاتصال إلى 30 ثانية
    authTokenExpiration: 30000
  });
  
  // تعيين إعدادات الاتصال لتحسين الأداء
  const dbRef = db.ref;
  if (dbRef && typeof dbRef.keepSynced === 'function') {
    dbRef.keepSynced(true);
  }
  
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
const connectedRef = db ? db.ref('.info/connected') : null;
if (connectedRef) {
  connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
      console.log('متصل بقاعدة بيانات Firebase');
    } else {
      console.warn('غير متصل بقاعدة بيانات Firebase');
    }
  });
}

export { db, analytics };