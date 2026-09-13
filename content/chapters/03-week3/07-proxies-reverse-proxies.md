---
title: Proxy و Reverse Proxy
weight: 7
description: تفاوت Forward Proxy و Reverse Proxy، کاربردها و عملی کردن proxy_pass روی NGINX در برابر یک Backend ساده
---

## Forward و Reverse، تفاوت در نمایندگی

هر دو نوع **Proxy** یک واسطه در مسیر درخواست هستند؛ تفاوت اصلی‌شان این است که کدام طرف اصلاً از وجود این واسطه خبر ندارد:

- **Forward Proxy** از طرف کلاینت عمل می‌کند. کلاینت درخواستش را از طریق Proxy به اینترنت می‌فرستد و سرورِ مقصد آدرس واقعی کلاینت را نمی‌بیند، فقط آدرس Proxy را می‌بیند. کاربردهای رایج: فیلتر ترافیک سازمانی، کنترل دسترسی خروجی، Cache کردن محتوای پرتکرار، یا حتی قندشکن 🚬
- **Reverse Proxy** از طرف سرور عمل می‌کند. کلاینت فکر می‌کند مستقیم با خود سرویس صحبت می‌کند، در حالی که درخواستش اول به Reverse Proxy می‌رسد و او آن را به یک Backend داخلی می‌فرستد. کاربردهایش خیلی گسترده‌تر است:

  - **SSL Termination** — TLS فقط در Proxy مدیریت می‌شود و Backendها می‌توانند ساده‌تر بمانند و اصلاً درگیرش نشوند
  - **Cache** — هندل کردن پاسخ‌های پرتکرار بدون این‌که هر بار درخواست‌ها به Backend فرستاده شوند
  - **پنهان‌کردن ساختار داخلی** — کلاینت فقط Proxy را می‌بیند؛ Backendها در شبکه‌ی داخلی مخفی می‌مانند
  - **Routing و Load Balancing** — همان مسیر است، فقط پیچیده‌تر؛ در درس بعد بیشتر در مورد آن صحبت می‌کنیم

در معماری DevOps بیشتر با Reverse Proxy سروکار دارید: تقریباً هر استقراری که NGINX، Traefik یا یک Load Balancer ابری جلوی سرویس گذاشته باشد، دقیقاً از همین الگو استفاده می‌کند.

## Backend آزمایشی

در [درس قبل](06-web-servers.md) NGINX خودش فایل استاتیک را سرو می‌کرد. این بار به‌جای فایل، یک Backend مستقل می‌سازیم — یک HTTP Server کوچک با پایتون که روی پورت 8080 گوش می‌دهد و Headerهای دریافتی را هم چاپ می‌کند:

```bash
mkdir -p ~/proxy-lab
cd ~/proxy-lab
cat > backend.py << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        print(f"\n=== New Request ===")
        print(f"Path: {self.path}")
        print(f"Client IP: {self.client_address[0]}")
        print("Headers:")
        for header, value in self.headers.items():
            print(f"  {header}: {value}")
        print("=" * 30)
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(b'<h1>Backend 8080</h1>')
    
    def log_message(self, format, *args):
        pass

HTTPServer(('', 8080), Handler).serve_forever()
EOF

python3 backend.py
```

این Backend در ترمینال پیش‌زمینه اجرا می‌شود و برای هر درخواست، IP کلاینت و تمام Headerها را نمایش می‌دهد. به کمک [دوست خوبمان tmux](https://www.youtube.com/watch?v=En4wcQnY2Og) و یا اتصال مجزای SSH، در یک ترمینال دوم، مستقیم از این Backend بگیرید تا مطمئن شوید کار می‌کند:

```bash
curl -v http://127.0.0.1:8080/
```

## proxy_pass روی NGINX

حالا NGINX را جلوی این Backend قرار می‌دهیم. فایل `/etc/nginx/sites-available/default` را به این شکل ویرایش کنید:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

`proxy_pass` به NGINX می‌گوید به‌جای خواندن مستقیم از دیسک، هر درخواست را به آدرس Backend بفرستد و پاسخش را عیناً به کلاینت برگرداند. تغییرات را اعمال کنید:

```bash
sudo nginx -t
sudo systemctl reload nginx.service
curl -v http://127.0.0.1/
```

پاسخ از Backend می‌آید (همان `Backend 8080`)، اما شما در واقع به پورت 80 درخواست زده بودید. اگر به ترمینال Backend نگاه کنید، لاگ همان درخواستی که از طرف NGINX رسیده را می‌بینید. این دقیقاً همان چیزی است که از یک Reverse Proxy انتظار دارید: کلاینت فقط با `127.0.0.1:80` کار می‌کند و اصلاً نمی‌داند پشت صحنه پورت 8080 هم درگیر است.

## تمرین: چه چیزی به Backend می‌رسد؟

به لاگ ترمینال Backend نگاه کنید. آدرس IP ثبت‌شده برای درخواست چیست؟ به‌جای IP واقعی کلاینت، همیشه `127.0.0.1` می‌بینید — چون از دید Backend، این درخواست از طرف NGINX آمده، نه از طرف کاربر واقعی. این دقیقاً همان «پنهان‌کردن ساختار داخلی» است که در بالا خواندید، اما این بار از زاویه‌ی معکوس: Backend هم نمی‌داند کلاینت واقعی کیست.

در دنیای واقعی این مشکل‌ساز است — مثلاً برای لاگ‌گیری یا Rate Limiting باید IP واقعی کاربر را داشته باشید. راه‌حل رایج، افزودن Headerهای اضافه به `location` است:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

این تغییر را اضافه کنید، Reload بزنید و دوباره `curl -v http://127.0.0.1/` را اجرا کنید. حالا در خروجی Backend، Headerهای `Host` و `X-Real-IP` را می‌بینید — IP واقعی کلاینت دیگر گم نمی‌شود. همین یک خط کوچک (و موارد مشابه)، یکی از جاهایی است که در استقرار واقعی نباید فراموش شود.

## منابع یادگیری

**مستندات و مقالات**

- [Cloudflare — What Is a Reverse Proxy?](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/) — کاربردهای Reverse Proxy از دید CDN و زیرساخت

**ویدیو**

- [PowerCert — Proxy vs Reverse Proxy Explained](https://www.youtube.com/watch?v=RXXRguaHZs0) — مقایسه‌ی تصویری Forward و Reverse
