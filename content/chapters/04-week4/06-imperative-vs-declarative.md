---
title: رویکردهای Imperative و Declarative
weight: 6
description: تفاوت دو رویکرد اساسی در automation و زمان استفاده از هرکدام
---

## دو رویکرد متفاوت

وقتی می‌خواهید یک کار را خودکار کنید، دو راه اصلی دارید:

### Imperative — دستوری

شما **دقیقاً مراحل** را مشخص می‌کنید:

```bash
# اسکریپت imperative
apt-get update
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
echo "server { listen 80; }" > /etc/nginx/sites-available/default
systemctl reload nginx
```

شما به سیستم می‌گویید **چطور** کار را انجام دهد.

### Declarative — اعلانی

شما **وضعیت نهایی** را توصیف می‌کنید:

```yaml
# پیکربندی declarative (مثلاً Ansible)
- name: Ensure nginx is installed and running
  apt:
    name: nginx
    state: present

- name: Ensure nginx is enabled and started
  systemd:
    name: nginx
    state: started
    enabled: yes

- name: Ensure nginx config is present
  copy:
    content: "server { listen 80; }"
    dest: /etc/nginx/sites-available/default
  notify: reload nginx
```

شما به سیستم می‌گویید **چه چیزی** می‌خواهید، نه این‌که چطور.

## تفاوت اصلی

| Imperative | Declarative |
|---|---|
| مراحل را مشخص می‌کنید | نتیجه را مشخص می‌کنید |
| «اینکار را بکن، بعد آن کار را بکن» | «می‌خواهم سیستم این‌طور باشد» |
| اجرا به‌ترتیب | ابزار خودش ترتیب را مدیریت می‌کند |
| اگر دوباره اجرا شود، ممکن است خطا دهد | idempotent — دوباره اجرا امن است |
| مثال: Bash script | مثال: Ansible, Terraform, Kubernetes |

## مثال عملی

فرض کنید می‌خواهید یک فایل پیکربندی را روی سرور قرار دهید.

### رویکرد Imperative:

```bash
#!/usr/bin/env bash
set -euo pipefail

# بررسی کنید فایل وجود دارد یا نه
if [ -f /etc/myapp/config.yml ]; then
  echo "Backing up existing config"
  cp /etc/myapp/config.yml /etc/myapp/config.yml.bak
fi

# کپی فایل جدید
echo "Copying new config"
cp config.yml /etc/myapp/config.yml

# تنظیم مجوزها
echo "Setting permissions"
chown myapp:myapp /etc/myapp/config.yml
chmod 640 /etc/myapp/config.yml

# restart سرویس
echo "Restarting service"
systemctl restart myapp
```

شما باید همهٔ حالت‌ها را مدیریت کنید: فایل وجود دارد؟ backup بگیرید. فایل ندارد؟ فقط کپی کنید.

### رویکرد Declarative:

```yaml
# Ansible playbook
- name: Ensure config file is present
  copy:
    src: config.yml
    dest: /etc/myapp/config.yml
    owner: myapp
    group: myapp
    mode: '0640'
  notify: restart myapp

handlers:
  - name: restart myapp
    systemd:
      name: myapp
      state: restarted
```

شما فقط می‌گویید «این فایل باید آنجا باشد، با این مجوزها». Ansible خودش چک می‌کند که آیا فایل وجود دارد، آیا محتوا یکسان است، آیا مجوزها درست است — و فقط در صورت نیاز تغییر می‌دهد.

## مزایا و معایب

### Imperative

**مزایا:**

- کنترل کامل دارید
- منطق پیچیده راحت‌تر نوشته می‌شود
- debugging ساده‌تر است — خط‌به‌خط می‌بینید چه اتفاقی افتاده

**معایب:**

- باید همهٔ حالت‌ها را خودتان مدیریت کنید
- idempotent کردن سخت است
- اگر اسکریپت نیمه‌کاره متوقف شود، سیستم در وضعیت نامشخصی می‌ماند

### Declarative

**مزایا:**

- Idempotent — می‌توانید بارها اجرا کنید
- خواناتر است — وضعیت نهایی را می‌بینید، نه مراحل
- ابزار خودش مدیریت state را انجام می‌دهد

**معایب:**

- کنترل کمتر دارید
- debugging سخت‌تر است — نمی‌دانید ابزار دقیقاً چه کاری کرده
- یادگیری syntax و قابلیت‌های ابزار زمان می‌برد

## کدام را انتخاب کنیم؟

### از Imperative استفاده کنید وقتی:

- منطق خاص و پیچیده دارید
- workflow چندمرحله‌ای با شرط‌های مختلف دارید
- می‌خواهید سریع یک کار one-off انجام دهید
- تیم با Bash راحت‌تر است

**مثال:** یک deployment pipeline که بسته به نتیجهٔ تست، مسیرهای مختلف دارد.

### از Declarative استفاده کنید وقتی:

- می‌خواهید وضعیت سیستم را مدیریت کنید (configuration management)
- نیاز به idempotency دارید
- می‌خواهید تعداد زیادی سرور را یکسان نگه دارید
- تیم با ابزار configuration management آشنا است

**مثال:** مدیریت پیکربندی ۱۰۰ سرور production با Ansible.

## ترکیب دو رویکرد

در عمل، معمولاً هر دو را با هم استفاده می‌کنید:

```yaml
# Ansible playbook (declarative)
- name: Ensure application is deployed
  hosts: webservers
  tasks:
    # declarative: nginx باید نصب باشد
    - name: Ensure nginx is installed
      apt:
        name: nginx
        state: present

    # imperative: اجرای یک اسکریپت سفارشی
    - name: Run custom deployment script
      script: scripts/deploy.sh
      args:
        creates: /opt/myapp/.deployed

    # declarative: سرویس باید running باشد
    - name: Ensure nginx is running
      systemd:
        name: nginx
        state: started
```

یا برعکس — یک اسکریپت Bash که Ansible را صدا می‌زند:

```bash
#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="$1"

echo "Deploying to $ENVIRONMENT"

# بخش imperative: چک کردن شرایط
if [ "$ENVIRONMENT" == "production" ]; then
  echo "Running pre-production checks..."
  ./scripts/pre-deploy-checks.sh || exit 1
fi

# بخش declarative: اعمال پیکربندی
echo "Applying configuration with Ansible..."
ansible-playbook -i "inventory/$ENVIRONMENT" deploy.yml

# بخش imperative: تست بعد از deploy
echo "Running smoke tests..."
./scripts/smoke-tests.sh
```

## مسیر یادگیری

در این هفته، شما بیشتر با **رویکرد imperative** (Bash scripts) کار کردید. این پایه است و باید آن را بلد باشید.

در بخش اختیاری این هفته، با **Ansible** (یک ابزار declarative) آشنا می‌شوید تا ببینید configuration management چطور کار می‌کند.

در هفته‌های بعد:

<div dir="ltr">

- **Docker Compose**: declarative
- **CI/CD pipelines**: معمولاً declarative (YAML configs)
- **Kubernetes**: کاملاً declarative (YAML manifests)

</div>

بنابراین درک تفاوت این دو رویکرد، به شما کمک می‌کند بفهمید چرا ابزارهای مختلف به شکل متفاوتی کار می‌کنند.

## منابع یادگیری

**مستندات و مقالات**

- [Declarative vs Imperative Automation](https://opsmill.com/blog/declarative-vs-imperative-automation/) — تفاوت دو رویکرد در automation
- [What is Infrastructure as Code (IaC)?](https://www.redhat.com/en/topics/automation/what-is-infrastructure-as-code-iac) — نقش رویکرد declarative در IaC (اختیاری - جهت مطالعه بیشتر)

**ویدیوها**

- [Idempotency in Automation: Why Declarative Approaches Win - OpsMill](https://www.youtube.com/watch?v=zEs7SyUAlfc) — مفهوم idempotency و مزایای رویکرد declarative
