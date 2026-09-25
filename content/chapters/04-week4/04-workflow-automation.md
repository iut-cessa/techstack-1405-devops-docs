---
title: ساختن Workflow چندمرحله‌ای
weight: 4
description: تبدیل یک فرایند دستی به workflow خودکار با مراحل مستقل، قابل تست و قابل نگهداری
---

## از فرایند دستی تا Workflow

فرض کنید می‌خواهید یک برنامهٔ وب را deploy کنید. فرایند دستی شما این است:

1. بررسی کنید که کد جدید روی Git هست
2. تست‌ها را اجرا کنید
3. اگر تست‌ها موفق بودند، build بگیرید
4. پیکربندی production را آماده کنید
5. سرویس قدیمی را متوقف کنید
6. فایل‌های جدید را جایگزین کنید
7. سرویس جدید را بالا بیاورید
8. health check انجام دهید
9. اگر سرویس سالم نیست، rollback کنید

این یک **workflow** است — مجموعه‌ای از مراحل مرتبط که باید به‌ترتیب اجرا شوند. حالا می‌خواهیم آن را خودکار کنیم.

## اصول ساختن Workflow

### 1. هر مرحله یک وظیفهٔ مشخص

بهتر است هر مرحله را در یک تابع یا اسکریپت جداگانه قرار دهید:

```bash
#!/usr/bin/env bash
set -euo pipefail

run_tests() {
  echo "Running tests..."
  cd /opt/myapp || exit 1
  npm test
}

build_app() {
  echo "Building application..."
  cd /opt/myapp || exit 1
  npm run build
}

deploy_app() {
  echo "Deploying application..."
  systemctl stop myapp
  cp -r /opt/myapp/dist/* /var/www/html/
  systemctl start myapp
}

health_check() {
  echo "Running health check..."
  sleep 3
  curl -f http://localhost/ > /dev/null
}
```

### 2. مراحل باید مستقل باشند

هر مرحله باید بتواند **به‌تنهایی اجرا** شود و نتیجهٔ خودش را گزارش دهد:

```bash
#!/usr/bin/env bash
set -euo pipefail

check_dependencies() {
  local missing=0
  
  for cmd in git npm systemctl curl; do
    if ! command -v "$cmd" &>/dev/null; then
      echo "ERROR: $cmd not found" >&2
      missing=1
    fi
  done
  
  return $missing
}

# می‌توانید فقط این مرحله را تست کنید
if check_dependencies; then
  echo "All dependencies present"
else
  echo "Some dependencies are missing"
  exit 1
fi
```

### 3. مدیریت وابستگی بین مراحل

بعضی مراحل به خروجی مراحل قبلی نیاز دارند:

```bash
#!/usr/bin/env bash
set -euo pipefail

# مرحله 1: گرفتن آخرین کد
fetch_code() {
  echo "Fetching latest code..."
  cd /opt/myapp || return 1
  git pull origin main
  git rev-parse --short HEAD  # خروجی: commit hash
}

# مرحله 2: ساختن image با commit hash
build_image() {
  local commit_hash="$1"
  echo "Building image with tag: $commit_hash"
  docker build -t "myapp:$commit_hash" .
}

# اجرای workflow
main() {
  local commit_hash
  
  commit_hash=$(fetch_code) || {
    echo "ERROR: Failed to fetch code" >&2
    exit 1
  }
  
  build_image "$commit_hash" || {
    echo "ERROR: Failed to build image" >&2
    exit 1
  }
  
  echo "Build complete: myapp:$commit_hash"
}

main
```

## Workflow کامل: Deployment Pipeline

یک مثال واقعی‌تر که این اصول را رعایت می‌کند:

```bash
#!/usr/bin/env bash
set -euo pipefail

readonly APP_DIR="/opt/myapp"
readonly BACKUP_DIR="/backups"
readonly LOG_FILE="/var/log/deploy.log"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

create_backup() {
  local backup_path="$BACKUP_DIR/app-$(date +%s)"
  log "Creating backup at $backup_path"
  
  mkdir -p "$BACKUP_DIR"
  cp -a "$APP_DIR" "$backup_path"
  echo "$backup_path"
}

fetch_latest_code() {
  log "Fetching latest code"
  cd "$APP_DIR" || return 1
  
  git fetch origin
  local latest_commit
  latest_commit=$(git rev-parse origin/main)
  
  git checkout "$latest_commit"
  echo "$latest_commit"
}

run_tests() {
  log "Running tests"
  cd "$APP_DIR" || return 1
  npm test
}

build_application() {
  log "Building application"
  cd "$APP_DIR" || return 1
  npm run build
}

deploy_new_version() {
  log "Deploying new version"
  systemctl stop myapp
  systemctl start myapp
}

verify_deployment() {
  log "Verifying deployment"
  sleep 5
  
  if systemctl is-active --quiet myapp && \
     curl -f http://localhost:3000/health > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

rollback() {
  local backup_path="$1"
  log "Rolling back to $backup_path"
  
  systemctl stop myapp
  rm -rf "$APP_DIR"
  cp -a "$backup_path" "$APP_DIR"
  systemctl start myapp
}

main() {
  log "Starting deployment pipeline"
  
  # مرحله 1: backup
  local backup_path
  backup_path=$(create_backup) || {
    log "ERROR: Backup failed"
    exit 1
  }
  
  # مرحله 2: fetch code
  local commit_hash
  commit_hash=$(fetch_latest_code) || {
    log "ERROR: Failed to fetch code"
    exit 1
  }
  
  log "Deploying commit: $commit_hash"
  
  # مرحله 3: tests
  if ! run_tests; then
    log "ERROR: Tests failed"
    exit 1
  fi
  
  # مرحله 4: build
  if ! build_application; then
    log "ERROR: Build failed"
    exit 1
  fi
  
  # مرحله 5: deploy
  if ! deploy_new_version; then
    log "ERROR: Deployment failed, rolling back"
    rollback "$backup_path"
    exit 1
  fi
  
  # مرحله 6: verify
  if ! verify_deployment; then
    log "ERROR: Verification failed, rolling back"
    rollback "$backup_path"
    exit 1
  fi
  
  log "Deployment successful"
  rm -rf "$backup_path"
}

main "$@"
```

## Workflow قابل پیکربندی

به‌جای hardcode کردن مقادیر، از environment variable استفاده کنید:

```bash
#!/usr/bin/env bash
set -euo pipefail

# پیکربندی از محیط
readonly ENVIRONMENT="${DEPLOY_ENV:-staging}"
readonly APP_DIR="${APP_DIR:-/opt/myapp}"
readonly SKIP_TESTS="${SKIP_TESTS:-false}"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$ENVIRONMENT] $*"
}

main() {
  log "Starting deployment to $ENVIRONMENT"
  
  # اگر production است، tests را skip نکن
  if [[ "$ENVIRONMENT" == "production" ]]; then
    SKIP_TESTS=false
  fi
  
  if [[ "$SKIP_TESTS" == "false" ]]; then
    run_tests || exit 1
  else
    log "Skipping tests (not recommended)"
  fi
  
  # بقیه workflow...
}

main "$@"
```

استفاده:

```bash
# برای staging
DEPLOY_ENV=staging ./deploy.sh

# برای production
DEPLOY_ENV=production ./deploy.sh

# برای development با skip tests (فقط برای تست محلی!)
DEPLOY_ENV=dev SKIP_TESTS=true ./deploy.sh
```

## تصویرسازی Workflow

مطابق با دانسته‌های فعلی، یک workflow خوب را می‌توان به‌صورت یک نمودار ساده تصور کرد:

```text
┌─────────────────┐
│ Create Backup   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fetch Code     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Run Tests     │────── fail ──┐
└────────┬────────┘               │
         │ pass                   │
         ▼                        │
┌─────────────────┐               │
│     Build       │────── fail ───┤
└────────┬────────┘               │
         │ success                │
         ▼                        │
┌─────────────────┐               │
│     Deploy      │────── fail ───┤
└────────┬────────┘               │
         │ success                │
         ▼                        │
┌─────────────────┐               │
│ Health Check    │────── fail ───┤
└────────┬────────┘               │
         │ pass                   │
         ▼                        │
┌─────────────────┐               │
│    Success      │               │
└─────────────────┘               │
                                  │
         ┌────────────────────────┘
         │
         ▼
┌─────────────────┐
│    Rollback     │
└─────────────────┘
```

هر مرحله می‌تواند موفق یا ناموفق باشد. اگر ناموفق شد، به مسیر rollback می‌رود.

## منابع یادگیری

**مستندات و مقالات**

- [Scripting in DevOps: A Complete Guide from Beginner to Advanced](https://dev.to/prodevopsguytech/scripting-in-devops-a-complete-guide-from-beginner-to-advanced-noa) — راهنمای کامل اسکریپت‌نویسی برای DevOps
- [DevOps Workflow Automation: A Practical Guide for 2026](https://fivenines.io/blog/devops-workflow-automation/) — راهنمای عملی automation در DevOps
- [Build Workflows That Run Themselves](https://www.turbogeek.co.uk/automation-workflows-ai-scripts-2026/) — ساختن workflowهای خودکار
