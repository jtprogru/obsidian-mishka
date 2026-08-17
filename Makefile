# Makefile темы Mishka. Тонкая обёртка над scripts/*.mjs: команды одинаково
# называются здесь, в CI и в голове.

SHELL := /bin/bash
.DEFAULT_GOAL := help

NPM  := npm
NODE := node

# Тестовое хранилище в репозитории. Рабочие лежат в iCloud и синхронизируются —
# трогать их на каждой пересборке не стоит, для них есть deploy-vault.
VAULT      ?= vault
THEME_NAME := Mishka

.PHONY: help install vendor build check lint contrast accent drift deploy deploy-vault clean distclean

help: ## Список команд
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: vendor ## Поставить зависимости и подтянуть дизайн-систему
	@if [ -f package-lock.json ]; then $(NPM) ci; else $(NPM) install; fi

vendor: ## Подтянуть submodule с дизайн-системой
	git submodule update --init --recursive

# Порядок существенный: проверки контраста и акцента считают по собранному
# файлу, а не по токенам, иначе проверяется не то, что увидит пользователь.
build: ## Собрать theme.css из src/ и токенов, прогнать проверки
	$(NODE) scripts/build.mjs
	@$(MAKE) --no-print-directory lint contrast accent

check: lint contrast accent drift ## Все проверки, включая дрейф собранного

lint: ## stylelint по src/ и по собранному theme.css
	$(NPM) run lint

contrast: ## WCAG-контрасты пар Obsidian по собранному theme.css
	$(NODE) scripts/check-contrast.mjs

accent: ## Обратный ход hsl(h,s,l) сходится с токеном акцента
	$(NODE) scripts/check-accent.mjs

drift: ## Пересборка не даёт диффа: собранное = закоммиченное
	$(NODE) scripts/check-drift.mjs

deploy: build ## Положить тему в тестовое хранилище vault/
	@mkdir -p "$(VAULT)/.obsidian/themes/$(THEME_NAME)"
	@cp theme.css manifest.json "$(VAULT)/.obsidian/themes/$(THEME_NAME)/"
	@echo "  → $(VAULT)/.obsidian/themes/$(THEME_NAME)/  (Obsidian перечитает сам)"

# Рабочее хранилище указывается явно: make deploy-vault VAULT="$HOME/…/SecondBrain".
# Симлинка в iCloud намеренно нет — синхронизация и так возит тему по устройствам,
# а битая ссылка в хранилище чинится дольше, чем повторная копия.
deploy-vault: build ## Положить тему в произвольное хранилище: make deploy-vault VAULT=…
	@test -d "$(VAULT)/.obsidian" || { echo "✗ $(VAULT) не похоже на хранилище Obsidian"; exit 1; }
	@mkdir -p "$(VAULT)/.obsidian/themes/$(THEME_NAME)"
	@cp theme.css manifest.json "$(VAULT)/.obsidian/themes/$(THEME_NAME)/"
	@echo "  → $(VAULT)/.obsidian/themes/$(THEME_NAME)/"

clean: ## Удалить собранное (theme.css восстанавливается сборкой)
	rm -f theme.css

distclean: clean ## Удалить собранное и node_modules
	rm -rf node_modules
