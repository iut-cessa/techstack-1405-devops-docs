---
title: آشنایی با Ansible (اختیاری)
weight: 7
description: تجربهٔ عملی Configuration Management با Ansible — از نصب تا اجرای اولین Playbook
---

{{% notice style="info" title="بخش اختیاری" %}}
این بخش **اختیاری** است و برای دانشجویانی است که می‌خواهند با Configuration Management و ابزارهای declarative آشنا شوند. البته اختیاری بودن به معنای کم اهمیت بودن نیست؛ در دنیای واقعی، ابزارهایی مثل Ansible بسیار مهم‌اند و دانستن آن‌ها به شما کمک می‌کند درک بهتری از مفاهیم declarative و idempotency داشته باشید.
{{% /notice %}}

## Configuration Management چیست؟

فرض کنید ۱۰ سرور دارید و می‌خواهید روی همهٔ آن‌ها:

- یک پکیج خاص نصب باشد
- یک فایل پیکربندی مشخص وجود داشته باشد
- یک سرویس در حال اجرا باشد

می‌توانید SSH کنید به هر سرور و دستی این کارها را انجام دهید. اما اگر ۱۰۰ سرور داشته باشید؟ یا اگر بخواهید مطمئن شوید همهٔ سرورها **دقیقاً یکسان** پیکربندی شده‌اند؟

**Configuration Management** یعنی تعریف **desired state** — وضعیت مطلوب — و اجازه دادن به یک ابزار که خودش سیستم‌ها را به آن وضعیت برساند.

## چرا Ansible؟

ابزارهای زیادی برای Configuration Management وجود دارند (Ansible، Puppet، Chef، SaltStack)، اما Ansible ساده‌ترین است:

- **Agentless** — نیازی به نصب نرم‌افزار روی سرورهای مدیریت‌شده نیست
- **SSH-based** — از SSH که قبلاً دارید استفاده می‌کند
- **YAML** — syntax ساده و خوانا
- **Idempotent** — می‌توانید playbook را بارها اجرا کنید

## نصب Ansible

روی سیستم کنترل (جایی که Ansible را اجرا می‌کنید):

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y ansible

# تأیید نصب
ansible --version
```

{{% notice style="info" title="نکته" %}}
Ansible را روی سیستمی که می‌خواهید سرورها را از آنجا مدیریت کنید نصب می‌کنید، نه روی خود سرورها. اگر فقط یک VM لینوکس دارید، همان را به‌عنوان control node و managed node استفاده کنید.
{{% /notice %}}

## Inventory — لیست سرورها

Ansible باید بداند روی کدام سرورها کار کند. این لیست در فایل **Inventory** نوشته می‌شود.

یک فایل ساده `inventory.ini` بسازید:

```ini
[local]
localhost ansible_connection=local

[webservers]
192.168.1.10
192.168.1.11

[databases]
192.168.1.20
```

برای تمرین، فقط از `localhost` استفاده می‌کنیم:

```ini
[local]
localhost ansible_connection=local
```

## اولین دستور Ad-Hoc

یک دستور ساده بدون نوشتن playbook:

```bash
ansible -i inventory.ini local -m ping
```

خروجی:

```json
localhost | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

این یعنی Ansible توانست به `localhost` متصل شود.

یک دستور دیگر — اجرای یک command:

```bash
ansible -i inventory.ini local -m command -a "uptime"
```

## اولین Playbook

یک **Playbook** فایل YAML است که مجموعه‌ای از **task**ها را تعریف می‌کند. هر task از یک **module** استفاده می‌کند.

فایل `setup.yml` بسازید:

```yaml
---
- name: Setup basic system
  hosts: local
  become: yes
  tasks:
    - name: Ensure curl is installed
      apt:
        name: curl
        state: present
        update_cache: yes

    - name: Create a directory
      file:
        path: /opt/myapp
        state: directory
        mode: '0755'

    - name: Create a simple file
      copy:
        content: "Hello from Ansible\n"
        dest: /opt/myapp/hello.txt
        mode: '0644'
```

اجرای playbook:

```bash
ansible-playbook -i inventory.ini setup.yml
```

خروجی نشان می‌دهد چه taskهایی **changed** شدند (تغییر کردند) و چه taskهایی **ok** بودند (قبلاً در وضعیت مطلوب بودند).

حالا دوباره همین playbook را اجرا کنید:

```bash
ansible-playbook -i inventory.ini setup.yml
```

این بار همهٔ taskها **ok** هستند — هیچ چیز تغییر نکرده چون سیستم قبلاً در وضعیت مطلوب بوده. این همان **idempotency** است.

## مفاهیم کلیدی Ansible

### 1. Modules

هر task از یک module استفاده می‌کند. چند module پرکاربرد:

- **`apt`/`yum`** — نصب پکیج
- **`copy`** — کپی فایل
- **`file`** — مدیریت فایل و دایرکتوری
- **`systemd`** — مدیریت سرویس
- **`user`** — مدیریت کاربر
- **`command`/`shell`** — اجرای دستور (آخرین راه‌حل)

### 2. Idempotency

بیشتر moduleها idempotent هستند: اگر وضعیت مطلوب قبلاً برقرار باشد، هیچ کاری انجام نمی‌دهند.

```yaml
# این task فقط اگر nginx نصب نباشد، آن را نصب می‌کند
- name: Ensure nginx is installed
  apt:
    name: nginx
    state: present
```

### 3. State

در Ansible شما **state** می‌گویید:

- `state: present` — باید وجود داشته باشد
- `state: absent` — نباید وجود داشته باشد
- `state: started` — سرویس باید running باشد
- `state: stopped` — سرویس باید متوقف باشد

### 4. Handlers

اگر یک task تغییری ایجاد کند، می‌توانید یک handler را trigger کنید:

```yaml
---
- name: Configure nginx
  hosts: local
  become: yes
  tasks:
    - name: Copy nginx config
      copy:
        src: nginx.conf
        dest: /etc/nginx/nginx.conf
      notify: reload nginx

  handlers:
    - name: reload nginx
      systemd:
        name: nginx
        state: reloaded
```

Handler فقط اگر task تغییری ایجاد کرده باشد، اجرا می‌شود.

## مثال عملی: نصب و پیکربندی NGINX

یک playbook کامل که NGINX را نصب، پیکربندی و راه‌اندازی می‌کند:

```yaml
---
- name: Setup nginx web server
  hosts: local
  become: yes
  tasks:
    - name: Ensure nginx is installed
      apt:
        name: nginx
        state: present
        update_cache: yes

    - name: Ensure nginx is running and enabled
      systemd:
        name: nginx
        state: started
        enabled: yes

    - name: Create web root directory
      file:
        path: /var/www/mysite
        state: directory
        owner: www-data
        group: www-data
        mode: '0755'

    - name: Deploy index page
      copy:
        content: |
          <html>
          <head><title>Deployed with Ansible</title></head>
          <body>
            <h1>Hello from Ansible!</h1>
            <p>This page was deployed automatically.</p>
          </body>
          </html>
        dest: /var/www/mysite/index.html
        owner: www-data
        group: www-data
        mode: '0644'

    - name: Configure nginx site
      copy:
        content: |
          server {
              listen 8080;
              server_name _;
              root /var/www/mysite;
              index index.html;
          }
        dest: /etc/nginx/sites-available/mysite
      notify: reload nginx

    - name: Enable nginx site
      file:
        src: /etc/nginx/sites-available/mysite
        dest: /etc/nginx/sites-enabled/mysite
        state: link
      notify: reload nginx

  handlers:
    - name: reload nginx
      systemd:
        name: nginx
        state: reloaded
```

این playbook را به‌عنوان `nginx-setup.yml` ذخیره و اجرا کنید:

```bash
ansible-playbook -i inventory.ini nginx-setup.yml
```

بعد از اجرا، بررسی کنید:

```bash
curl http://localhost:8080
```

باید صفحهٔ HTML را ببینید.

حالا دوباره playbook را اجرا کنید — همه‌چیز **ok** است و handler اجرا نمی‌شود چون هیچ چیز تغییر نکرده.

## Variables

می‌توانید مقادیر را به‌صورت متغیر تعریف کنید:

```yaml
---
- name: Setup nginx
  hosts: local
  become: yes
  vars:
    nginx_port: 8080
    site_name: mysite
  tasks:
    - name: Configure nginx
      copy:
        content: |
          server {
              listen {{ nginx_port }};
              server_name _;
              root /var/www/{{ site_name }};
              index index.html;
          }
        dest: /etc/nginx/sites-available/{{ site_name }}
      notify: reload nginx
```

## یادگیری بیشتر

این فقط یک آشنایی مقدماتی با Ansible بود. موضوعات پیشرفته‌تر:

- **Roles** — سازماندهی playbook برای استفاده مجدد
- **Templates** — فایل‌های پیکربندی پویا با Jinja2
- **Vault** — مدیریت رمزها و secretها
- **Dynamic Inventory** — گرفتن لیست سرورها از cloud provider
- **Ansible Galaxy** — استفاده از roleهای آماده

اما برای این دوره، همین آشنایی کافی است. حالا شما می‌دانید:

- Configuration Management چیست
- Imperative و Declarative در عمل چه تفاوتی دارند
- Idempotency چطور کار می‌کند
- چطور یک ابزار مثل Ansible وضعیت سیستم را مدیریت می‌کند

این مفاهیم در هفته‌های بعد — به‌ویژه Docker Compose و Kubernetes — دوباره ظاهر می‌شوند.

## منابع یادگیری

**مستندات و مقالات**

- [Ansible for Beginners: Complete Getting Started Guide](https://www.ansiblepilot.com/articles/ansible-for-beginners-complete-guide) — راهنمای کامل Ansible برای مبتدی‌ها
- [Ansible Configuration Management](https://ansiblepilot.com/articles/ansible-configuration-management-infrastructure-as-code-guide) — راهنمای Configuration Management با Ansible

**ویدیو**

- [Ansible Tutorial for Beginners - TechWorld with Nana](https://www.youtube.com/watch?v=1id6ERvfozo) —  آموزش مقدماتی Ansible
