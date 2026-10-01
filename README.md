# Norwich Student Information Form — VIA

نسخة محلية مجانية من فورم بيانات الطالب باستخدام HTML وCSS وJavaScript.

## التشغيل المحلي

افتح `index.html` مباشرة في المتصفح، أو شغّل خادمًا محليًا:

```bash
cd student-intake-form
python3 -m http.server 8000
```

ثم افتح: http://localhost:8000

## Google Sheets

تم إنشاء Google Sheet جاهز لاستقبال الردود:

https://docs.google.com/spreadsheets/d/1DQkC29Bs42RRw8ncNAKxJ5w5poRez5rfvwzYwXzxQ9Y/edit

يحتوي على تبويبين:

- `Student Responses`
- `Siblings`

### تفعيل الإرسال إلى الشيت

1. افتح Google Apps Script من حساب Google نفسه.
2. أنشئ مشروعًا جديدًا.
3. انسخ محتوى `google-apps-script/Code.gs` إلى المشروع.
4. من Project Settings أضف إعدادات `google-apps-script/appsscript.json` إذا لزم.
5. اختر **Deploy → New deployment → Web app**.
6. اختر Execute as: **Me**.
7. اختر Who has access: **Anyone**.
8. انسخ رابط Web App الذي ينتهي بـ `/exec`.
9. افتح `app.js` وضع الرابط داخل:

```js
const SHEET_WEB_APP_URL = 'ضع رابط Web App هنا';
```

بعد ذلك، عند الضغط على **Save Information** سيتم حفظ نسخة محلية وإرسال البيانات إلى Google Sheet. عند اختيار وجود إخوة، تُحفظ بيانات الطالب في `Student Responses` وبيانات الإخوة في `Siblings`.

## منع التكرار

- يمنع `app.js` إعادة إرسال نفس الطالب من نفس المتصفح.
- يمنع `google-apps-script/Code.gs` تسجيل نفس الطالب مرة أخرى حتى لو استُخدم جهاز مختلف، اعتمادًا على الاسم الأول والاسم الأوسط واسم العائلة وتاريخ الميلاد.
- بعد تعديل `Code.gs` يجب عمل **Deploy → Manage deployments → Edit → New version → Deploy** حتى يعمل منع التكرار على النسخة المنشورة.

## المزايا

- واجهة إنجليزية بالكامل واتجاه LTR.
- شعارات Norwich وSkolera أعلى الصفحة، وVIA أسفل الصفحة.
- التحقق من الحقول المطلوبة والبريد الإلكتروني والتاريخ.
- Student email اختياري، وبقية البيانات إجبارية.
- إضافة بيانات الإخوة تظهر فقط بعد اختيار Yes.
- حفظ المسودة وآخر إرسال داخل `localStorage`.
- حفظ البيانات محليًا وإرسالها إلى Google Sheet بعد تفعيل Web App.

> لا تضع مفاتيح Google أو بيانات الدخول داخل ملفات HTML أو JavaScript. استخدم رابط Web App فقط بعد نشر Apps Script.

### مهم بعد تحديث منع التكرار

استبدل محتوى `Code.gs` في Google Apps Script، ثم نفّذ:

`Deploy → Manage deployments → Edit → New version → Deploy`

تأكد أن رابط الفورم في `app.js` هو رابط النشر الذي ينتهي بـ `/exec`، وليس `/dev`. بدون نشر النسخة الجديدة سيستمر الرابط القديم في قبول التكرار.
