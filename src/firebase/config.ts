import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
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

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// الحصول على مرجع قاعدة البيانات
const db = getDatabase(app);

// الحصول على مرجع التحليلات
const analytics = getAnalytics(app);

export { db, analytics };