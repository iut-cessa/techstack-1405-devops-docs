---
title: Load Balancing
weight: 8
description: مسئله‌ای که Load Balancer حل می‌کند، الگوریتم‌های Round Robin و Least Connections و توزیع بار روی دو Backend با NGINX upstream
---

## مسئله

یک Backend تنها، فقط به اندازه‌ی ظرفیت خودش می‌تواند درخواست سرو کند و اگر همان یکی از کار بیفتد، کل سرویس با آن از دسترس خارج می‌شود — به عبارتی ایجاد SPOF (Single Point of Failure) در بدترین حالت خود. **Load Balancer** دقیقاً همین مشکل را حل می‌کند: درخواست‌ها را بین چند Backend تقسیم می‌کند تا:

- **Horizontal Scaling** داشته باشید — به‌جای یک سرور بزرگ و پرهزینه، چند Backend کوچک‌تر
- **قابلیت اطمینان** داشته باشید — اگر یک Backend از دسترس خارج شود، بقیه‌ی سیستم همچنان کار می‌کند
- **نگهداری بدون قطعی** ممکن شود — برای Update کردن یک عضو، فقط موقتاً از چرخه بیرونش می‌کشید

در واقع، Load Balancer شبیه یک Reverse Proxy است با چند مقصد به‌جای یکی. در دنیای واقعی همین نقش را NGINX، HAProxy، Load Balancerهای ابری و Kubernetes Serviceها بازی می‌کنند — اگرچه پوسته‌ها فرق دارند، اما ایده‌ی زیرینش یکی است.

## الگوریتم‌ها

برای این‌که مشخص شود هر درخواست به کدام Backend برود، چند قاعده‌ی رایج وجود دارد:

- **Round Robin** — به‌ترتیب و چرخشی؛ ساده‌ترین حالت و پیش‌فرض NGINX، و وقتی همه‌ی Backendها هم‌ظرفیت باشند به‌خوبی کار می‌کند
- **Least Connections** — درخواست بعدی به Backendی می‌رود که در همان لحظه کمترین اتصال فعال را دارد؛ برای وقتی مفید است که زمان پردازش درخواست‌ها یکسان نیست

الگوریتم‌های پیچیده‌تر — وزن‌دهی، IP Hash، سنجش سریع‌ترین پاسخ — همه در نهایت ریشه‌شان به همین دو ایده برمی‌گردد؛ برای آشنایی اولیه فعلا همین دو کافی است.

## تمرین: دو Backend و یک Load Balancer

دو Backend ساده روی پورت‌های `8081` و `8082` بالا می‌آوریم که با سرعت‌های متفاوت پاسخ می‌دهند — یکی ۲۰۰ میلی‌ثانیه، دیگری ۵۰۰ میلی‌ثانیه — تا تفاوت الگوریتم‌ها را بهتر ببینیم:

```bash
mkdir -p ~/lb-lab
cd ~/lb-lab

cat > backend1.py << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import time

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        time.sleep(0.2)
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(b'<h1>Backend 8081</h1>\n')
    
    def log_message(self, format, *args):
        pass

HTTPServer(('', 8081), Handler).serve_forever()
EOF

cat > backend2.py << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import time

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        time.sleep(0.5)
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(b'<h1>Backend 8082</h1>\n')
    
    def log_message(self, format, *args):
        pass

HTTPServer(('', 8082), Handler).serve_forever()
EOF

python3 backend1.py &
python3 backend2.py
```

حالا در پیکربندی NGINX یک **upstream** تعریف می‌کنیم و `proxy_pass` را به آن اشاره می‌دهیم، نه به یک Backend مشخص. فایل `/etc/nginx/sites-available/default` را به این شکل تغییر دهید:

```nginx
upstream backend_pool {
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;

    location / {
        proxy_pass http://backend_pool;
    }
}
```

تغییرات را اعمال و آزمایش کنید:

```bash
sudo nginx -t
sudo systemctl reload nginx.service
sleep 1
curl -s http://127.0.0.1/
curl -s http://127.0.0.1/
curl -s http://127.0.0.1/
curl -s http://127.0.0.1/
```

خروجی‌ها یکی‌درمیان `Backend 8081` و `Backend 8082` را نشان می‌دهند — این یعنی Round Robin دقیقاً همان‌طور که انتظار داشتید کار می‌کند.

### تست الگوریتم Least Connections

برای دیدن تفاوت واقعی Least Connections با Round Robin، باید درخواست‌های همزمان بفرستیم تا ببینیم کدام Backend کمتر مشغول است. این اسکریپت کوتاه را بسازید:

```bash
cat > ~/lb-lab/test-lb.sh << 'EOF'
#!/bin/bash
echo "Sending 10 requests with 50ms intervals..." >&2
for i in {0..9}; do
  (
    response=$(curl -s http://127.0.0.1/)
    echo "Request $i: $response"
  ) &
  sleep 0.05
done
wait
EOF

chmod +x ~/lb-lab/test-lb.sh
```

ابتدا با پیکربندی پیش‌فرض (Round Robin) اجرا کنید:

```bash
~/lb-lab/test-lb.sh
```

خروجی را بررسی کنید — باید دقیقاً یکی‌درمیان `Backend 8081` و `Backend 8082` را ببینید. حالا `least_conn;` را به `upstream` اضافه کنید:

```nginx
upstream backend_pool {
    least_conn;
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
}
```

Reload کنید و دوباره تست را اجرا کنید:

```bash
sudo systemctl reload nginx.service
sleep 1
~/lb-lab/test-lb.sh
```

این بار توزیع متفاوت است — چرا؟ به این فکر کنید: Backend اول ۲۰۰ میلی‌ثانیه برای پاسخ زمان می‌برد، دومی ۵۰۰ میلی‌ثانیه. وقتی درخواست‌ها با فاصله‌ی ۵۰ میلی‌ثانیه می‌رسند، چند درخواست همزمان در حال پردازش هستند و کدام Backend زودتر اتصالاتش را آزاد می‌کند؟ Round Robin فقط نوبتی عمل می‌کند، اما Least Connections چه معیاری برای انتخاب Backend دارد؟

یک آزمایش آخر و جذاب: یکی از Backendها را با `Ctrl+C` خاموش کنید و چند بار `curl` بزنید. NGINX به‌طور پیش‌فرض وقتی یک Backend جواب نمی‌دهد، خودکار سراغ Backend بعدی می‌رود — این ساده‌ترین و در‌عین‌حال مؤثرترین شکل fault tolerance است که در این سطح می‌بینید.

## منابع یادگیری

**مستندات و مقالات**

- [NGINX — HTTP Load Balancing](https://nginx.org/en/docs/http/load_balancing.html) — مستند رسمی؛ الگوریتم‌ها و گزینه‌های upstream

**ویدیو**

- [Proxy vs Reverse Proxy vs Load Balancer - TechWorld with Nana](https://www.youtube.com/watch?v=xo5V9g9joFs) — جایگاه هر سه در یک تصویر
