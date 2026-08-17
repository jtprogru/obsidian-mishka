---
tags:
  - test/callouts
type: surface
checked: true
---

# Callouts

Тринадцать типов ядра на пять семантических ролей системы. Проверять надо и заголовок, и иконку, и подложку, и вложенность, и складные.

> [!note] Note
> Роль `--c-note`, Lavender. Blue тут был бы ошибкой: он сливается с Sapphire.

> [!info] Info
> Алиас note. Подложка та же.

> [!todo] Todo
> Тоже note.

> [!abstract] Abstract
> Роль `--accent`. Единственный тип, который красится акцентом.

> [!summary] Summary
> Алиас abstract.

> [!tldr] TL;DR
> Алиас abstract.

> [!tip] Tip
> Роль `--c-tip`, Green.

> [!hint] Hint
> Алиас tip.

> [!success] Success
> Тоже tip.

> [!check] Check
> Алиас success.

> [!done] Done
> Алиас success.

> [!important] Important
> Роль `--c-important`, Mauve.

> [!question] Question
> Тоже important.

> [!help] Help
> Алиас question.

> [!faq] FAQ
> Алиас question.

> [!example] Example
> Тоже important.

> [!warning] Warning
> Роль `--c-warn`, Peach.

> [!caution] Caution
> Алиас warning.

> [!attention] Attention
> Алиас warning.

> [!fail] Fail
> Роль `--c-danger`, Red.

> [!failure] Failure
> Алиас fail.

> [!missing] Missing
> Алиас fail.

> [!error] Error
> Тоже danger.

> [!danger] Danger
> Алиас error.

> [!bug] Bug
> Тоже danger.

> [!quote] Quote
> Роль `--fg-muted`. Тихий тип, цвета не несёт.

> [!cite] Cite
> Алиас quote.

## Складные

> [!tip]- Свёрнутый по умолчанию
> Содержимое видно после клика. Проверяется поворот шеврона и то, что заголовок не прыгает.

> [!warning]+ Развёрнутый по умолчанию
> Плюс означает «открыт, но складывается».

## Без заголовка

> [!danger]
> Заголовок берётся из типа. Проверяется, что регистр и кегль совпадают с явным.

## Незнакомый тип

> [!runbook] Что делать в 3 ночи
> Ядру такой тип неизвестен, и он падает в `default`, то есть в `--c-note`. Так делается свой тип без единой строки CSS; иконка остаётся дефолтным карандашом.

## Вложенные

> [!note] Внешний
> Текст внешнего.
>
> > [!warning] Вложенный
> > Подложка вложенного должна отличаться от внешнего, иначе рамка теряется.
> >
> > > [!danger] Третий уровень
> > > Дальше не идём, но и не ломаемся.

## Со сложным содержимым

> [!example] Всё сразу
> Абзац с **полужирным**, *курсивом*, `инлайн-кодом` и [ссылкой](https://jtprog.ru).
>
> ```go
> func main() {
> 	fmt.Println("код внутри callout")
> }
> ```
>
> - список
> - второй пункт
>
> | таблица | внутри |
> |---|---|
> | a | b |
