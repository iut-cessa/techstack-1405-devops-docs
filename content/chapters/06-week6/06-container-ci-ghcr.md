---
title: خودکارسازی ساخت و انتشار ایمیج داکر
weight: 6
description: اتصال پروژه‌های کانتینری به GitHub Actions، ساخت بهینه‌ی ایمیج، تگ‌گذاری خودکار و انتشار در رجیستری GHCR
---

## اتصال کانتینرهای هفته ۵ به دنیای اتوماسیون CI

در [هفته‌ی پنجم](../05-week5/07-dockerfiles-and-images.md)، با نوشتن `Dockerfile` و ایجاد Multi-stage Build، برنامه‌ی خود را به یک ایمیج سبک و پایدار تبدیل کردید و سپس به صورت دستی دستورهای `docker build` و `docker push` را اجرا نمودید.

اکنون زمان آن رسیده است که این فرآیند را کاملاً به ماشین بسپارید! هر زمان که کدی تست شد و با شاخه اصلی (`main`) ادغام گردید، پایپ‌لاین CI باید به‌طور خودکار:
1. فایل `Dockerfile` را بیلد کند.
2. تگ‌های استاندارد (نسخه‌ی SemVer، هش کامیت و تگ `latest`) را تولید کند.
3. با توکن امنیتی وارد رجیستری **GHCR (GitHub Container Registry)** شود.
4. ایمیج را به رجیستری ابری ارسال (Push) کند.

---

## جعبه‌ابزار استاندارد داکر در GitHub Actions

جامعه Docker مجموعه‌ای از اکشن‌های رسمی، امن و استاندارد را برای این کار توسعه داده است:

1. **`docker/setup-buildx-action`:** فعال‌سازی قابلیت‌های پیشرفته BuildKit در داکر (مانند کش‌سازی هوشمند لایه‌ها و بیلد چندپلتفرمی).
2. **`docker/login-action`:** ورود خودکار و امن به رجیستری‌های کانتینر (Docker Hub یا GHCR).
3. **`docker/metadata-action`:** استخراج خودکار تگ‌ها و برچسب‌های OCI بر اساس وضعیت Git (نام تگ، شاخه، یا هش کامیت).
4. **`docker/build-push-action`:** بیلد نهایی و ارسال ایمیج به رجیستری با استفاده از BuildKit.

---

## احراز هویت در GHCR بدون نیاز به ساخت Secret دستی

همان‌طور که در درس‌های قبل آموختید، با تنظیم دسترسی `packages: write` در بلوک `permissions`، می‌توانید از توکن داخلی `secrets.GITHUB_TOKEN` برای ورود به GHCR استفاده کنید:

```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v4
  with:
    registry: ghcr.io
    username: ${{ github.repository_owner }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

دیگر هیچ نیازی به ایجاد دستی Personal Access Token (PAT) یا تعریف Secret جداگانه در تنظیمات مخزن برای انتشار پکیج‌ها نخواهید داشت.

---

## تگ‌گذاری ایمیج با `docker/metadata-action`

اتکای صرف به یک تگ منفرد مانند `latest` پیگیری تغییرات را دشوار می‌کند؛ چون مشخص نیست دقیقاً کدام کامیت یا نسخه درون کانتینر در حال اجراست و بازگشت (Rollback) به نسخه‌های قبل را هم با مشکل مواجه می‌سازد.

در این دوره و در پایپ‌لاین پروژه، ما ایمیج را در سه سطح مختلف از نسخه‌بندی معنایی (SemVer) به همراه شناسه Git تگ‌گذاری می‌کنیم:

1. **تگ کامل (Full SemVer — `1.0.1`):** مشخص‌کننده دقیق نسخه همراه با پچ؛ برای تثبیت قطعی ایمیج در محیط عملیاتی و امکان بازگشت فوری (Rollback).
2. **ترکیب Major + Minor (`1.0`):** برای دنبال‌کردن جدیدترین پچ‌های درون سری `1.0`.
3. **تگ Major (`1`):** برای دریافت جدیدترین بهبودهای سازگار درون شاخه نگارش ۱.
4. **تگ هش کامیت (`sha-xxxxxxx`):** مشخص‌کننده دقیق کامیت گیت برای تضمین بازتولیدپذیری بیلد.
5. **تگ `latest`:** صرفاً برای شاخه پیش‌فرض و تست‌های سریع در محیط توسعه.

اکشن `docker/metadata-action` به ما اجازه می‌دهد این ترکیب‌ها را بر اساس رویدادهای Git به‌طور خودکار تولید کنیم:

```yaml
- name: Extract Docker metadata
  id: meta
  uses: docker/metadata-action@v6
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      type=sha,format=short,prefix=sha-
      type=raw,value=latest,enable={{is_default_branch}}
      type=semver,pattern={{version}}
      type=semver,pattern={{major}}.{{minor}}
      type=semver,pattern={{major}}
```

با این تنظیم، زمانی که تگ گیت `v1.0.1` را منتشر می‌کنید، به‌طور همزمان تگ کامل `1.0.1`، ترکیب `1.0` و تگ `1` به همراه تگ کوتاه هش کامیت ساخته می‌شوند و خروجی این گام (`steps.meta.outputs.tags`) مستقیماً به اکشن بیلد تزریق می‌گردد.

---

## تسریع بیلد داکر با کش‌سازی لایه‌ها (Layer Caching)

در ماشین‌های محلی، داکر لایه‌های تغییرنیافته Dockerfile را در دیسک سیستم کش می‌کند. اما رانرهای گیت‌هاب پس از هر بار اجرا به‌طور کامل پاکسازی می‌شوند! برای اینکه دانلود مجدد پکیج‌ها در `Dockerfile` در هر بار کامیت زمان‌بر نشود، می‌توان از کش گیت‌هاب اکشنز به عنوان Backend کش BuildKit استفاده کرد:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v7
  with:
    context: .
    push: ${{ github.event_name != 'pull_request' }} # روی PRها فقط بیلد و تست شود و Push نشود
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

تنظیمات `cache-from: type=gha` و `cache-to: type=gha,mode=max` باعث می‌شود لایه‌های کامپایل‌شده به کش ابری گیت‌هاب منتقل شده و بیلد بعدی در چند ثانیه کامل شود.

---

## تزریق شناسنامه و نسخه در زمان ساخت با Build Arguments

یکی از اصول مهندسی کانتینر، **خودکفایی (Self-containment)** ایمیج است. نباید شماره نسخه نرم‌افزار به عنوان متغیر محیطی دستی در سرورهای استقرار یا فایل `compose.yaml` وارد شود؛ زیرا این کار منجر به تداخل و عدم تطابق (Configuration Drift) خواهد شد. بهترین شیوه این است که فرآیند CI نسخه ساخته‌شده را در لایه‌های ایمیج به اصطلاح Bake کند.

برای این کار در `Dockerfile` از دستور `ARG` و تبدیل آن به `ENV` استفاده می‌کنیم:

```dockerfile
# در استیج رانتایم نهایی Dockerfile
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}
```

سپس در پایپ‌لاین GitHub Actions، خروجی نسخه از اکشن متادیتا (`${{ steps.meta.outputs.version }}`) را از طریق پارامتر `build-args` به اکشن بیلد ارسال می‌کنیم:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v7
  with:
    context: .
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    build-args: |
      APP_VERSION=${{ steps.meta.outputs.version }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

با این روش، هر کانتینری که بالا می‌آید بدون وابستگی به تنظیمات محیطی هاست، شماره نسخه واقعی و معتبر خود را گزارش می‌دهد.

---

## نمونه پایپ‌لاین کامل ساخت و انتشار ایمیج

ترکیب جاب‌های تست و بیلد کانتینر در قالب یک پایپ‌لاین کامل:

```yaml
name: CI and Docker Publish

on:
  push:
    branches: [ "main" ]
    tags: [ "v*.*.*" ]
  pull_request:
    branches: [ "main" ]

permissions:
  contents: read
  packages: write

jobs:
  test:
    name: Run Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with:
          python-version: "3.12"
          cache: "pip"
      - run: |
          pip install -r requirements.txt pytest
          pytest tests/

  build-and-push:
    name: Build & Push Container Image
    needs: test
    if: github.event_name == 'push' # تنها در صورت ادغام نهایی روی شاخه اصلی بیلد و منتشر شود
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v4

      - name: Log in to GHCR
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.repository_owner }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v6
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha,format=short,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}

      - name: Build and Push
        uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            APP_VERSION=${{ steps.meta.outputs.version }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## خلاصه درس

- اکشن‌های استاندارد `setup-buildx-action` و `build-push-action` پایه و اساس پایپ‌لاین‌های مدرن داکر هستند.
- با احراز هویت توکن `GITHUB_TOKEN`، بدون نیاز به تولید دستی Secret می‌توان ایمیج‌ها را به رجیستری ابری GHCR منتقل کرد.
- تگ‌گذاری ترکیبی (هش کامیت + نگارش معنایی + latest) تضمین‌کننده ردیابی، قابلیت بازگشت به عقب (Rollback) و سلامت چرخه‌ی استقرار است.
- با فعال‌سازی کش ابری (`cache-from: type=gha`) زمان بیلد ایمیج‌ها به شدت کاهش می‌یابد.

---

## منابع یادگیری

**مستندات و مقالات**
- [Publishing Docker images to GHCR — Official Docs](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images) — راهنمای رسمی گیت‌هاب برای انتشار ایمیج‌ها در رجیستری GHCR
- [Docker Buildx and GitHub Actions — Docker Docs](https://docs.docker.com/build/ci/github-actions/) — مستندات رسمی داکر در خصوص هماهنگی با گیت‌هاب اکشنز

**ویدیو**
- [Automation with Docker for CI/CD Workflows — Docker](https://www.youtube.com/watch?v=7QIA6Ja9xyU) - آموزش رسمی داکر پیرامون خودکارسازی بیلد و انتشار ایمیج‌ها در CI/CD
