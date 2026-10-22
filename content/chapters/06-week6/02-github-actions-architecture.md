---
title: معماری و اجزای GitHub Actions
weight: 2
description: بررسی معماری درونی GitHub Actions، ساختار سلسله‌مراتبی Workflowها، انواع رویدادها، Jobها، Stepها و Runnerها
---

## ساختار سلسله‌مراتبی در GitHub Actions

برای تسلط بر GitHub Actions باید با ساختار و الفبای آن آشنا شوید. هر پایپ‌لاین در GitHub Actions از یک معماری سلسله‌مراتبی و دقیق تشکیل شده است:

```text
[ Workflow ] (.github/workflows/ci.yaml)
    │
    ├── Trigger / Event (on: push, pull_request)
    │
    └── Jobs
         ├── Job 1 (e.g. test) ──────────── runs-on: ubuntu-latest
         │     ├── Step 1: actions/checkout
         │     ├── Step 2: actions/setup-python
         │     └── Step 3: run: pytest
         │
         └── Job 2 (e.g. build, needs: test) ── runs-on: ubuntu-latest
               ├── Step 1: actions/checkout
               └── Step 2: docker build ...
```

بیایید هر یک از این اجزا را با جزئیات بررسی کنیم.

---

## ۱. گردش کار (Workflow)

یک **Workflow** یک فرآیند خودکار است که در یک یا چند مرحله وظایف مشخصی را انجام می‌دهد.
- فایل‌های گردش کار در شاخه کد مخزن و در مسیر مشخص `.github/workflows/` قرار می‌گیرند.
- این فایل‌ها با فرمت `YAML` نوشته می‌شوند (مثلاً `ci.yaml` یا `release.yaml`).
- شما می‌توانید چندین Workflow مستقل در یک مخزن داشته باشید؛ مثلاً یکی برای تست خودکار PRها و دیگری برای انتشار نسخه جدید.

---

## ۲. رویدادها و راه‌اندازها (Events & Triggers)

رویدادها مشخص می‌کنند که یک Workflow **چه زمانی** باید اجرا شود. این تنظیمات در بخش `on:` تعریف می‌شوند:

```yaml
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch:
```

رایج‌ترین رویدادها عبارتند از:
- `push`: هنگام ارسال کامیت جدید به شاخه‌ای مشخص.
- `pull_request`: هنگام باز شدن، آپدیت شدن، یا بسته شدن یک درخواست ادغام (PR).
- `workflow_dispatch`: امکان اجرای دستی پایپ‌لاین از طریق دکمه «Run workflow» در واسط وب گیت‌هاب یا CLI.
- `schedule`: اجرای دوره‌ای و زمان‌بندی‌شده بر اساس سینتکس استاندارد `cron` (مشابه آنچه در [هفته دوم](../02-week2/06-bash-scripting-automation.md) آموختید).
- `release`: هنگام انتشار یک نسخه جدید از نرم‌افزار.

---

## ۳. جاب‌ها (Jobs)

هر Workflow شامل یک یا چند **Job** است. هر Job یک واحد مستقل اجرایی است:

- **اجرای موازی (Parallel Execution):** به‌طور پیش‌فرض، اگر چندین Job در یک Workflow تعریف کنید، آن‌ها به‌صورت کاملاً موازی اجرا می‌شوند تا زمان فرآیند کوتاه شود.
- **وابستگی ترتیبی با `needs`:** اگر بخواهید جاب B تنها پس از موفقیت جاب A اجرا شود، از کلمه‌ی کلیدی `needs` استفاده می‌کنید:

```yaml
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Run Tests
        run: echo "Testing..."

  build-and-package:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Build
        run: echo "Building package..."
```

---

## ۴. رانرها (Runners)

هر Job نیازمند یک ماشین پردازشی است که دستورها درون آن اجرا شوند. این ماشین مجازی یا فیزیکی **Runner** نامیده می‌شود و با ویژگی `runs-on:` مشخص می‌گردد:

### رانرهای ابری گیت‌هاب (GitHub-hosted Runners)
گیت‌هاب به‌طور رایگان (با محدودیت زمانی ماهانه برای اکانت‌های استاندارد) ماشین‌های مجازی‌هایی را با سیستم‌عامل‌های مختلف در اختیارتان می‌گذارد:

<div dir="ltr">

- `ubuntu-latest` (یا `ubuntu-24.04` و `ubuntu-22.04`)
- `windows-latest`
- `macos-latest`

</div>

این ماشین‌ها دارای ابزارهای پرکاربرد پیش‌فرضی مانند `git`، `python`، `node` و `curl` هستند و پس از پایان اجرای Job به‌طور کامل از بین می‌روند (Ephemeral)، بنابراین از نظر امنیتی کاملاً ایزوله‌اند.

### رانرهای اختصاصی (Self-hosted Runners)
شما می‌توانید یک ماشین مجازی شخصی یا سرور درون سازمان خود را به عنوان رانر به گیت‌هاب معرفی کنید. این گزینه برای سناریوهایی با نیازمندی‌های سخت‌افزاری خاص، ابزارهای سفارشی، یا شبکه‌های داخلی مفید است، اما مسئولیت نگهداری و امنیت سیستم‌عامل میزبان بر عهده شما خواهد بود.

---

## ۵. گام‌ها (Steps) و اکشن‌ها (Actions)

هر Job از دنباله‌ای از **Stepها** تشکیل شده است که به‌صورت کاملاً متوالی و پشت‌سرهم اجرا می‌شوند. اگر یکی از گام‌ها با خطایی روبرو شود (Exit Code غیر صفر)، به‌طور پیش‌فرض اجرای باقی گام‌ها متوقف می‌شود.

یک گام می‌تواند یکی از دو حالت زیر باشد:

1. **اجرای دستورات خط فرمان (`run`):** اجرای مستقیم دستورهای شل در سیستم‌عامل میزبان:
   ```yaml
   - name: Print current directory
     run: pwd
   ```

2. **استفاده از یک اکشن آماده (`uses`):** قطعه کدهای از پیش نوشته‌شده، تست‌شده و استاندارد توسط جامعه متن‌باز یا خود گیت‌هاب:
   - `actions/checkout@v4`: دریافت کدهای مخزن در رانر
   - `actions/setup-python@v5`: راه‌اندازی نسخه مشخصی از زبان پایتون

---

## نمونه‌ی یک Workflow حداقلی و قابل اجرا

بیایید یک فایل ساده `.github/workflows/hello.yaml` را با هم مرور کنیم:

```yaml
name: Hello CI

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  greeting:
    name: Run Greeting Job
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository code
        uses: actions/checkout@v4

      - name: Display environment info
        run: |
          echo "Current runner OS: $(uname -s)"
          echo "Current working directory: $(pwd)"
          python3 --version
```

هنگامی که این فایل به مخزن Push شود، می‌توانید در تب **Actions** در صفحه گیت‌هاب وضعیت اجرای آن را به‌صورت زنده دنبال کرده و لاگ هر یک از گام‌ها را جداگانه باز کنید و بخوانید.

---

## خلاصه درس

- یک فایل گردش کار (Workflow) در پوشه `.github/workflows/` با فرمت YAML تعریف می‌شود.
- رویدادها (Events) مشخص‌کننده زمان اجرای پایپ‌لاین هستند (`push`, `pull_request`, `workflow_dispatch`).
- هر گردش کار از چند Job تشکیل شده که به‌طور پیش‌فرض موازی اجرا می‌شوند، مگر اینکه با `needs` ترتیب وابستگی برایشان تعیین شود.
- هر Job روی یک Runner اجرا می‌شود که در بیشتر سناریوهای ما `ubuntu-latest` است.
- گام‌های درون هر Job به‌صورت ترتیبی اجرا می‌شوند و می‌توانند دستور مستقیم شل (`run`) یا اکشن‌های reusable باشند (`uses`).

---

## منابع یادگیری

**مستندات و مقالات**
- [Quickstart for GitHub Actions — Official Docs](https://docs.github.com/en/actions/get-started/quickstart) — راهنمای سریع و گام‌به‌گام شروع کار با GitHub Actions

**ویدیو**
- [GitHub Actions Tutorial for Beginners — TechWorld with Nana](https://www.youtube.com/watch?v=R8_veQiYBjI) — آموزش مقدماتی و گام‌به‌گام کار با گیت‌هاب اکشنز
