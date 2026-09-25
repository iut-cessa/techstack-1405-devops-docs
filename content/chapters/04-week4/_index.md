---
title: هفته ۴ | از Script تا Automation
linkTitle: هفته ۴
type: chapter
weight: 4
description: تبدیل کارهای دستی به automation قابل‌اتکا، اسکریپت‌نویسی برای DevOps، مفاهیم idempotency و repeatability، workflow چندمرحله‌ای، Makefile و آشنایی با Configuration Management
---

تا اینجای دوره، ابزارهای Linux و شبکه را دیدید و توانستید با دستورهای دستی کارها را انجام دهید. اما در دنیای واقعی، هیچ‌کس نمی‌تواند هر روز صبح ۲۰ دستور را به‌ترتیب تایپ کند و مطمئن باشد همیشه درست اجرا می‌شوند. این‌جاست که **automation** وارد می‌شود.

هفته‌ی چهارم پل بین Linux و مباحث بعدی DevOps است: شما یاد می‌گیرید چطور کارهای تکراری را به اسکریپت‌های قابل‌اعتماد تبدیل کنید، workflow چندمرحله‌ای بسازید و با مفاهیمی مثل idempotency و Configuration Management آشنا شوید.

اهداف این هفته:

- **از دستی به خودکار** — تفاوت یک اسکریپت ساده با automation قابل‌اتکا در چیست؟
- **اصول Automation** — repeatability، consistency، idempotency و failure handling
- **Automation با ابزارهای CLI** — استفاده از `curl` و `jq` برای تعامل با APIها و پردازش JSON
- **Workflow چندمرحله‌ای** — ساختن فرایندهای قابل تکرار از مراحل مستقل
- **Makefile و Task Runner** — استانداردسازی دستورهای پروژه با `make`
- **Imperative و Declarative** — دو رویکرد متفاوت به automation
- **آشنایی با Configuration Management** — مفهوم desired state و ابزارهای مدیریت پیکربندی
- **Ansible (اختیاری)** — تجربهٔ عملی automation با Playbook

این هفته تکرار مباحث [هفته‌ی دوم](../02-week2/_index.md) نیست؛ فرض بر این است که با Bash scripting و cron آشنا هستید. اینجا روی **کاربرد آن‌ها در DevOps** تمرکز می‌کنیم: اینکه اسکریپت‌هایتان را چطور بنویسید که در CI/CD و production قابل اعتماد باشند.

در انتهای هفته، شما باید بتوانید یک workflow automation ساده بسازید، بفهمید چه چیزی یک اسکریپت را برای production مناسب می‌کند، و با مفهوم Configuration Management آشنا شوید — دقیقاً همان چیزهایی که برای کار با Docker و CI/CD در هفته‌های بعد نیاز دارید.
