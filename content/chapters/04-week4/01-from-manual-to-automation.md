---
title: از کار دستی تا Automation
weight: 1
description: تفاوت اجرای دستی با automation، ویژگی‌های یک اسکریپت قابل‌اتکا و مفاهیم پایه‌ای برای ساختن automation در DevOps
---

## چرا Automation؟

فرض کنید هر بار که می‌خواهید یک نسخه‌ی جدید از برنامه را deploy کنید، باید این کارها را انجام دهید:

1. سرویس قدیمی را متوقف کنید
2. کد جدید را از Git بگیرید
3. dependencyها را نصب کنید
4. تست‌ها را اجرا کنید
5. build بگیرید
6. پیکربندی را چک کنید
7. سرویس جدید را بالا بیاورید
8. health check انجام دهید

اگر این کارها را دستی انجام دهید، هر بار احتمال خطا وجود دارد: ممکن است یک مرحله را فراموش کنید، ترتیب را اشتباه بزنید یا در یکی از دستورها تایپ غلط داشته باشید. حتی اگر همه‌چیز را یادداشت کنید، باز هم زمان‌بر است و با افزایش تعداد سرورها، غیرممکن می‌شود.

راه‌حل این است که این فرایند را **خودکار** کنید: یک‌بار به‌درستی تعریف می‌کنید، بعد هربار که نیاز دارید، آن را اجرا می‌کنید. نتیجه همیشه یکسان است، سریع‌تر است و خطای انسانی را حذف می‌کند.

## Script ساده vs. Automation قابل‌اتکا

نوشتن یک اسکریپت ساده کار سختی نیست — چند دستور را پشت‌سرهم می‌چینید و اجرا می‌کنید. اما یک **automation قابل‌اتکا** ویژگی‌های بیشتری دارد:

### Exit Status

یک automation خوب وقتی با مشکل مواجه می‌شود، با کد خروج غیرصفر متوقف می‌شود و دلیل را گزارش می‌دهد. در Bash، این کار با `set -e` و بررسی `$?` انجام می‌شود:

```bash
#!/usr/bin/env bash
set -euo pipefail

if ! systemctl is-active --quiet nginx; then
  echo "ERROR: nginx is not running" >&2
  exit 1
fi

echo "nginx is active"
```

اگر `nginx` خاموش باشد، اسکریپت با کد `1` خارج می‌شود و پیام خطا را به `stderr` می‌فرستد. این رفتار به ابزارهای بالاتر (مثل CI/CD) اجازه می‌دهد بفهمند اسکریپت موفق بوده یا نه.

### Arguments و Configuration

اسکریپتی که مسیرها یا مقادیر را hardcode کرده، فقط روی یک سیستم کار می‌کند. یک automation خوب از **متغیرهای محیطی** و **آرگومان‌ها** استفاده می‌کند:

```bash
#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ENV="${1:-staging}"
APP_DIR="${APP_DIR:-/opt/myapp}"

echo "Deploying to $DEPLOY_ENV environment"
echo "App directory: $APP_DIR"

cd "$APP_DIR" || exit 1
git pull origin main
systemctl restart "myapp-$DEPLOY_ENV"
```

حالا می‌توانید این اسکریپت (فرضی) را با `./deploy.sh production` یا با تنظیم `APP_DIR=/srv/app` در محیط‌های مختلف اجرا کنید.

### Error Handling

اگر یکی از مراحل شکست بخورد، چه اتفاقی باید بیفتد؟ آیا باید ادامه دهید یا متوقف شوید؟ یک automation خوب این را مشخص می‌کند:

```bash
#!/usr/bin/env bash
set -euo pipefail

{
    # تلاش برای گرفتن قفل
    if ! flock -n 200; then
        echo "ERROR: Another deployment is running" >&2
        exit 1
    fi

    # اگر تست‌ها fail شدند، deploy نکن
    if ! make test; then
        echo "ERROR: Tests failed" >&2
        exit 1
    fi

    echo "Tests passed, deploying..."
    make deploy
} 200>/var/lock/deploy.lock
```

این اسکریپت از `flock` برای جلوگیری از اجرای هم‌زمان استفاده می‌کند و قبل از deploy، تست‌ها را چک می‌کند.

### Logging و Output

اسکریپتی که فقط کارها را بی‌صدا انجام می‌دهد، وقتی مشکلی پیش می‌آید، عیب‌یابی آن سخت است. یک automation خوب گزارش می‌دهد چه کاری انجام می‌دهد:

```bash
#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >&2
}

log "Starting deployment"
log "Stopping service"
systemctl stop myapp || { log "Failed to stop service"; exit 1; }

log "Pulling latest code"
git pull origin main || { log "Failed to pull code"; exit 1; }

log "Restarting service"
systemctl start myapp || { log "Failed to start service"; exit 1; }

log "Deployment complete"
```

هر خط از log با timestamp همراه است و به `stderr` می‌رود تا با خروجی عادی اسکریپت مخلوط نشود.

## تفاوت Script و Automation در عمل

یک **script** معمولاً کاری را یک‌بار انجام می‌دهد و فرض می‌کند همه‌چیز آماده است. یک **automation** باید:

- چندبار اجرا شود و هربار نتیجهٔ یکسان بدهد (**repeatability**)
- وضعیت فعلی سیستم را چک کند و فقط در صورت نیاز تغییر دهد (**idempotency**)
- خطاهای قابل پیش‌بینی را مدیریت کند
- در محیط‌های مختلف (dev, staging, production) کار کند
- خروجی و لاگ قابل‌فهم داشته باشد

در بخش‌های بعدی، این مفاهیم را با مثال‌های عملی بیشتر می‌بینیم و یاد می‌گیریم چطور workflow چندمرحله‌ای بسازیم که این اصول را رعایت کند.

## منابع یادگیری

**مستندات و مقالات**

- [From Command Runner to Reliable Automation](https://thelinuxcode.com/bash-scripting-in-2026-from-command-runner-to-reliable-automation/) — تبدیل اسکریپت‌های ساده به automation قابل‌اتکا
- [How To Automate Tasks With Bash Scripting](https://www.ninjaone.com/blog/automate-tasks-with-bash-scripting/) — راهنمای خودکارسازی کارهای تکراری با Bash

**ویدیو**

- [Bash Scripting for Beginners - freeCodeCamp](https://www.youtube.com/watch?v=tK9Oc6AEnR4) — آموزش پایهٔ اسکریپت‌نویسی Bash (در صورت نیاز به مرور)
