---
title: Automation با curl و jq
weight: 3
description: استفاده از curl برای تعامل با APIها و jq برای پردازش JSON در اسکریپت‌های automation
---

## چرا curl و jq؟

در دنیای امروز بسیاری از سرویس‌ها و ابزارها از طریق **REST API** با هم ارتباط برقرار می‌کنند. شما ممکن است بخواهید:

- وضعیت یک deployment را از CI/CD سیستم بگیرید
- یک notification به Slack بفرستید
- اطلاعات یک سرور را از Cloud Provider بخوانید
- یک webhook را trigger کنید

این کارها همه با **HTTP request** انجام می‌شوند و پاسخ معمولاً **JSON** است. دو ابزار کلیدی برای این کار:

- **`curl`** — ارسال HTTP request
- **`jq`** — خواندن و پردازش JSON

## curl: ارسال HTTP Request

`curl` یکی از رایج‌ترین ابزارهای خط فرمان برای کار با APIها است. در [هفته‌ی سوم](../03-week3/04-tcp-http.md) با آن آشنا شدید، اما اینجا روی استفاده در automation تمرکز می‌کنیم.

### GET Request

ساده‌ترین حالت، خواندن داده:

```bash
curl -s https://api.github.com/users/torvalds
```

- `-s`: silent mode — progress bar را نشان نمی‌دهد

خروجی یک JSON است. برای دیدن فقط status code:

```bash
curl -s -o /dev/null -w "%{http_code}" https://api.github.com/users/torvalds
```

### POST Request با JSON

برای ارسال داده به API:

```bash
curl -X POST https://httpbin.org/post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"version": "v1.2.3", "environment": "production"}'
```

- `-X POST`: متد HTTP
- `-H`: اضافه کردن header
- `-d`: بدنهٔ request (data)

### Error Handling در curl

به‌طور پیش‌فرض، `curl` حتی اگر سرور `404` یا `500` برگرداند، exit code `0` می‌دهد. برای automation باید این رفتار را تغییر دهید:

```bash
# با -f، کدهای خطا باعث exit code غیرصفر می‌شوند
if curl -fsSL https://api.example.com/health -o /dev/null; then
  echo "Service is healthy"
else
  echo "ERROR: Service health check failed" >&2
  exit 1
fi
```

- `-f`: fail on HTTP errors (4xx, 5xx)
- `-S`: در صورت خطا، پیام را نشان بده
- `-L`: redirect را دنبال کن

## jq: پردازش JSON

وقتی یک API پاسخ JSON می‌دهد، نیاز دارید بخش‌های خاصی از آن را استخراج کنید. `jq` دقیقاً برای این کار ساخته شده.

### نصب jq

در هفته‌ی دوم احتمالاً آن را نصب کردید، اما اگر نه:

```bash
command -v jq || sudo apt install -y jq
```

### استخراج یک فیلد

فرض کنید این JSON را دارید:

```json
{
  "name": "nginx",
  "version": "1.24.0",
  "status": "running"
}
```

برای گرفتن فقط `version`:

```bash
echo '{"name":"nginx","version":"1.24.0","status":"running"}' | jq -r '.version'
```

خروجی:

```text
1.24.0
```

- `.version`: مسیر فیلد در JSON
- `-r`: raw output (بدون quote)

### کار با Array

فرض کنید لیست deploymentها را می‌خواهید:

```json
[
  {"id": 1, "status": "success"},
  {"id": 2, "status": "failed"},
  {"id": 3, "status": "success"}
]
```

گرفتن همهٔ `id`ها:

```bash
echo '[{"id":1,"status":"success"},{"id":2,"status":"failed"}]' | jq -r '.[].id'
```

خروجی:

```text
1
2
```

فیلتر کردن فقط موفق‌ها:

```bash
jq -r '.[] | select(.status == "success") | .id'
```

## مثال عملی: چک کردن وضعیت CI

فرض کنید می‌خواهید وضعیت آخرین GitHub Actions workflow را بررسی کنید:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="owner/repo"
TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN not set}"

# گرفتن آخرین workflow run
response=$(curl -fsSL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/actions/runs?per_page=1")

# استخراج status با jq
status=$(echo "$response" | jq -r '.workflow_runs[0].status')
conclusion=$(echo "$response" | jq -r '.workflow_runs[0].conclusion')

echo "Workflow status: $status"
echo "Conclusion: $conclusion"

if [[ "$conclusion" != "success" ]]; then
  echo "ERROR: Last workflow did not succeed" >&2
  exit 1
fi

echo "All checks passed"
```

## مثال عملی: ارسال Notification به Slack

Slack webhook را می‌توان برای ارسال پیام استفاده کرد:

```bash
#!/usr/bin/env bash
set -euo pipefail

WEBHOOK_URL="${SLACK_WEBHOOK_URL:?SLACK_WEBHOOK_URL not set}"
MESSAGE="$1"

payload=$(jq -n --arg text "$MESSAGE" '{text: $text}')

if curl -fsSL -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$payload" > /dev/null; then
  echo "Notification sent"
else
  echo "ERROR: Failed to send notification" >&2
  exit 1
fi
```

استفاده:

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
./notify.sh "Deployment to production completed successfully"
```

توجه کنید که payload را با `jq -n` ساختیم — این روش امن‌تر از string interpolation است چون `jq` خودش escape می‌کند.

## ساختن JSON با jq

به‌جای نوشتن JSON به‌صورت دستی، می‌توانید با `jq` بسازید:

```bash
#!/usr/bin/env bash

version="v1.2.3"
environment="production"
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

payload=$(jq -n \
  --arg ver "$version" \
  --arg env "$environment" \
  --arg ts "$timestamp" \
  '{
    version: $ver,
    environment: $env,
    deployed_at: $ts
  }')

echo "$payload"
```

خروجی:

```json
{
  "version": "v1.2.3",
  "environment": "production",
  "deployed_at": "2026-09-17T10:30:00Z"
}
```

این روش امن‌تر است چون نیازی به escape کردن دستی quote یا newline ندارید.

## تمرین

1. یک درخواست به `https://api.github.com/users/YOUR_USERNAME` بفرستید و با `jq` فقط فیلدهای `name` و `public_repos` را نمایش دهید
2. همان API را فراخوانی کنید و اگر `public_repos` بیشتر از 10 بود، پیام موفقیت چاپ کنید، در غیر این صورت با exit code `1` خارج شوید
3. یک اسکریپت بنویسید که یک health check endpoint را فراخوانی کند و اگر status code چیزی غیر از `200` بود، با `curl` retry کند (حداکثر 3 بار)
   ```bash
   curl -i https://ec2.us-east-1.amazonaws.com/ping
   ```

## منابع یادگیری

**مستندات و مقالات**

- [Shell Script API Calls: Use curl in Scripts for Automation](https://www.commandinline.com/shell-script-api-calls-curl/) — استفاده از curl در اسکریپت‌های automation
- [Bash REST API with curl + jq](https://www.golinuxcloud.com/bash-curl-api/) — ترکیب curl و jq برای کار با APIها
- [How to use jq with curl to explore an API's JSON response](https://oliviac.dev/blog/how-to-use-jq-with-curl/) — راهنمای عملی استفاده از jq با curl

**ویدیو**

- [Introduction to jq - Lightweight and Flexible Command-Line JSON Processor](https://www.classcentral.com/course/youtube-an-introduction-to-the-lightweight-and-flexible-command-line-json-processor-jq-120891) — آموزش کامل jq
