// ملف مزامنة Firebase مع localStorage
// يجعل كل التغييرات تنعكس فوراً على جميع المستخدمين

import { FirebaseDB } from './firebase-config.js';

// مفاتيح التخزين
const KEYS = {
    settings: 'abile.settings',
    products: 'abile.products',
    coupons: 'abile.coupons',
    webhooks: 'abile.webhooks',
    categories: 'abile.categories',
    orders: 'abile.orders'
};

// دوال localStorage الأصلية
const originalJget = window.jget;
const originalJset = window.jset;

let isInitializing = true;
let syncListeners = {};

// تحميل البيانات من Firebase عند بداية التشغيل
export async function initFirebaseSync() {
    console.log('🔄 بدء مزامنة Firebase...');
    
    await FirebaseDB.ready();

    try {
        // تحميل جميع البيانات من Firebase
        const [settings, products, coupons, categories, webhooks, orders] = await Promise.all([
            FirebaseDB.getSettings(),
            FirebaseDB.getProducts(),
            FirebaseDB.getCoupons(),
            FirebaseDB.getCategories(),
            FirebaseDB.getWebhooks(),
            FirebaseDB.getOrders()
        ]);

        // حفظها في localStorage
        localStorage.setItem(KEYS.settings, JSON.stringify(settings));
        localStorage.setItem(KEYS.products, JSON.stringify(products));
        localStorage.setItem(KEYS.coupons, JSON.stringify(coupons));
        localStorage.setItem(KEYS.categories, JSON.stringify(categories));
        localStorage.setItem(KEYS.webhooks, JSON.stringify(webhooks));
        localStorage.setItem(KEYS.orders, JSON.stringify(orders));

        console.log('✅ تم تحميل البيانات من Firebase');
        
        isInitializing = false;

        // بدء الاستماع للتغييرات الفورية
        startRealtimeSync();
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        isInitializing = false;
    }
}

// الاستماع للتغييرات الفورية من Firebase
function startRealtimeSync() {
    // مزامنة المنتجات
    syncListeners.products = FirebaseDB.listenToProducts((products) => {
        if (!isInitializing) {
            localStorage.setItem(KEYS.products, JSON.stringify(products));
            window.dispatchEvent(new StorageEvent('storage', {
                key: KEYS.products,
                newValue: JSON.stringify(products),
                url: window.location.href,
                storageArea: localStorage
            }));
        }
    });

    // مزامنة الإعدادات
    syncListeners.settings = FirebaseDB.listenToSettings((settings) => {
        if (!isInitializing) {
            localStorage.setItem(KEYS.settings, JSON.stringify(settings));
            window.dispatchEvent(new StorageEvent('storage', {
                key: KEYS.settings,
                newValue: JSON.stringify(settings),
                url: window.location.href,
                storageArea: localStorage
            }));
        }
    });

    // مزامنة الكوبونات
    syncListeners.coupons = FirebaseDB.listenToCoupons((coupons) => {
        if (!isInitializing) {
            localStorage.setItem(KEYS.coupons, JSON.stringify(coupons));
            window.dispatchEvent(new StorageEvent('storage', {
                key: KEYS.coupons,
                newValue: JSON.stringify(coupons),
                url: window.location.href,
                storageArea: localStorage
            }));
        }
    });

    // مزامنة الطلبات
    syncListeners.orders = FirebaseDB.listenToOrders((orders) => {
        if (!isInitializing) {
            localStorage.setItem(KEYS.orders, JSON.stringify(orders));
            window.dispatchEvent(new StorageEvent('storage', {
                key: KEYS.orders,
                newValue: JSON.stringify(orders),
                url: window.location.href,
                storageArea: localStorage
            }));
        }
    });

    console.log('👂 تم تفعيل المزامنة الفورية');
}

// استبدال دالة jset لتحفظ في Firebase تلقائياً
window.jset = function(key, value) {
    // حفظ في localStorage أولاً
    localStorage.setItem(key, JSON.stringify(value));

    // لا ترفع للـ Firebase أثناء التحميل الأولي
    if (isInitializing) return;

    // رفع إلى Firebase حسب نوع البيانات
    setTimeout(async () => {
        try {
            switch(key) {
                case KEYS.settings:
                    await FirebaseDB.setSettings(value);
                    break;
                    
                case KEYS.products:
                    // حفظ كل منتج على حدة
                    for (const product of value) {
                        await FirebaseDB.saveProduct(product);
                    }
                    break;
                    
                case KEYS.coupons:
                    // حفظ كل كوبون على حدة
                    for (const coupon of value) {
                        await FirebaseDB.saveCoupon(coupon);
                    }
                    break;
                    
                case KEYS.categories:
                    await FirebaseDB.setCategories(value);
                    break;
                    
                case KEYS.webhooks:
                    await FirebaseDB.setWebhooks(value);
                    break;
                    
                case KEYS.orders:
                    // حفظ آخر طلب فقط (الجديد)
                    if (value.length > 0) {
                        const lastOrder = value[value.length - 1];
                        await FirebaseDB.saveOrder(lastOrder);
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ خطأ في رفع البيانات لـ Firebase:', error);
        }
    }, 100); // تأخير بسيط لتجنب الطلبات المتعددة
};

// تصدير الدوال
export { FirebaseDB };