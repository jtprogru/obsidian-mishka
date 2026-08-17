#!/usr/bin/env node
/*
 * Контрастность пар Obsidian ≥ WCAG AA — по собранному theme.css.
 *
 * Порт check-contrast.mjs из mishka-ds на пары Obsidian, с одним отличием,
 * которое и есть суть: там меряются токены, здесь — то, во что они
 * развернулись. Между токеном и пикселем в теме стоит цепочка из роли
 * системы, семантической переменной ядра, иногда hsl() из тройки акцента и
 * color-mix() с подложкой. Ошибка в любом звене токенам незаметна.
 *
 * Зависимостей нет: формула WCAG детерминирована, а лишний пакет в CI не
 * нужен. Значения совпадают с WebAIM Contrast Checker до второго знака.
 *
 *   node scripts/check-contrast.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { contrast } from './lib/color.mjs';
import { parseTheme, resolveColor } from './lib/resolve.mjs';

const AA_NORMAL = 4.5; // обычный текст
const AA_LARGE = 3.0;  // крупный: ≥ 24px или ≥ 18.66px полужирный

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themes = parseTheme(readFileSync(resolve(root, 'theme.css'), 'utf8'));

/* Пары «текст / фон» в именах переменных Obsidian — тех самых, которые видит
   пользователь. Слева то, что тема объявила; справа то, на чём оно лежит. */
const PAIRS = [
	['text-normal', 'background-primary', 'текст заметки / фон', AA_NORMAL],
	['text-normal', 'background-secondary', 'текст / боковая панель', AA_NORMAL],
	['text-muted', 'background-primary', 'приглушённый текст / фон', AA_NORMAL],
	['text-muted', 'background-secondary', 'приглушённый / панель', AA_NORMAL],
	['text-faint', 'background-primary', 'тихий текст / фон', AA_NORMAL],
	['text-accent', 'background-primary', 'ссылка / фон заметки', AA_NORMAL],
	['text-accent', 'background-secondary', 'ссылка / панель', AA_NORMAL],
	['text-accent-hover', 'background-primary', 'ссылка при наведении / фон', AA_NORMAL],
	['text-on-accent', 'interactive-accent', 'подпись на кнопке акцента', AA_NORMAL],
	['text-error', 'background-primary', 'ошибка / фон', AA_NORMAL],
	['text-warning', 'background-primary', 'предупреждение / фон', AA_NORMAL],
	['text-success', 'background-primary', 'успех / фон', AA_NORMAL],
	['blockquote-color', 'blockquote-background-color', 'цитата', AA_NORMAL],

	/* Инлайновый код красится акцентом — это решение системы, и подложка у
	   него не та же, что у блока, поэтому пара своя.

	   Статусбар, вкладки и обозреватель файлов отдельными парами не идут:
	   ядро объявляет их как алиасы (--status-bar-text-color: var(--text-muted),
	   --status-bar-background: var(--background-secondary) и так далее), то
	   есть это буквально пары, уже посчитанные выше. Резолвер их не увидит —
	   объявления живут в app.css, а не в теме. */
	['text-accent', 'code-background', 'инлайновый код', AA_NORMAL],
	['tag-color', 'tag-background', 'тег', AA_NORMAL],
	['tag-color-hover', 'tag-background-hover', 'тег при наведении', AA_NORMAL],

	/* Подсветка синтаксиса. Код читают дольше и внимательнее любого другого
	   текста, а роли легко уплывают при правке палитры. */
	['code-normal', 'code-background', 'код: обычный текст', AA_NORMAL],
	['code-comment', 'code-background', 'код: комментарий', AA_NORMAL],
	['code-function', 'code-background', 'код: функция', AA_NORMAL],
	['code-keyword', 'code-background', 'код: ключевое слово', AA_NORMAL],
	['code-operator', 'code-background', 'код: оператор', AA_NORMAL],
	['code-property', 'code-background', 'код: свойство', AA_NORMAL],
	['code-string', 'code-background', 'код: строка', AA_NORMAL],
	['code-tag', 'code-background', 'код: тег', AA_NORMAL],
	['code-value', 'code-background', 'код: число', AA_NORMAL],
	['code-important', 'code-background', 'код: константа', AA_NORMAL],
	['code-punctuation', 'code-background', 'код: пунктуация', AA_NORMAL],
];

/* Заголовки callout. Подложка считается той же формулой, что и в
   05-callouts.css: тинт типа в --bg-elev. Цвет заголовка один на все типы —
   это система, — но подложка у каждого своя, и слабое место именно там. */
const CALLOUT_TYPES = [
	['default', 'note'],
	['summary', 'abstract, tldr'],
	['tip', 'hint'],
	['success', 'check, done'],
	['important', ''],
	['question', 'help, faq'],
	['example', ''],
	['warning', 'caution'],
	['fail', 'failure, missing'],
	['error', 'danger'],
	['bug', ''],
	['quote', 'cite'],
];

let failed = 0;
let checked = 0;

const line = (ok, label, fg, bg, ratio, threshold) => {
	if (!ok) failed++;
	checked++;
	console.log(
		`  ${ok ? '✓' : '✗'} ${label.padEnd(30)} ${fg} на ${bg}  ${ratio.toFixed(2)}:1`
		+ `  ${threshold === AA_LARGE ? 'AA large' : 'AA'}${ok ? '' : `  ниже ${threshold}`}`,
	);
};

for (const [name, vars] of [['light · catppuccin Latte', themes.light], ['dark · catppuccin Macchiato', themes.dark]]) {
	console.log(`\n=== ${name} ===`);

	for (const [fgVar, bgVar, label, threshold] of PAIRS) {
		const fg = resolveColor(vars, `var(--${fgVar})`);
		const bg = resolveColor(vars, `var(--${bgVar})`);
		if (!fg || !bg) {
			console.log(`  ⚠ ${label.padEnd(30)} не резолвится (--${fgVar}=${fg}, --${bgVar}=${bg})`);
			failed++;
			continue;
		}
		const ratio = contrast(fg, bg);
		line(ratio >= threshold, label, fg, bg, ratio, threshold);
	}

	for (const [type, aliases] of CALLOUT_TYPES) {
		const fg = resolveColor(vars, 'var(--callout-title-color)');
		const bg = resolveColor(
			vars,
			`color-mix(in oklch, var(--callout-${type}) 10%, var(--bg-elev))`,
		);
		if (!fg || !bg) {
			console.log(`  ⚠ callout ${type}: не резолвится`);
			failed++;
			continue;
		}
		const ratio = contrast(fg, bg);
		line(ratio >= AA_NORMAL, `callout ${type}${aliases ? ` (${aliases})` : ''}`, fg, bg, ratio, AA_NORMAL);
	}
}

if (failed) {
	console.error(
		`\n✗ ${failed} пар(а) ниже порога из ${checked}.`
		+ `\n  Правь vendor/mishka-ds/src/styles/tokens.css или раскладку в scripts/gen-*.mjs —`
		+ `\n  но не значения в src/: они перезапишутся ближайшей сборкой.`,
	);
	process.exit(1);
}
console.log(`\n✓ Все ${checked} пар проходят порог WCAG в обеих темах.`);
