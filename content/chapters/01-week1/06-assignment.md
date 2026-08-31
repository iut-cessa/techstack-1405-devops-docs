---
title: تمرین هفته ۱
weight: 6
description: فورک مخزن دوره، شاخه week-1 و اولین Pull Request شما
---

خروجی این هفته یک **Pull Request** به مخزن تمرین دوره است. منتور شما را به مخزن دعوت می‌کند؛ دعوت‌نامه را از بخش Notifications در GitHub بپذیرید. پیش از شروع، درس [کار تیمی با Git و GitHub](03-git-github.md) را کامل کرده باشید (نصب Git و تنظیم PAT).

## گام ۱ — Fork

از مخزن تمرین دوره یک **Fork** بگیرید (دکمه‌ی `Fork` بالای صفحه‌ی ریپو). فورک، یک کپی از ریپو در حساب خودتان است؛ تغییراتتان را آنجا اعمال می‌کنید.

## گام ۲ — Clone و شاخه‌ی week-1

```bash
# آدرس فورک خودتان را از دکمه‌ی Code بگیرید
git clone https://github.com/<github-username>/<repo-name>.git
cd <repo-name>

# ساخت شاخه‌ی این تمرین
git switch -c week-1
```

در نخستین `git push`، نام کاربری GitHub خود را وارد می‌کنید و به‌جای password از **Personal Access Token (PAT)** خود استفاده می‌کنید.

## گام ۳ — پوشه‌ی خودتان

یک پوشه با **نام کاربری GitHub خودتان** بسازید و داخل آن پوشه‌ی `1/` با یک `README.md`:

```
<your-username>/
└── 1/
    └── README.md
```

محتوای `README.md`: معرفی خودتان باشد — حتی فقط نامتان کافی است.

## گام ۴ — Commit و Push

```bash
git add <your-name>/1/README.md
git commit -m "feat(week-1): introduce myself"
git push origin week-1
```

## گام ۵ — Pull Request

- در GitHub یک PR از `week-1` فورک خودتان به `main` مخزن اصلی دوره باز کنید (GitHub بعد از push همین را پیشنهاد می‌دهد)
- عنوان و توضیح کوتاه بنویسید؛ سپس **منتظر Review منتور بمانید**
- اگر تغییراتی خواسته شد، همان‌جا روی شاخه‌ی `week-1` ادامه دهید و دوباره push کنید — PR خودکار به‌روز می‌شود

## نکته‌ها

- از قالب [Conventional Commits](https://www.conventionalcommits.org) برای پیام commit استفاده کنید: `type(scope): description`؛ مثلاً `feat(week-1): introduce myself`
- PR ها **Merge نمی‌شوند** تا Review شده باشند؛ صبر و بازخورد بخشی از تمرین است
- تأخیر گاهی طبیعی است؛ اما اگر عقب افتادید **سریع اطلاع دهید** — یادتان باشد انباشته‌شدن خطرناک است
