// تكوين Firebase الخاص بمتجر Abile
const firebaseConfig = {
  apiKey: "AIzaSyCbeK5Ugu9umWJl_UC1St6vNH-FwIPCEYA",
  authDomain: "abile-store.firebaseapp.com",
  databaseURL: "https://abile-store-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "abile-store",
  storageBucket: "abile-store.firebasestorage.app",
  messagingSenderId: "803512583188",
  appId: "1:803512583188:web:cca206b1ec9dfaf5b3d301",
  measurementId: "G-PMC1N8F50F"
};

// استيراد Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// تسجيل دخول تلقائي
const authPromise = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ Firebase: تم تسجيل الدخول بنجاح');
      resolve(true);
    } else {
      signInAnonymously(auth)
        .then(() => console.log('✅ Firebase: تم المصادقة'))
        .catch(err => {
          console.error('❌ Firebase Auth Error:', err);
          resolve(false);
        });
    }
  });
});

// دوال Firebase للتعامل مع البيانات
export const FirebaseDB = {
  // انتظار جاهزية Firebase
  async ready() {
    return authPromise;
  },

  // === الإعدادات ===
  async getSettings() {
    try {
      const docRef = doc(db, 'settings', 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log('📥 تم جلب الإعدادات من Firebase');
        return docSnap.data();
      }
      const defaults = { currency: 'ر.س', passphraseHint: '', logo: '' };
      await this.setSettings(defaults);
      return defaults;
    } catch (err) {
      console.error('❌ خطأ في جلب الإعدادات:', err);
      return { currency: 'ر.س', passphraseHint: '', logo: '' };
    }
  },

  async setSettings(settings) {
    try {
      await setDoc(doc(db, 'settings', 'config'), settings, { merge: true });
      console.log('✅ تم حفظ الإعدادات في Firebase');
      return true;
    } catch (err) {
      console.error('❌ خطأ في حفظ الإعدادات:', err);
      return false;
    }
  },

  // === المنتجات ===
  async getProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = querySnapshot.docs.map(doc => ({ ...doc.data() }));
      console.log(`📥 تم جلب ${products.length} منتج من Firebase`);
      return products;
    } catch (err) {
      console.error('❌ خطأ في جلب المنتجات:', err);
      return [];
    }
  },

  async saveProduct(product) {
    try {
      await setDoc(doc(db, 'products', product.id), product);
      console.log(`✅ تم حفظ المنتج ${product.id}`);
      return true;
    } catch (err) {
      console.error('❌ خطأ في حفظ المنتج:', err);
      return false;
    }
  },

  async deleteProduct(productId) {
    try {
      await deleteDoc(doc(db, 'products', productId));
      console.log(`🗑️ تم حذف المنتج ${productId}`);
      return true;
    } catch (err) {
      console.error('❌ خطأ في حذف المنتج:', err);
      return false;
    }
  },

  // === الكوبونات ===
  async getCoupons() {
    try {
      const querySnapshot = await getDocs(collection(db, 'coupons'));
      const coupons = querySnapshot.docs.map(doc => ({ ...doc.data() }));
      console.log(`📥 تم جلب ${coupons.length} كوبون من Firebase`);
      return coupons;
    } catch (err) {
      console.error('❌ خطأ في جلب الكوبونات:', err);
      return [];
    }
  },

  async saveCoupon(coupon) {
    try {
      const id = coupon.code || coupon.id;
      await setDoc(doc(db, 'coupons', id), coupon);
      console.log(`✅ تم حفظ الكوبون ${id}`);
      return true;
    } catch (err) {
      console.error('❌ خطأ في حفظ الكوبون:', err);
      return false;
    }
  },

  async deleteCoupon(couponId) {
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
      console.log(`🗑️ تم حذف الكوبون ${couponId}`);
      return true;
    } catch (err) {
      console.error('❌ خطأ في حذف الكوبون:', err);
      return false;
    }
  },

  // === الفئات ===
  async getCategories() {
    try {
      const docRef = doc(db, 'settings', 'categories');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().list || [];
      }
      const defaults = ['بطاقات', 'اشتراكات', 'عملات', 'خدمات', 'برامج'];
      await this.setCategories(defaults);
      return defaults;
    } catch (err) {
      console.error('❌ خطأ في جلب الفئات:', err);
      return ['بطاقات', 'اشتراكات', 'عملات', 'خدمات', 'برامج'];
    }
  },

  async setCategories(categories) {
    try {
      await setDoc(doc(db, 'settings', 'categories'), { list: categories });
      console.log('✅ تم حفظ الفئات');
      return true;
    } catch (err) {
      console.error('❌ خطأ في حفظ الفئات:', err);
      return false;
    }
  },

  // === الطلبات ===
  async getOrders() {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const orders = querySnapshot.docs.map(doc => ({ ...doc.data() }));
      console.log(`📥 تم جلب ${orders.length} طلب من Firebase`);
      return orders;
    } catch (err) {
      console.error('❌ خطأ في جلب الطلبات:', err);
      return [];
    }
  },

  async saveOrder(order) {
    try {
      await setDoc(doc(db, 'orders', order.id), order);
      console.log(`✅ تم حفظ الطلب ${order.id}`);
      return true;
    } catch (err) {
      console.error('❌ خطأ في حفظ الطلب:', err);
      return false;
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: new Date().toISOString() });
      console.log(`✅ تم تحديث حالة الطلب ${orderId}`);
      return true;
    } catch (err) {
      console.error('❌ خطأ في تحديث الطلب:', err);
      return false;
    }
  },

  // === Webhooks ===
  async getWebhooks() {
    try {
      const docRef = doc(db, 'settings', 'webhooks');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      const defaults = {
        logs: 'https://discord.com/api/webhooks/1432650376108048425/mSLEh3YCVr2i8SNjUX_EzyBWYYnVeofjTNVfXdIP9ZS4ZWMe3vjE__A49l9eOPd-ptmR',
        orders: 'https://discord.com/api/webhooks/1432667392269357146/NPfhBoxS42DwbPb7BSlYsLR7Aunk_rCMsuuZAQkcGCh9O4UK2tbfHb6b6JJWIlBgLp2k'
      };
      await this.setWebhooks(defaults);
      return defaults;
    } catch (err) {
      console.error('❌ خطأ في جلب Webhooks:', err);
      return defaults;
    }
  },

  async setWebhooks(webhooks) {
    try {
      await setDoc(doc(db, 'settings', 'webhooks'), webhooks);
      console.log('✅ تم حفظ Webhooks');
      return true;
    } catch (err) {
      console.error('❌ خطأ في حفظ Webhooks:', err);
      return false;
    }
  },

  // === الاستماع للتغييرات الفورية (Real-time) ===
  listenToProducts(callback) {
    console.log('👂 بدء الاستماع لتغييرات المنتجات...');
    return onSnapshot(collection(db, 'products'), (snapshot) => {
      const products = snapshot.docs.map(doc => ({ ...doc.data() }));
      console.log('🔄 تحديث فوري: تم تحديث المنتجات');
      callback(products);
    }, (error) => {
      console.error('❌ خطأ في الاستماع للمنتجات:', error);
    });
  },

  listenToSettings(callback) {
    return onSnapshot(doc(db, 'settings', 'config'), (doc) => {
      if (doc.exists()) {
        console.log('🔄 تحديث فوري: تم تحديث الإعدادات');
        callback(doc.data());
      }
    });
  },

  listenToCoupons(callback) {
    return onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const coupons = snapshot.docs.map(doc => ({ ...doc.data() }));
      console.log('🔄 تحديث فوري: تم تحديث الكوبونات');
      callback(coupons);
    });
  },

  listenToOrders(callback) {
    return onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ ...doc.data() }));
      console.log('🔄 تحديث فوري: تم تحديث الطلبات');
      callback(orders);
    });
  }
};

export { db, auth };