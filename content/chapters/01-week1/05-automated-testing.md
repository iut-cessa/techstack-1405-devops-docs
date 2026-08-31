---
title: آشنایی با Automated Testing
weight: 5
description: چرا تست دستی کافی نیست؛ سطوح تست و جایگاه آن در چرخه‌ی توسعه
---

## چرا تست خودکار؟

با رشد پروژه، تست دستیِ همه‌چیز بعد از هر تغییر، ناممکن می‌شود. بدتر از آن بسیاری از خرابی‌ها فقط هنگام ترکیب تغییرات ظاهر می‌شوند (Regression) و تست دستی قبلی آن‌ها را دوباره نمی‌بیند. **تست خودکار** یعنی کدی که رفتار کد دیگر را بررسی می‌کند — سریع، تکرارپذیر و بدون خستگی.

بیش از سرعت، ارزش اصلی تست خودکار **اطمینان برای تغییر سریع** است: وقتی تست‌ها سبزند، تغییر بزرگ را با خیال راحت‌تر merge می‌کنید. این دقیقاً همان چیزی است که سرعت DevOps را ممکن می‌کند.

## سطوح تست

- **Unit Test** — کوچک‌ترین بخش‌ها به‌تنهایی (یک تابع، یک کلاس)؛ سریع و فراوان
- **Integration Test** — همکاری چند بخش با هم (تابع + دیتابیس + سرویس دیگر)
- **End-to-End (E2E)** — کل مسیر کاربر از بیرون؛ کندترین اما واقعی‌ترین

تناسب این سطوح با هم را معمولاً با **Testing Pyramid** نشان می‌دهند: پایه‌ی عریض از تست‌های Unit و نوک باریک از E2E.

![نمودار Testing Pyramid](images/testing-pyramid.png)

<div align="center"><em>منبع تصویر: <a href="https://www.reddit.com/r/softwaretesting/comments/1e1o0l3/what_are_your_thoughts_on_the_testing_pyramid_how/">Reddit</a></em></div>

## جایگاه در چرخه

تست‌ها در هر تغییر کد اجرا می‌شوند — از اجرای محلی و پیش از commit، تا به‌صورت خودکار روی Pull Requestها. اجرای خودکار تست‌ها روی مخزن، اولین قدم دنیای **CI** است که در هفته‌ی ششم به آن می‌رسیم. الان فقط مفهوم و انگیزه را بگیرید.

## منابع یادگیری

**مقالات و مستندات**

- [Martin Fowler — Software Testing Guide](https://martinfowler.com/testing/) — مجموعه‌ی مقالات مرجع درباره‌ی انواع تست و اصول آن
- [Introduction to Software Testing — GeeksforGeeks](https://www.geeksforgeeks.org/software-testing/software-testing-basics/) — مرور اصطلاحات و سطوح تست

**ویدیو**

- [Python Testing with pytest — freeCodeCamp](https://www.youtube.com/watch?v=cHYq1MRoyI0) — آموزش تست در Python (برای علاقه‌مندان)
