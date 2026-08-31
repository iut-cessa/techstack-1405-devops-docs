---
title: کار تیمی با Git و GitHub
weight: 3
description: کنترل نسخه، branchها و Pull Requestها + راه‌اندازی کامل Git و GitHub روی سیستم خودتان
---

## مفهوم

**Git** یک سیستم کنترل نسخه (Version Control System) است: تاریخچه‌ی کامل تغییرات کد را نگه می‌دارد، امکان بازگشت و مقایسه‌ی نسخه‌ها را می‌دهد و — مهم‌تر از همه — همکاری چند نفر روی یک کدبیس را ممکن می‌کند. مفاهیم پایه:

- **Repository (ریپو)** — پروژه به‌همراه کل تاریخچه‌اش
- **Commit** — یک واحد تغییر ثبت‌شده با پیام توضیحی
- **Branch (شاخه)** — یک خط کار جدا از نسخه‌ی اصلی برای تغییرات جدید
- **Merge** — ترکیب تغییرات یک شاخه با شاخه‌های دیگر. Conflictها همین‌جا حل می‌شوند

## GitHub Flow

**GitHub** سرویس میزبانی ریپوهای Git و بستر همکاری تیمی است: Pull Request برای پیشنهاد و بازبینی تغییرات، Issue برای پیگیری کارها و صدها ابزار دیگر. گردش کار مورد نیاز ما معمولاً به همین سادگی است:

1. از branchی اصلی یک branchی جدید برای کارتان بسازید
2. تغییرات را با commitهای کوچک و واضح ثبت کنید
3. شاخه را push و یک **Pull Request** باز کنید
4. منتور review می‌کند؛ اصلاح می‌کنید؛ بعد merge می‌شود

این الگو در مستندات GitHub با نام [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) مستند شده است.

## پیام‌های Conventional Commit

پیام commit باید کوتاه و مشخص بگوید چه تغییری انجام شده است. در این دوره از قالب **Conventional Commits** استفاده می‌کنیم:

```text
type(scope): description
```

`type` نوع تغییر است؛ از `feat` برای قابلیت جدید، `fix` برای رفع باگ و `docs` برای تغییر مستندات استفاده کنید. `scope` اختیاری است و بخش مرتبط پروژه را مشخص می‌کند. مثال‌ها:

```text
feat(auth): add login form
fix(api): handle missing user
docs: clarify installation steps
```

## راه‌اندازی

### نصب Git

**Windows:**

از [git-scm.com](https://git-scm.com/download/win) دانلود کنید یا با Windows Package Manager:

```powershell
winget install Git.Git
```

**Linux (Debian/Ubuntu):**

```bash
sudo apt update && sudo apt install git
```

**Linux (RHEL/Fedora/CentOS):**

```bash
sudo dnf install git
```

**macOS:**

```bash
brew install git
```

### تنظیمات اولیه

```bash
git config --global user.name "YOUR NAME"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

### حساب GitHub و Personal Access Token (PAT)

برای اتصال به GitHub از HTTPS و **Personal Access Token (PAT)** استفاده می‌کنیم. GitHub دیگر رمز عبور حساب را برای عملیات Git از طریق HTTPS قبول نمی‌کند.

در GitHub به **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token** بروید. برای ریپوی تمرین، دسترسی آن را فقط به ریپوی موردنظر محدود کنید و در بخش **Repository permissions** این مجوزها را بدهید:

- **Contents: Read and write** — برای clone، pull و push کردن کد
- **Workflows: Read and Write** — برای افزودن و ویرایش فایل‌های `.github/workflows/` در آینده

سپس ریپوی مدنظر را با آدرس HTTPS clone کنید:

```bash
git clone https://github.com/<github-username>/<repo-name>.git
```

هنگام نخستین `git push`، نام کاربری GitHub خود را وارد کنید و در کادر password، **PAT** را paste کنید. هرگز توکن را داخل فایل‌های پروژه، commitها یا چت عمومی قرار ندهید.

راهنمای کامل: [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) و [Caching your GitHub credentials](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git).

## منابع یادگیری

**مستندات و مقالات**

- [Pro Git Book](https://git-scm.com/book/en/v2) — کتاب مرجع Git؛ فصل‌های ۱ تا ۳ برای این هفته کافی‌اند
- [Pro Git — ترجمه فارسی](https://git-scm.com/book/fa/v2) — همان کتاب به فارسی؛ برای شروع سریع‌تر مفید است
- [Git Tutorials — Atlassian](https://www.atlassian.com/git/tutorials) — آموزش گام‌به‌گام مفاهیم Git با تصویر
- [Hello World — GitHub Docs](https://docs.github.com/en/get-started/start-your-journey/hello-world) — اولین تمرین عملی با ریپو، شاخه و PR
- [GitHub Flow — GitHub Docs](https://docs.github.com/en/get-started/using-github/github-flow) — الگوی کار تیمی که در این دوره استفاده می‌کنیم
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) — قرارداد استاندارد برای نوشتن پیام‌های commit
- [Oh Shit, Git!?!](https://ohshitgit.com) — راه‌حل موقعیت‌های «وای چه غلطی کردم!»؛ مرجع نجات‌بخش

**ویدیو**

- [آموزش گیت Git، گیت هاب و گیت لب - جادی/فرادرس](https://faradars.org/courses/fvgit9609-git-github-gitlab) — دوره‌ی کامل برای شروع
- [Git and GitHub for Beginners — freeCodeCamp](https://www.youtube.com/watch?v=mAFoROnOfHs) — دوره‌ی کامل برای شروع
