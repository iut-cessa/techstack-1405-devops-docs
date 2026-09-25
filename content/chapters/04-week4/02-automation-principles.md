---
title: اصول Automation در DevOps
weight: 2
description: Repeatability، Consistency، Idempotency و Failure Handling — چهار اصل کلیدی برای ساختن automation قابل‌اعتماد
---

## چهار اصل کلیدی

وقتی automation را برای production می‌نویسید، چهار مفهوم به شما کمک می‌کنند تا کدی قابل‌اتکا بسازید:

### 1. Repeatability — تکرارپذیری

یک automation خوب باید **هر بار که اجرا می‌شود، نتیجهٔ یکسان** بدهد. اگر اسکریپت شما امروز کار می‌کند اما فردا با همان ورودی خطا می‌دهد، قابل‌اعتماد نیست.

مثال بد:

```bash
# فقط وابسته به زمان اجرا — امکان دارد در روزهای بعد overwrite کند 
backup_file="backup-$(date +%H%M).tar.gz"
tar -czf "$backup_file" /var/www
```

مثال خوب:

```bash
# نام فایل از timestamp کامل ساخته می‌شود
backup_file="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "/backups/$backup_file" /var/www || exit 1
echo "Backup created: $backup_file"
```

### 2. Consistency — یکنواختی

یکنواختی یعنی **در محیط‌های مختلف رفتار یکسان** داشته باشید. اسکریپتی که روی لپ‌تاپ شما کار می‌کند اما روی سرور production شکست می‌خورد، مشکل consistency دارد.

راه‌حل:

- از مسیرهای مطلق استفاده کنید
- dependencyها را چک کنید
- محیط را به‌صورت صریح تنظیم کنید

```bash
#!/usr/bin/env bash
set -euo pipefail

# چک کردن ابزارهای مورد نیاز
for cmd in git systemctl nginx; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: $cmd not found" >&2
    exit 1
  fi
done

# استفاده از مسیر مطلق
APP_DIR="/opt/myapp"
cd "$APP_DIR" || exit 1

# محیط صریح
export PATH="/usr/local/bin:/usr/bin:/bin"
```

### 3. Idempotency — تک‌نتیجه‌بودن

**Idempotency** یعنی اجرای چندباره یک عملیات، همان نتیجهٔ یک‌بار اجرا را می‌دهد. این مفهوم در automation بسیار مهم است چون اجازه می‌دهد اسکریپت را بدون نگرانی از عوارض جانبی دوباره اجرا کنید.

مثال non-idempotent:

```bash
# هر بار یک خط اضافه می‌شود
echo "nameserver 8.8.8.8" >> /etc/resolv.conf
```

مثال idempotent:

```bash
# فقط اگر وجود نداشته باشد، اضافه می‌شود
if ! grep -q "nameserver 8.8.8.8" /etc/resolv.conf; then
  echo "nameserver 8.8.8.8" >> /etc/resolv.conf
fi
```

یک مثال واقعی‌تر:

```bash
#!/usr/bin/env bash
set -euo pipefail

# ایجاد کاربر — فقط اگر وجود نداشته باشد
if ! id myuser &>/dev/null; then
  useradd -r -s /usr/sbin/nologin myuser
  echo "User created"
else
  echo "User already exists"
fi

# ایجاد دایرکتوری — idempotent است
mkdir -p /opt/myapp/data

# نصب پکیج — package manager خودش idempotent است
apt-get install -y nginx
```

Idempotency به شما اجازه می‌دهد اسکریپت را در CI/CD یا به‌عنوان بخشی از recovery اجرا کنید بدون این‌که نگران تغییرات ناخواسته باشید.

### 4. Failure Handling — مدیریت خطا

سیستم‌های واقعی همیشه کامل نیستند: شبکه می‌تواند قطع شود، دیسک پر شود، سرویس پاسخ ندهد. یک automation خوب باید **خطاهای قابل پیش‌بینی را مدیریت** کند:

```bash
#!/usr/bin/env bash
set -euo pipefail

MAX_RETRIES=3
RETRY_DELAY=5

download_with_retry() {
  local url="$1"
  local output="$2"
  local attempt=1

  while [ $attempt -le $MAX_RETRIES ]; do
    echo "Attempt $attempt of $MAX_RETRIES"
    
    if curl -fsSL -o "$output" "$url"; then
      echo "Download successful"
      return 0
    fi
    
    echo "Download failed, retrying in ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
    attempt=$((attempt + 1))
  done

  echo "ERROR: Download failed after $MAX_RETRIES attempts" >&2
  return 1
}

# استفاده
download_with_retry "https://example.com/file.tar.gz" "/tmp/file.tar.gz"
```

یک مثال دیگر — rollback در صورت شکست:

```bash
#!/usr/bin/env bash
set -euo pipefail

deploy_new_version() {
  local backup_dir="/backups/app-$(date +%s)"
  
  # گرفتن backup قبل از تغییر
  echo "Creating backup..."
  cp -a /opt/myapp "$backup_dir"
  
  # متوقف کردن سرویس
  systemctl stop myapp
  
  # تلاش برای deploy نسخه جدید
  if ! git pull origin main; then
    echo "ERROR: Git pull failed, rolling back..." >&2
    rm -rf /opt/myapp
    mv "$backup_dir" /opt/myapp
    systemctl start myapp
    exit 1
  fi
  
  # اگر service بالا نیامد، rollback
  systemctl start myapp
  sleep 2
  
  if ! systemctl is-active --quiet myapp; then
    echo "ERROR: Service failed to start, rolling back..." >&2
    rm -rf /opt/myapp
    mv "$backup_dir" /opt/myapp
    systemctl start myapp
    exit 1
  fi
  
  echo "Deployment successful"
  rm -rf "$backup_dir"
}

deploy_new_version
```

## تمرین: تشخیص مشکلات

این اسکریپت چه مشکلاتی دارد؟

```bash
#!/bin/bash
cd /var/www
rm -rf *
git clone https://github.com/user/repo.git .
npm install
npm run build
service apache2 restart
```

مشکلات:

1. **No error handling**: `set -e` ندارد — اگر `git clone` fail شود، بقیه دستورها اجرا می‌شوند
2. **Destructive without backup**: قبل از `rm -rf *` backup نمی‌گیرد
3. **Not idempotent**: `git clone` دفعهٔ دوم fail می‌شود چون دایرکتوری پر است
4. **No dependency check**: چک نمی‌کند که `git` یا `npm` وجود دارند
5. **No logging**: در صورت خطا، نمی‌دانید در کجا مشکل بوده

نسخهٔ بهتر:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/user/repo.git"
DEPLOY_DIR="/var/www"

# Check dependencies
for cmd in git npm; do
  command -v "$cmd" >/dev/null || { echo "ERROR: $cmd not found" >&2; exit 1; }
done

# Backup before deploy
backup_dir="/backups/www-$(date +%s)"
mkdir -p "$(dirname "$backup_dir")"
cp -a "$DEPLOY_DIR" "$backup_dir"

cd "$DEPLOY_DIR" || exit 1

# Idempotent git pull
if [ -d .git ]; then
  git pull origin main
else
  git clone "$REPO_URL" .
fi

npm install
npm run build

# Restart and verify
systemctl restart apache2
sleep 2

if systemctl is-active --quiet apache2; then
  echo "Deployment successful"
  rm -rf "$backup_dir"
else
  echo "ERROR: Apache failed to start, rolling back" >&2
  rm -rf "$DEPLOY_DIR"
  mv "$backup_dir" "$DEPLOY_DIR"
  systemctl start apache2
  exit 1
fi
```

## منابع یادگیری

**مستندات و مقالات**

- [How to Write Idempotent Bash Scripts](https://arslan.io/2019/07/03/how-to-write-idempotent-bash-scripts/) — راهنمای نوشتن اسکریپت‌های idempotent
- [Idempotency: The Concept Everyone Mentions but Few Implement Correctly](https://dev.to/speaklouder/idempotency-the-concept-everyone-mentions-but-few-implement-correctly-2pbc) — درک عمیق‌تر از idempotency
- [Best Practices for Safe Scripting](https://www.howto-do.it/linux-shell-automation-best-practices-2026/) — راهنمای امنیت و کیفیت در اسکریپت‌نویسی
