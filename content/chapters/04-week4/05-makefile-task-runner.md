---
title: Makefile و Task Runner
weight: 5
description: استفاده از Makefile برای استانداردسازی دستورهای پروژه و ساختن یک interface یکنواخت برای کارهای تکراری
---

## چرا Makefile؟

وقتی روی یک پروژه کار می‌کنید، مجموعه‌ای از دستورهای تکراری دارید که باید بارها اجرا شوند:

```bash
npm install
npm run lint
npm test
npm run build
docker build -t myapp .
docker push myapp
```

مشکل این است که:

- باید همهٔ این دستورها را به خاطر بسپارید
- وقتی عضو جدیدی به تیم می‌پیوندد، باید آن‌ها را یاد بگیرد
- اگر دستوری عوض شود، باید همه را مطلع کنید
- در CI/CD باید دقیقاً همان دستورها را تکرار کنید

**Makefile** این مشکل را حل می‌کند: شما دستورهای پروژه را یک‌بار در `Makefile` تعریف می‌کنید، بعد همه فقط `make test` یا `make build` می‌زنند.

## Makefile چیست؟

`make` اصلاً برای compile کردن برنامه‌های C/C++ ساخته شده، اما امروزه بیشتر به‌عنوان **task runner** استفاده می‌شود — ابزاری برای اجرای دستورهای استاندارد پروژه.

یک `Makefile` از **target**ها تشکیل شده. هر target یک نام دارد و یک یا چند دستور:

```makefile
test:
	npm test

build:
	npm run build

deploy:
	./scripts/deploy.sh
```

حالا به‌جای یادآوری دستور دقیق، فقط می‌زنید:

```bash
make test
make build
make deploy
```

## ساختار Makefile

یک Makefile ساده:

```makefile
# این یک comment است

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make install  - Install dependencies"
	@echo "  make test     - Run tests"
	@echo "  make build    - Build the application"

.PHONY: install
install:
	npm install

.PHONY: test
test:
	npm test

.PHONY: build
build:
	npm run build
```

نکات مهم:

- **Tab، نه Space**: خطوط دستور باید با Tab شروع شوند (نه space)
- **`.PHONY`**: به `make` می‌گوید این target یک فایل نیست، یک دستور است
- **`@`**: جلوی دستور باعث می‌شود خود دستور چاپ نشود، فقط خروجی‌اش

## Target با Dependency

یک target می‌تواند به targetهای دیگر وابسته باشد:

```makefile
.PHONY: all
all: clean install test build

.PHONY: clean
clean:
	rm -rf dist node_modules

.PHONY: install
install:
	npm install

.PHONY: test
test:
	npm test

.PHONY: build
build:
	npm run build
```

حالا وقتی `make all` می‌زنید، به‌ترتیب اجرا می‌شود:

```text
make clean
make install
make test
make build
```

## استفاده از Variable

می‌توانید متغیر تعریف کنید:

```makefile
APP_NAME := myapp
VERSION := $(shell git rev-parse --short HEAD)
DOCKER_REGISTRY := ghcr.io/myorg

.PHONY: docker-build
docker-build:
	docker build -t $(DOCKER_REGISTRY)/$(APP_NAME):$(VERSION) .

.PHONY: docker-push
docker-push:
	docker push $(DOCKER_REGISTRY)/$(APP_NAME):$(VERSION)

.PHONY: docker-all
docker-all: docker-build docker-push
```

- `:=`: تعریف متغیر
- `$(shell ...)`: اجرای یک دستور و قرار دادن خروجی در متغیر
- `$(VAR)`: استفاده از متغیر

## مثال واقعی: Makefile یک پروژهٔ Node.js

```makefile
.DEFAULT_GOAL := help

APP_NAME := myapp
VERSION := $(shell git describe --tags --always --dirty)
NODE_ENV := production

.PHONY: help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Available targets:"
	@echo "  install       Install dependencies"
	@echo "  lint          Run linter"
	@echo "  test          Run tests"
	@echo "  build         Build for production"
	@echo "  dev           Run development server"
	@echo "  clean         Remove build artifacts"
	@echo "  docker-build  Build Docker image"
	@echo "  all           Run lint, test, and build"

.PHONY: install
install:
	npm ci

.PHONY: lint
lint:
	npm run lint

.PHONY: test
test:
	npm test

.PHONY: build
build:
	NODE_ENV=$(NODE_ENV) npm run build

.PHONY: dev
dev:
	npm run dev

.PHONY: clean
clean:
	rm -rf dist node_modules coverage

.PHONY: docker-build
docker-build:
	docker build -t $(APP_NAME):$(VERSION) .

.PHONY: all
all: lint test build
```

استفاده:

```bash
# نصب dependencies
make install

# اجرای تست
make test

# ساخت برای production
make build

# همهٔ مراحل پیش از deploy
make all

# ساخت Docker image
make docker-build
```

## چرا Makefile در DevOps؟

### 1. Interface یکنواخت

تیم شما ممکن است پروژه‌هایی با زبان‌های مختلف داشته باشد:

<div dir="ltr">

- Node.js → `npm test`
- Python → `pytest`
- Go → `go test ./...`

</div>

با Makefile، همهٔ پروژه‌ها interface یکسان دارند:

```bash
make test    # در هر پروژه‌ای
make build   # در هر پروژه‌ای
```

### 2. Reproducibility

دستورات دقیق در یک جا نوشته شده‌اند. هم developer محلی و هم CI/CD از همان دستورها استفاده می‌کنند:

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: make install
      - run: make test
      - run: make build
```

### 3. مستندسازی

یک Makefile خوب با `help` خودش را مستند می‌کند:

```bash
$ make
Usage: make <target>

Available targets:
  install       Install dependencies
  lint          Run linter
  test          Run tests
  build         Build for production
```

## جایگزین‌های Makefile

`make` همه‌جا نصب است و ساده است، اما جایگزین‌هایی هم دارد:

<div dir="ltr">

- **Task** (Go-based) — Makefile مدرن‌تر با YAML
- **Just** (Rust-based) — syntax ساده‌تر از Make
- **npm scripts** — برای پروژه‌های Node.js

</div>

اما `make` مزیت دارد که تقریبا روی هر سیستم Linux/macOS موجود است و نیازی به نصب ابزار اضافی ندارد.

## منابع یادگیری

**مستندات و مقالات**

- [Makefile for Developers — Automate Tasks Without Bash Spaghetti](https://iotools.cloud/zh/journal/makefile-for-developers-automate-tasks-without-bash-spaghetti/) — راهنمای استفاده از Makefile به‌عنوان task runner
- [Makefiles for Web Developers](https://www.deployhq.com/blog/make-the-swiss-army-knife-of-build-automation) — استفاده از Make در پروژه‌های وب
- [Making Life Easy with Makefile](https://dev.to/kriptonian/making-life-easy-with-makefile-streamlining-software-development-for-beginners-1m6c) — راهنمای مبتدی Makefile
