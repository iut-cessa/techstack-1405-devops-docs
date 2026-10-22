---
title: طراحی پایپ‌لاین تست و ارزیابی کد
weight: 3
description: ساخت پایپ‌لاین یکپارچه‌سازی مداوم (CI) برای اعتبارسنجی کد، اجرای Linterها، تست با pytest و تست چندمحیطی با Matrix Builds
---

## فلسفه CI در عمل: خطای زودهنگام، اصلاح آسان‌تر

در مهندسی نرم‌افزار اصلی وجود دارد به نام **Shift-Left**: یعنی فعالیت‌های تست و ارزیابی کیفیت را به جای پایان فرآیند (سمت راست نمودار)، تا جای ممکن به ابتدای مسیر توسعه یعنی زمان نوشتن کد (سمت چپ) منتقل کنیم.

یک پایپ‌لاین CI کارآمد باید از ساده‌ترین و سبک‌ترین تست‌ها شروع شود و در صورت موفقیت به سمت تست‌های سنگین‌تر برود:

1. **بررسی نگارش و استایل (Linting):** چند ثانیه طول می‌کشد.
2. **بررسی نوع و فرمت (Type checking & Formatting):** سریع و بدون نیاز به اجرای برنامه.
3. **تست‌های واحد (Unit Tests):** مستقل از سیستم خارجی، سریع و دقیق.
4. **تست‌های ادغام (Integration Tests):** تست‌های نیازمند دیتابیس یا سرویس‌های جانبی.

---

## راه‌اندازی رانتایم و دریافت کد با اکشن‌های رسمی

برای اجرای کدهای زبان‌هایی مثل Python، رانر گیت‌هاب ابتدا باید کد منبع را دانلود کرده و محیط مفسر را آماده سازد:

```yaml
steps:
  - name: Checkout Code
    uses: actions/checkout@v4

  - name: Set up Python
    uses: actions/setup-python@v5
    with:
      python-version: "3.11"
      cache: "pip" # کش‌سازی خودکار وابستگی‌ها
```

- اکشن `actions/checkout@v4` مخزن را با استفاده از Git در محیط رانر شبیه‌سازی می‌کند.
- اکشن `actions/setup-python@v5` نسخه مشخص‌شده از زبان پایتون را در مسیر سیستم (`PATH`) قرار می‌دهد.

---

## گام اول: بررسی استاتیک و اجرای Linterها

ابزارهای Linter بدون اجرای کد، آن را تحلیل می‌کنند تا خطاهای احتمالی، متغیرهای تعریف‌نشده و نقض استانداردهای نگارشی (مانند PEP 8 در پایتون) را شناسایی کنند.

در اکوسیستم پایتون، ابزارهایی مانند `flake8` یا ابزار بسیار پرسرعت `ruff` انتخابی عالی هستند:

```yaml
- name: Install Linting Tools
  run: |
    python -m pip install --upgrade pip
    pip install flake8

- name: Lint with flake8
  run: |
    # توقف در صورت وجود خطاهای نحوی یا نام‌های تعریف‌نشده
    flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
    # اخطار برای سایر موارد با خروجی مناسب
    flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
```

---

## گام دوم: اجرای تست‌های خودکار با `pytest`

پس از اطمینان از صحت استایل، نوبت به تست‌های خودکار می‌رسد. فریم‌ورک استاندارد `pytest` قادر است تمام فایل‌های با الگوی `test_*.py` را در پروژه جستجو کرده و اجرا کند:

```yaml
- name: Install dependencies
  run: |
    if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
    pip install pytest pytest-cov

- name: Run unit tests with pytest
  run: |
    pytest --cov=app tests/
```

اگر هر یک از تست‌ها شکست بخورد، `pytest` با کد خطای غیر صفر (`exit code 1`) خارج می‌شود؛ این امر باعث می‌شود گیت‌هاب سریعاً وضعیت Workflow را با علامت قرمز (❌) علامت‌گذاری کند و مانع ادغام کد معیوب در شاخه اصلی شود.

---

## تست در چند نسخه با Matrix Builds

فرض کنید کتابخانه یا وب‌سرویسی توسعه می‌دهید و می‌خواهید اطمینان حاصل کنید که کد شما هم روی `Python 3.10`، هم `3.11` و هم `3.12` بدون نقص کار می‌کند؛ یا باید روی سیستم‌عامل‌های `ubuntu-latest` و `windows-latest` اجرا شود.

آیا باید برای هر ترکیب یک Job جداگانه کپی و پیست کنید؟ قطعاً خیر! قابلیت شگفت‌انگیز **Matrix Build** این کار را به‌طور خودکار انجام می‌دهد:

```yaml
jobs:
  test:
    name: Test on Python ${{ matrix.python-version }} (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest]
        python-version: ["3.10", "3.11", "3.12"]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pytest
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      - name: Run tests
        run: pytest
```

### ویژگی `fail-fast`
به‌طور پیش‌فرض در استراتژی ماتریکس، `fail-fast: true` است. این یعنی به محض اینکه یکی از ترکیب‌های ماتریکس شکست بخورد، گیت‌هاب بلافاصله تمام Jobهای دیگر آن ماتریکس را لغو (Cancel) می‌کند تا منابع ذخیره شوند. با قرار دادن `fail-fast: false`، تمام ترکیب‌ها تا انتها اجرا می‌شوند تا متوجه شوید آیا شکست فقط به نسخه‌ای خاص محدود است یا عمومی است.

---

## نمونه پایپ‌لاین CI کامل برای تست PRها

در اینجا یک نمونه کامل از فایل `.github/workflows/ci.yaml` را مشاهده می‌کنید که روی تمام Pull Requestهایی که به شاخه اصلی باز می‌شوند اجرا می‌گردد:

```yaml
name: Continuous Integration

on:
  pull_request:
    branches: [ "main" ]
  push:
    branches: [ "main" ]

jobs:
  lint-and-test:
    name: Code Quality & Testing
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install flake8 pytest
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      - name: Run Linter
        run: flake8 . --count --max-line-length=120 --statistics

      - name: Execute Tests
        run: pytest -v
```

با فعال بودن این Workflow، هیچ کدی بدون گذراندن موفق تست‌ها نمی‌تواند با شاخه اصلی ادغام شود.

---

## خلاصه درس

- رویکرد Shift-Left یعنی آوردن تست‌ها و ارزیابی کیفیت به مراحل ابتدایی توسعه تا هزینه‌ی عیب‌یابی کاهش یابد.
- پایپ‌لاین CI را با کارهای سریع و سبک (Linting) شروع کنید و سپس سراغ تست‌های خودکار (Unit Tests) بروید.
- با استفاده از اکشن‌های رسمی `checkout` و `setup-python`، محیط تمیز برای اجرای وابستگی‌ها فراهم می‌شود.
- قابلیت Matrix Builds به شما اجازه می‌دهد کد را همزمان در چند نسخه زبان یا سیستم‌عامل به‌صورت موازی آزمایش کنید.
- رفتار `fail-fast` کنترل می‌کند که آیا بعد از شکست اولین تست ماتریکس بقیه لغو شوند یا ادامه یابند.

---

## منابع یادگیری

**مستندات و مقالات**
- [Using a matrix for your jobs — Official Docs](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs) — مستندات جامع گیت‌هاب در خصوص تنظیمات Matrix
- [Building and testing Python — Official Docs](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-python) — راهنمای رسمی اجرای پروژه‌های پایتونی در گیت‌هاب اکشنز

**ویدیو**
- [Mastering Matrix Jobs in GitHub Actions — Mickey Gousset](https://www.youtube.com/watch?v=Ijz_6vPa8RI) — آموزش کاربردی استفاده از ماتریس برای تست چندمحیطی
