---
title: Pipe، Redirection، جست‌وجو و پردازش متن
weight: 3
description: ترکیب دستورها با Pipe و Redirection، جست‌وجوی فایل و متن با grep و find، و ساختن pipelineهای قابل اتکا
---

## جریان‌های استاندارد

هر فرایند در Linux سه جریان متنی استاندارد دارد:

- **ورودی استاندارد (`stdin`)** — ورودی دستور؛ شماره‌ی توصیف‌گر فایل آن `0` است
- **خروجی استاندارد (`stdout`)** — خروجی عادی دستور؛ شماره‌ی آن `1` است
- **خطای استاندارد (`stderr`)** — پیام خطا؛ شماره‌ی آن `2` است

به‌طور پیش‌فرض، ورودی از صفحه‌کلید و هر دو خروجی در ترمینال دیده می‌شوند. **Redirection** مقصد یا مبدأ این جریان‌ها را تغییر می‌دهد:

```bash
date > today.txt
date >> today.txt
sort < names.txt
find /root -type f 2> errors.txt
command > output.txt 2>&1
```

- `>` فایل را ایجاد یا جایگزین می‌کند؛ در نتیجه پیش از اجرا مطمئن شوید فایل مهمی را بازنویسی نمی‌کنید.
- `>>` خروجی را به انتهای فایل اضافه می‌کند.
- `<` محتویات فایل را ورودی دستور می‌کند.
- `2>` فقط خطاها را به فایل می‌فرستد.
- `2>&1` خطا را به همان مقصدی می‌فرستد که خروجی عادی رفته است.

## Pipe

**Pipe** با `|`، `stdout` یک دستور را به `stdin` دستور بعدی وصل می‌کند. این مدل کوچک و ترکیبی، بخش مهمی از فلسفهٔ Unix است: هر ابزار یک کار محدود را خوب انجام می‌دهد.

```bash
ps aux | grep '[s]shd'
journalctl -u ssh --no-pager | tail -n 20
```

در مثال اول، نوشتن `[s]shd` باعث می‌شود خود فرایند `grep` در نتیجه نمایش داده نشود (چرا؟). در بسیاری از موقعیت‌ها `pgrep sshd` ابزار مناسب‌تر و خواناتری است.

برای دیدن هم‌زمان خروجی در ترمینال و ذخیره‌کردن آن در فایل از `tee` استفاده کنید:

```bash
df -h | tee disk-usage.txt
```

## جست‌وجوی متن با grep

`grep` خط‌های منطبق با یک الگو را چاپ می‌کند. چند گزینهٔ پرکاربرد:

```bash
grep -n "ERROR" app.log
grep -i "warning" app.log
grep -v '^#' config.conf
grep -E 'ERROR|FATAL' app.log
grep -RIn --include='*.conf' 'listen' /etc
```

- `-n` شمارهٔ خط و `-i` جست‌وجوی بدون حساسیت به بزرگی/کوچکی حروف را اضافه می‌کند.
- `-v` خط‌های غیرمنطبق را انتخاب می‌کند؛ نمونهٔ بالا توضیحات را حذف می‌کند.
- `-E` از Extended Regular Expression استفاده می‌کند.
- `-R` در دایرکتوری‌ها بازگشتی جست‌وجو می‌کند و `-I` فایل‌های باینری را نادیده می‌گیرد.

استفاده از `single quote` برای الگوهای regex امن‌تر است؛ به این شکل shell نویسه‌هایی مانند `*` و `?` را پیش از رسیدن به `grep` تغییر نمی‌دهد.

## پیدا کردن فایل‌ها با find

`find` فایل‌ها را بر اساس نام، نوع، زمان، اندازه یا مالک پیدا می‌کند. نقطهٔ آغاز جست‌وجو را تا حد ممکن محدود انتخاب کنید:

```bash
find ~/project -type f -name '*.log'
find /var/log -type f -mtime -7
find /tmp -type f -size +100M
find . -type d -name node_modules -prune
```

- `-type f` فایل و `-type d` دایرکتوری را انتخاب می‌کند.
- `-mtime -7` به فایل‌های تغییرکرده در هفت روز اخیر اشاره دارد.
- `-prune` در مثال آخر مانع ورود به دایرکتوری‌های `node_modules` می‌شود.

اگر خروجی `find` به دستور دیگری می‌رود، با نام‌های دارای فاصله درست رفتار کنید. ترکیب `-print0` و `xargs -0` جداکنندهٔ `NUL` به کار می‌برد و برای همهٔ نام‌های فایل امن است:

```bash
find . -type f -name '*.log' -print0 | xargs -0 grep -nH 'ERROR'
```

در عملیات مخرب، ابتدا نتیجه را فقط نمایش دهید و سپس دستور را اجرا کنید. برای نمونه، پیش از حذف فایل‌های موقت، خروجی این دستور را بررسی کنید:

```bash
find ~/linux-lab -type f -name '*.tmp' -print
```

## تبدیل و خلاصه‌سازی متن

ابزارهای کوچک زیر را کنار هم قرار دهید تا پاسخ یک سؤال عملی را بسازید:

```bash
cut -d: -f1 /etc/passwd
sort access.log | uniq -c | sort -nr
tr '[:lower:]' '[:upper:]' < input.txt
sed -n '1,10p' app.log
awk '{print $1, $7}' access.log
```

- `cut` ستون‌ها را با جداکنندهٔ مشخص استخراج می‌کند.
- `sort` مرتب و `uniq -c` تعداد رخدادهای متوالی را می‌شمارد؛ پس پیش از آن معمولاً `sort` لازم است.
- `tr` نویسه‌ها را تبدیل (ترجمه) می‌کند.
- `sed` برای انتخاب یا جایگزینی خط‌ها و `awk` برای کار با ستون‌ها مناسب‌اند.

این pipeline تعداد IPهای پرتکرار در یک فایل لاگ دسترسی را نشان می‌دهد:

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head
```

pipelineهای طولانی را مرحله‌به‌مرحله بسازید. ابتدا خروجی هر دستور را بررسی کنید، سپس آن را به دستور بعدی وصل کنید. این روش عیب‌یابی را ساده‌تر می‌کند.

## منابع یادگیری

**مستندات و مقالات**

- [GNU Grep Manual](https://www.gnu.org/software/grep/manual/grep.html) — مرجع `grep` و الگوهای جست‌وجو
- [GNU Findutils Manual](https://ftp.gnu.org/old-gnu/Manuals/findutils-4.1/html_mono/find.html) — مرجع `find` و `xargs`
- [The GNU Awk User's Guide](https://www.gnu.org/software/gawk/manual/gawk.html) — مرجع `awk` برای مراجعه هنگام نیاز
- [Bash Redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html) — توضیح دقیق Redirection در Bash

**ویدیو**

- [الپیک ۱ - ۰۲۴ - ۱۰۳.۲ - فیلتر استریم‌های متنی با دستورات گنو (۴ قسمت) - جادی](https://www.youtube.com/watch?v=gQvJGwth71Y&list=PL7ePwBdxM4nswZ62DvL58yJZ9W4-hOLLB&index=24) — آشنایی با فیلتر استریم‌های متنی و مشاهدهٔ محتوای فایل‌ها با دستورهای GNU
- [الپیک ۱ - ۰۲۹ - ۱۰۳.۳ - مدیریت فایل‌ها - بخش ۲/۳ - دستورهای touch، dd، file و find - جادی](https://www.youtube.com/watch?v=r70id-wn01c&list=PL7ePwBdxM4nswZ62DvL58yJZ9W4-hOLLB&index=29) — آموزش کار با `touch`، `dd`، `file` و `find` برای مدیریت فایل‌ها
- [الپیک ۱ - ۰۳۱ - ۱۰۳.۴ - استفاده از استریم‌ها و Redirection آن‌ها در پوسته‌های یونیکسی (۲ قسمت) - جادی](https://www.youtube.com/watch?v=tkSCVzXgVr4&list=PL7ePwBdxM4nswZ62DvL58yJZ9W4-hOLLB&index=32) — آموزش استفاده از streamها و Redirection در shellهای یونیکسی
