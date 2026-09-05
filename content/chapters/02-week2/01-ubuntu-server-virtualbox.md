---
title: نصب Ubuntu Server در VirtualBox و اتصال SSH
weight: 1
description: ساخت یک VM آزمایشی Ubuntu Server در VirtualBox، نصب اختیاری OpenSSH Server و اتصال SSH از میزبان با NAT Port Forwarding
---

## چرا VM؟

برای این دوره به یک محیط Linux نیاز دارید که بتوانید بدون نگرانی از خراب‌کردن سیستم اصلی، دستورها، سرویس‌ها و پیکربندی‌ها را در آن امتحان کنید. **VirtualBox** یک VM روی سیستم میزبان (Host) شما می‌سازد و **Ubuntu Server** سیستم‌عامل مهمان (Guest) آن خواهد بود.

## پیش‌نیازها

این موارد را پیش از شروع آماده کنید:

- [VirtualBox](https://www.virtualbox.org/wiki/Downloads) را از وب‌سایت رسمی نصب کنید
- فایل ISO نسخه‌ی LTS پشتیبانی‌شدهٔ [Ubuntu Server](https://ubuntu.com/download/server) را دانلود کنید؛ برای دانلود می‌توانید از [میرور مبین‌هاست](https://mirror.mobinhost.com/ubuntu-releases/26.04/ubuntu-26.04.1-live-server-amd64.iso) نیز استفاده کنید
- در تنظیمات BIOS/UEFI سیستم، بررسی کنید که مجازی‌سازی سخت‌افزاری فعال باشد. نام این گزینه ممکن است Intel VT-x یا AMD-V باشد
- دست‌کم 2 گیگابایت RAM آزاد و حدود 25 گیگابایت فضای دیسک برای VM در نظر بگیرید

اگر VirtualBox خطای مربوط به مجازی‌سازی داد یا گزینهٔ Linux 64-bit را نمایش نداد، ابتدا مجازی‌سازی را در BIOS/UEFI بررسی کنید. در ویندوز، Hyper-V یا دیگر هایپروایزرهای فعال نیز ممکن است با VirtualBox تداخل داشته باشند.

## ساخت VM

در VirtualBox روی **New** کلیک کنید و این تنظیمات را اعمال کنید:

1. برای ماشین نامی مانند `devops-lab` انتخاب کنید و Type را `Linux` و Version را `Ubuntu (64-bit)` بگذارید
2. فایل ISO دانلودشده را انتخاب کنید. اگر VirtualBox گزینهٔ **Unattended Installation** را نمایش داد، آن را رد کنید تا مرحله‌های نصب را خودتان ببینید
3. 2 CPU و 2 تا 4 گیگابایت RAM اختصاص دهید. بیشتر از نیمی از منابع سیستم میزبان را به VM ندهید
4. یک دیسک مجازی از نوع `VDI` بدون گزینه‌ی Pre-allocate و اندازهٔ حداقل 20 گیگابایت بسازید
5. پس از ساخت در **Settings → Network**، مطمئن شوید Adapter 1 فعال و روی `NAT` است

NAT به مهمان اجازه می‌دهد به اینترنت دسترسی داشته باشد، بدون اینکه مهمان مستقیماً عضو شبکهٔ محلی شما شود.

## نصب Ubuntu Server

VM را راه‌اندازی کنید و در نصاب این مرحله‌ها را دنبال کنید. نام دقیق چند گزینه ممکن است بین نسخه‌های مختلف Ubuntu Server کمی متفاوت باشد.

1. زبان و چیدمان صفحه‌کلید مناسب را انتخاب کنید
1. در بخش شبکه، اتصال DHCP پیش‌فرض NAT را نگه دارید؛ وجود یک آدرس IPv4 نشانهٔ اتصال درست است
1. اگر پراکسی ندارید، آن را خالی بگذارید. می‌توانید میرور پیش‌فرض Ubuntu را بپذیرید یا برای سرعت بیشتر از [میرور دانشگاه](http://repo.iut.ac.ir/ubuntu/) استفاده کنید
1. در بخش ذخیره‌سازی، گزینهٔ استفاده از تمام دیسک مجازی را انتخاب کنید. این فقط همان دیسک VM را پاک می‌کند، نه دیسک میزبان

{{% notice style="caution" title="هشدار: نصب روی سیستم اصلی" %}}
اگر Ubuntu را مستقیماً روی سیستم خود نصب می‌کنید، **به‌هیچ‌عنوان** گزینهٔ استفاده از تمام دیسک را انتخاب نکنید؛ پارتیشن‌بندی را خودتان و با دقت انجام دهید.
{{% /notice %}}

5. در بخش تنظیم نمایه، یک نام، `hostname` مانند `devops-lab`، نام کاربری کوتاه و گذرواژهٔ قوی بسازید. با کاربر root وارد نشوید
5. در بخش تنظیم SSH، در صورت نیاز می‌توانید **Install OpenSSH server** را انتخاب کنید. اگر این مرحله را رد کردید، در بخش بعد آن را نصب می‌کنیم
5. snapهای سرور پیشنهادی را فعلاً انتخاب نکنید؛ بعداً هر سرویس را آگاهانه نصب می‌کنیم

پس از اتمام نصب، VM را بازراه‌اندازی (Restart) کنید. اگر دوباره نصاب باز شد، در پنجرهٔ VirtualBox از **Devices → Optical Drives → Remove disk from virtual drive** برای جداکردن ISO استفاده کنید و یک‌بار دیگر بازراه‌اندازی کنید.

## نخستین ورود و به‌روزرسانی

با نام کاربری و گذرواژهٔ ساخته‌شده وارد کنسول VM شوید. ابتدا `hostname` و آدرس‌های شبکه را بررسی کنید و سپس فهرست بسته‌ها را به‌روزرسانی کنید:

```bash
hostnamectl
ip -brief address
sudo apt update
sudo apt upgrade
```

خروجی `ip -brief address` معمولاً یک آدرس NAT مانند `10.0.2.15` نشان می‌دهد. این آدرس برای اتصال مستقیم به VM استفاده نمی‌شود؛ در بخش بعد یک local Port Forwarding تعریف می‌کنیم.

## نصب اختیاری OpenSSH Server

اگر OpenSSH را در نصاب انتخاب کرده‌اید، وضعیت سرویس را بررسی کنید.


```bash
sudo systemctl status ssh
sudo ss -tlnp 'sport = :22'
```

در غیر این صورت آن را نصب و فعال کنید:

```bash
sudo apt install openssh-server
sudo systemctl enable --now ssh
sudo systemctl status ssh
sudo ss -tlnp 'sport = :22'
```

سرویس باید `active (running)` باشد و `ss` باید نشان دهد که SSH روی port `22` گوش می‌دهد. اگر UFW را خودتان فعال کرده‌اید، قانون SSH اضافه کنید؛ اگرچه لازم نیست برای این درس UFW فعال باشد:

```bash
sudo ufw status
sudo ufw allow 22/tcp
```

در پیکربندی پیش‌فرض Ubuntu، ورود مستقیم root با SSH فعال نیست. این پیکربندی امن را تغییر ندهید. برای آزمایش‌های این دوره با همان کاربر عادی وارد شوید و در صورت نیاز از `sudo` استفاده کنید.

## SSH Port Forwarding به میزبان

برای اتصال SSH از سیستم میزبان، ابتدا VM را کامل خاموش کنید. سپس در VirtualBox به **Settings → Network → Adapter 1 → Advanced → Port Forwarding** بروید و یک قانون جدید بسازید:

```text
Name:       SSH
Protocol:   TCP
Host IP:    127.0.0.1
Host Port:  2222
Guest IP:   
Guest Port: 22
```

`127.0.0.1` مهم است: فقط سیستم میزبان می‌تواند به این port وصل شود. از `0.0.0.0` استفاده نکنید، مگر اینکه دقیقاً بدانید چرا باید SSH مهمان را در شبکهٔ محلی در دسترس قرار می‌دهید.

VM را دوباره راه‌اندازی کنید. حالا در ترمینال میزبان (سیستم عامل خودتان)، اجرا کنید:

```bash
ssh ubuntu@127.0.0.1 -p 2222
```

در نخستین اتصال، SSH اثرانگشت کلید میزبان را نمایش می‌دهد. فقط اگر `hostname` و تنظیمات VM خودتان را تأیید می‌کنید، پاسخ `yes` بدهید و سپس گذرواژهٔ کاربر Ubuntu را وارد کنید. پس از ورود، اعلان باید `hostname` VM را نشان دهد:

```bash
ubuntu@devops-lab:~$
```

با `exit` از اتصال SSH خارج شوید. پس از بازراه‌اندازی VM، اتصال را دوباره امتحان کنید تا مطمئن شوید سرویس SSH و Port Forwarding rule پایدار هستند.

## عیب‌یابی

- **VirtualBox گزینهٔ Ubuntu 64-bit را ندارد** — مجازی‌سازی را در BIOS/UEFI فعال کنید و تداخل Hyper-V یا هایپروایزر دیگر را بررسی کنید
- **اتصال SSH تایم‌اوت می‌دهد** — مطمئن شوید VM روشن است، Adapter 1 همچنان NAT است و Port Forwarding rule دقیقاً به guest port `22` اشاره می‌کند
- **`Connection refused` دریافت می‌کنید** — در کنسول مهمان، `sudo systemctl status ssh` و سپس `sudo ss -tlnp 'sport = :22'` را بررسی کنید
- **port میزبان در حال استفاده است** — به‌جای `2222` یک port آزاد مانند `2223` انتخاب کنید و همان عدد را در دستور `ssh` به کار ببرید
- **پس از نصب مجدد اثرانگشت تغییر کرده است** — کلید میزبان قدیمی همین VM را از میزبان‌های شناخته‌شده حذف کنید:

```bash
ssh-keygen -R '[127.0.0.1]:2222'
```

بعد از این کار، اتصال را دوباره برقرار کنید و اثرانگشت جدید را فقط پس از تأیید بپذیرید.

## منابع یادگیری

**مستندات و مقالات**

- [Install Ubuntu Server](https://ubuntu.com/tutorials/install-ubuntu-server) — راهنمای رسمی نصب Ubuntu Server
- [OpenSSH Server - Ubuntu Server Documentation](https://documentation.ubuntu.com/server/how-to/security/openssh-server/) — نصب OpenSSH و پیکربندی امن در Ubuntu
- [VirtualBox User Manual - Network Address Translation](https://www.virtualbox.org/manual/ch06.html#network_nat) — رفتار NAT در VirtualBox
- [VirtualBox User Manual - Configuring Port Forwarding with NAT](https://www.virtualbox.org/manual/ch06.html#natforward) — تعریف دقیق Port Forwarding rule
