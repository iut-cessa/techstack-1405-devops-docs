---
title: اسکریپت‌نویسی Bash و خودکارسازی
weight: 6
description: نوشتن اسکریپت‌های قابل اتکای Bash و زمان‌بندی کارهای تکراری با cron و systemd timer
---

## از دستور تا اسکریپت

وقتی چند دستور را بارها با ترتیب مشخص اجرا می‌کنید، شاید بد نباشد آن‌ها را در یک **اسکریپت Bash** قرار دهید. اسکریپت باید ورودی روشن، خروجی قابل بررسی و رفتار قابل پیش‌بینی داشته باشد. نخستین خط (Shebang)، مفسر مورد نیاز را مشخص می‌کند:

```bash
#!/usr/bin/env bash

printf 'Hello, %s!\n' "$USER"
```

فایل را با پسوند `.sh` ذخیره و به آن مجوز اجرا بدهید:

```bash
chmod u+x report.sh
./report.sh
bash report.sh
```

اجرای `./report.sh` به مجوز اجرا نیاز دارد؛ اجرای `bash report.sh` محتوا را به Bash می‌دهد و به این مجوز نیاز ندارد.

## متغیرها، quoteها و آرگومان‌ها

در Bash فاصله اطراف `=` مجاز نیست. تقریباً همیشه متغیرها را در `double quote` قرار دهید تا فاصله‌ها و globها باعث شکستن ورودی نشوند:

```bash
name="system report"
output_dir="${1:-$HOME/reports}"
printf '%s\n' "$name"
mkdir -p "$output_dir"
```

- `$1` نخستین آرگومان اسکریپت است.
- `${1:-value}` اگر آرگومان خالی یا ناموجود باشد، مقدار پیش‌فرض می‌دهد.
- `double quote` اجازهٔ بسط متغیر را می‌دهد؛ `single quote` متن را دقیقاً همان‌طور که نوشته شده نگه می‌دارد.

کد خروج `0` یعنی موفقیت و مقدار غیرصفر یعنی خطا. ورودی را در ابتدای اسکریپت بررسی کنید:

```bash
if (( $# > 1 )); then
  printf 'Usage: %s [output-directory]\n' "$0" >&2
  exit 2
fi
```

`>&2` پیام راهنما را به stderr می‌فرستد تا خروجی عادی اسکریپت قابل استفاده در pipeline بماند.

## شرط، حلقه و تابع

این سه ساختار برای بیشتر اسکریپت‌های کوتاه کافی‌اند:

```bash
is_regular_file() {
  [[ -f "$1" ]]
}

for file in "$@"; do
  if is_regular_file "$file"; then
    printf 'file: %s\n' "$file"
  else
    printf 'skipped: %s\n' "$file" >&2
  fi
done
```

- `[[ ... ]]` ساختار شرط Bash است و نسبت به `[` در اسکریپت Bash رفتار قابل پیش‌بینی‌تری دارد.
- `"$@"` آرگومان‌ها را جدا از هم و بدون خراب‌کردن فاصله‌ها نگه می‌دارد.
- تابع‌ها، تکرار را کم و نام هر بخش از منطق را روشن می‌کنند.

## اسکریپت قابل اتکا

برای اسکریپت‌های خودکارسازی، خطا و متغیر تعریف‌نشده را نادیده نگیرید:

```bash
#!/usr/bin/env bash
set -euo pipefail

output_dir="${1:-$HOME/system-reports}"
timestamp="$(date +%F-%H%M%S)"
report="$output_dir/report-$timestamp.txt"

mkdir -p "$output_dir"

{
  printf 'Generated: %s\n\n' "$(date --iso-8601=seconds)"
  printf '== Disk usage ==\n'
  df -h
  printf '\n== Memory usage ==\n'
  free -h
  printf '\n== Failed systemd units ==\n'
  systemctl --failed --no-legend || true
} > "$report"

printf 'Report written to %s\n' "$report"
```

- `-e` در نخستین خطای کنترل‌نشده اسکریپت را متوقف می‌کند.
- `-u` استفاده از متغیر تعریف‌نشده را خطا می‌داند.
- `pipefail` باعث می‌شود شکست دستورهای ابتدای pipeline پنهان نشود.
- `|| true` در مثال بالا عمدی است: نداشتن unit ناموفق، لاگ را شکست نمی‌دهد.

پیش از استفادهٔ خودکار، اسکریپت را با ورودی عادی، مسیر دارای فاصله و ورودی نامعتبر آزمایش کنید. [ShellCheck](https://www.shellcheck.net/) خطاهای رایج Bash را پیش از اجرا پیدا می‌کند.

## زمان‌بندی کارها

برای کارهای شخصی و ساده، `cron` زمان‌بندی مبتنی بر پنج ستون دارد:

```text
minute hour day-of-month month day-of-week command
```

برای ویرایش jobهای کاربر فعلی، `crontab -e` را اجرا کنید. این نمونه هر روز ساعت ۹ لاگ را می‌سازد:

```cron
0 9 * * * /home/ubuntu/bin/system-report  >> /home/ubuntu/system-report.log 2>&1
```

{{% notice style="info" title="نمونهٔ فرضی" %}}
`/home/ubuntu/bin/system-report` در این مثال یک اسکریپت فرضی است؛ آن را با مسیر اسکریپت واقعی خودتان جایگزین کنید.
{{% /notice %}}

محیط `cron` محدود است؛ مسیرهای مطلق، متغیرهای محیطی صریح و ثبت خروجی و خطا ضروری‌اند. نام کاربر و مسیر نمونه را با مقدار واقعی سامانهٔ خودتان جایگزین کنید.

برای سرویس‌های سامانه، **systemd timer** معمولاً انتخاب مناسب‌تری است: وضعیت و لاگ آن با ابزارهای آشنا دیده می‌شود و می‌تواند اجرای ازدست‌رفته هنگام خاموش‌بودن سامانه را جبران کند. این timer روزانه سرویس هم‌نام را اجرا می‌کند:

```ini
# /etc/systemd/system/system-report.timer
[Unit]
Description=Run the daily system report

[Timer]
OnCalendar=*-*-* 09:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

سرویس متناظر باید `ExecStart` را با مسیر مطلق اسکریپت تعریف کند. پس از ایجاد یا تغییر unitها، پیکربندی را بازبارگذاری و timer را فعال کنید:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now system-report.timer
systemctl list-timers
journalctl -u system-report.service
```

خودکارسازی خوب فقط «خودکار اجراشدن» نیست: باید تکرارپذیر، قابل مشاهده و تا حد ممکن [idempotent](https://arslan.io/2019/07/03/how-to-write-idempotent-bash-scripts/) باشد.

## منابع یادگیری

**مستندات و مقالات**

- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html) — مرجع زبان و رفتار Bash
- [ShellCheck](https://www.shellcheck.net/wiki/) — راهنمای خطاها و پیشنهادهای ShellCheck
- [crontab Manual](https://man7.org/linux/man-pages/man5/crontab.5.html) — قالب و رفتار کارهای cron
- [systemd.timer Manual](https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html) — تعریف و زمان‌بندی timerهای systemd

**ویدیو**

- [Bash Scripting for Beginners - freeCodeCamp](https://www.youtube.com/watch?v=tK9Oc6AEnR4) — آموزش پایهٔ اسکریپت‌نویسی Bash
- [الپیک ۱ - ۰۵۲ - ۱۰۵.۲ - مقدمات shell scripting شامل shebang، متغیرها و اجرا (۲ قسمت) - جادی](https://www.youtube.com/watch?v=VeFp-nxQ2Io&list=PL7ePwBdxM4nswZ62DvL58yJZ9W4-hOLLB&index=53) — آشنایی با ساخت و اجرای shell script، shebang و متغیرها
- [الپیک ۱ - ۰۵۹ - ۱۰۷.۲ - برنامه‌ریزی و زمان‌بندی کارها از طریق cron، at و timerهای systemd - جادی](https://www.youtube.com/watch?v=-14zmcK-rEU&list=PL7ePwBdxM4nswZ62DvL58yJZ9W4-hOLLB&index=60) — زمان‌بندی کارها با cron، at و timerهای systemd
