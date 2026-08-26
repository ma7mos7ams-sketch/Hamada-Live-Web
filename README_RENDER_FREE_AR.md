# Hamada LIVE Web V28 - Render Free

هذه نسخة مجانية للنشر على Render بدون Cloudflare Containers.

## الإعداد على Render
- نوع الخدمة: Web Service
- Runtime: Node
- Plan: Free
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check: `/health`

بعد النشر:
- لوحة التحكم: `https://YOUR-SERVICE.onrender.com/`
- Overlay: `https://YOUR-SERVICE.onrender.com/overlay`

## ملاحظة الخطة المجانية
Render قد يوقف الخدمة بعد 15 دقيقة من عدم وجود حركة. هذه النسخة ترسل WebSocket keepalive كل 30 ثانية أثناء فتح لوحة التحكم أو الـOverlay، لذلك تبقى مستيقظة أثناء البث.

## التخزين
قرص Render المجاني مؤقت. الأغاني المرفوعة إلى الخادم قد تختفي عند إعادة التشغيل/السكون. سنربط التخزين المجاني الدائم في خطوة منفصلة إذا احتجت مكتبة أغاني محفوظة.
