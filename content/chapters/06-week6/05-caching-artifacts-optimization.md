---
title: بهینه‌سازی سرعت و اشتراک‌گذاری داده‌ها
weight: 5
description: تسریع اجرای پایپ‌لاین‌ها با مکانیزم‌های Caching وابستگی‌ها، انتقال فایل‌ها بین Jobها با Artifacts و کنترل همروندی
---

## چرا سرعت اجرای پایپ‌لاین حیاتی است؟

اگر اجرای تست‌ها و بیلد پایپ‌لاین شما ۳۰ دقیقه زمان ببرد:
- بازخورد به توسعه‌دهنده کند می‌شود (از دست رفتن Fast Feedback Loop).
- دقایق مصرفی رانرهای ابری گیت‌هاب (Runner Minutes) به سرعت مصرف شده و هزینه‌ها افزایش می‌یابد.
- صف اجرای درخواست‌های ادغام (PRها) طولانی شده و بهره‌وری تیم کاهش پیدا می‌کند.

بخش عمده‌ای از زمان اجرای پایپ‌لاین‌ها صرف دانلود مجدد پکیج‌های تکراری از اینترنت (مثل پکیج‌های `pip` یا `npm`) یا بیلد دوباره فایل‌هایی می‌شود که تغییر نکرده‌اند. با دو سازوکار اساسی یعنی **Artifactها** و **Cacheها** این گلوگاه‌ها برطرف می‌شوند.

---

## انتقال داده بین Jobها با Artifacts

همان‌طور که در درس معماری یاد گرفتید، هر Job روی یک رانر مستقل و تمیز اجرا می‌شود. این یعنی فایل‌هایی که در جاب A تولید می‌شوند، پس از پایان جاب از بین می‌روند و جاب B به آن‌ها دسترسی ندارد!

برای انتقال فایل‌های تولیدشده (مانند گزارش تست، خروجی باینری بیلد، یا مستندات) از **Workflow Artifacts** استفاده می‌کنیم:

```text
[ Job 1: Test & Coverage ] ────► actions/upload-artifact ────► [ GitHub Cloud Storage ]
                                                                        │
                                                                 (Retained for days)
                                                                        │
[ Job 2: Notify or Deploy ] ◄─── actions/download-artifact ◄────────────┘
```

### ۱. آپلود کردن Artifact (`actions/upload-artifact`)
```yaml
- name: Run Tests and Generate Coverage Report
  run: pytest --cov=app --cov-report=html

- name: Upload Test Report
  uses: actions/upload-artifact@v4
  with:
    name: test-coverage-report
    path: htmlcov/
    retention-days: 7 # نگهداری گزارش به مدت ۷ روز در گیت‌هاب
```

### ۲. دانلود کردن Artifact در جاب دیگر (`actions/download-artifact`)
```yaml
- name: Download Test Report
  uses: actions/download-artifact@v4
  with:
    name: test-coverage-report
    path: downloaded-reports/
```

کاربران و اعضای تیم نیز می‌توانند این فایل‌ها را مستقیماً از بخش Summary صفحه گردش کار دانلود و مشاهده کنند.

---

## کش‌سازی وابستگی‌ها (Dependency Caching)

تفاوت کلیدی Cache با Artifact در هدف آن‌هاست:
- **Artifact:** برای نگهداری فایل‌های تولیدشده در یک اجرای خاص پایپ‌لاین (ارائه گزارش، پکیج خروجی).
- **Cache:** برای نگهداری وابستگی‌های خارجی (کتابخانه‌ها و پکیج‌ها) در میان اجراهای متعدد، برای جلوگیری از دانلود تکراری از اینترنت.

### سازوکار Cache Key و Restore Key
یک کش بر اساس یک **کلید (Key)** ذخیره می‌شود. اگر فایل `requirements.txt` تغییر نکرده باشد، هش (Hash) آن یکسان می‌ماند و رانر پکیج‌ها را از کش محلی برمی‌دارد (**Cache Hit**):

```yaml
- name: Cache Python dependencies
  uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-
```

- اگر `hashFiles` مطابقت داشته باشد: پکیج‌ها در چند ثانیه از کش لود می‌شوند.
- اگر فایلی تغییر کند: کش جدیدی ساخته شده و در اجراهای بعدی استفاده می‌شود.

> **روش ساده‌تر در اکشن‌های رسمی:**  
> اکشن `actions/setup-python` به صورت پیش‌فرض امکان کش‌سازی دارد:
> ```yaml
> - uses: actions/setup-python@v5
>   with:
>     python-version: '3.11'
>     cache: 'pip' # کش‌سازی خودکار و بهینه‌سازی شده
> ```

---

## بهینه‌سازی زمان اجرا: Concurrency و Timeout

دو تنظیم بسیار مهم و حرفه‌ای برای بهینه‌سازی هزینه‌ها و منابع در فایل گردش کار:

### ۱. لغو اجراهای قدیمی با `concurrency`
فرض کنید توسعه‌دهنده‌ای روی یک PR سه کامیت پیاپی با فاصله ۳۰ ثانیه Push می‌کند. آیا نیاز است هر سه پایپ‌لاین تا انتها اجرا شوند؟ خیر! تنها نتیجه‌ی آخرین کامیت اهمیت دارد. با افزودن بلوک `concurrency`، اجرای کامیت‌های قبلی به‌طور خودکار لغو می‌شود:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### ۲. تعیین سقف زمانی اجرا با `timeout-minutes`
به‌طور پیش‌فرض، اگر دستوری درون پایپ‌لاین به دلیل خطایی معلق بماند (مثلاً منتظر ورودی کاربر یا اتصال ناموفق شبکه شود)، رانر ممکن است تا ۶ ساعت منتظر بماند و تمام سهمیه ماهانه شما را مصرف کند! همیشه برای جاب‌های خود سقف معقول زمانی تعیین کنید:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10 # توقف خودکار جاب پس از ۱۰ دقیقه در صورت گیر افتادن
```

---

## خلاصه درس

- پایپ‌لاین کند، سرعت توسعه و چرخه‌ی بازخورد سریع را تخریب می‌کند.
- از `upload-artifact` و `download-artifact` برای تبادل فایل‌های تولیدی بین Jobها و نگهداری گزارش‌ها استفاده کنید.
- با مکانیزم Cache وابستگی‌های حجیم (مانند کتابخانه‌های پایتون) را ذخیره کنید تا از دانلود مداوم جلوگیری شود.
- با قابلیت `concurrency` و `cancel-in-progress: true` از اجرای بیهوده کامیت‌های منسوخ‌شده جلوگیری کنید.
- با مشخص کردن `timeout-minutes` مانع هدر رفتن منابع رانر در صورت بروز حلقه‌ها یا بن‌بست‌ها شوید.

---

## منابع یادگیری

**مستندات و مقالات**
- [Caching dependencies to speed up workflows — Official Docs](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows) — مستندات جامع کش‌سازی در گیت‌هاب
- [Storing workflow data as artifacts — Official Docs](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts) — نحوه ذخیره و مدیریت آرتیفکت‌ها
