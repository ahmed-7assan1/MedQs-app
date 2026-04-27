# دليل تشغيل نظام نقل فيديوهات يوتيوب (MedOneX Colab Worker)

هذا النظام يسمح بنقل الفيديوهات من أي قناة يوتيوب إلى قناتك الخاصة كفيديو "غير مدرج" (Unlisted) باستخدام خوادم جوجل كولاب لتوفير الإنترنت.

## 1. الإعداد في موقعك (Vercel)
يجب إضافة متغير البيئة التالي في لوحة تحكم Vercel:
- `COLAB_WORKER_SECRET`: اختر أي كلمة سر قوية (مثلاً: `MySecureTransfer2026`).

## 2. الحصول على صلاحيات يوتيوب (YouTube API)
عشان كولاب يقدر يرفع للقناة نيابة عنك:
1. افتح [Google Cloud Console](https://console.cloud.google.com/).
2. فعل **YouTube Data API v3**.
3. أنشئ **OAuth client ID** من نوع **Desktop App**.
4. حمل ملف الـ JSON وقم بتسميته `client_secrets.json`.

## 3. تشغيل كولاب
1. افتح [Google Colab](https://colab.research.google.com/).
2. ارفع ملف `client_secrets.json` في مساحة التخزين الجانبية في كولاب.
3. انسخ الكود من `tools/colab_worker.py` إلى كولاب.
4. تأكد من أن `SITE_URL` هو `https://medonex.vercel.app`.
5. تأكد من أن `COLAB_SECRET` هو نفس الكلمة التي اخترتها في الخطوة 1.
6. شغل الكود!

## 4. إضافة فيديو للنقل
1. اذهب إلى: `https://medonex.vercel.app/admin/colab-transfer`.
2. ضع رابط الفيديو واضغط **Queue Transfer**.
3. تابع التقدم (Progress) من لوحة التحكم.
