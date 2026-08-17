#!/usr/bin/env node
/*
 * Проверка акцента: обратный ход hsl(h, s%, l%) сходится с токеном.
 *
 * Obsidian не принимает акцент цветом. Он принимает тройку --accent-h/s/l и
 * сам собирает из неё hsl() — и это единственный способ отдать теме акцент
 * так, чтобы пикер пользователя продолжал работать. Значит между токеном и
 * тем, что увидит пользователь, стоит преобразование, и оно теряет точность:
 * округление до целых процентов возвращает #0b7285 как #0b7284.
 *
 * Генератор считает дробные значения. Здесь проверяется, что это сработало:
 * читаем собранный theme.css, а не токены — проверять надо то, что доедет.
 *
 *   node scripts/check-accent.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { hexToRgb, hslToHex } from './lib/color.mjs';
import { highContrastTokens } from './lib/tokens.mjs';

/* Единица младшего разряда по каждому каналу. Больше — значит преобразование
   потеряло цвет, и в пикере дефолтом покажется не Sapphire. */
const TOLERANCE = 1;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'theme.css'), 'utf8');
const tokens = JSON.parse(readFileSync(resolve(root, 'vendor/mishka-ds/tokens/tokens.json'), 'utf8'));
const hc = highContrastTokens(resolve(root, 'vendor/mishka-ds/src/styles/tokens.css'));

/**
 * Все тройки --accent-h/s/l в собранном файле, в порядке появления, с именем
 * темы. Их четыре: две обычные и две внутри prefers-contrast — и каждая должна
 * вернуть свой токен.
 */
const triples = () => {
	const re = /\.theme-(light|dark)\s*\{[^}]*?--accent-h:\s*([\d.-]+);[^}]*?--accent-s:\s*([\d.-]+)%;[^}]*?--accent-l:\s*([\d.-]+)%;/gs;
	return [...css.matchAll(re)].map((m) => ({
		theme: m[1],
		hsl: { h: Number(m[2]), s: Number(m[3]), l: Number(m[4]) },
	}));
};

/* Ожидания в том же порядке, в каком gen-palette.mjs пишет блоки: сперва
   обычные темы, потом повышенный контраст. */
const expected = [
	['light', tokens.color.light.accent],
	['dark', tokens.color.dark.accent],
	['light · contrast', hc.light.accent],
	['dark · contrast', hc.dark.accent],
];

const found = triples();
let failed = 0;

if (found.length !== expected.length) {
	console.error(
		`✗ в theme.css ${found.length} троек --accent-h/s/l, ожидалось ${expected.length}.`
		+ `\n  Порядок блоков в gen-palette.mjs изменился — поправь список в этой проверке.`,
	);
	process.exit(1);
}

for (const [i, [label, want]] of expected.entries()) {
	const got = hslToHex(found[i].hsl);
	const drift = hexToRgb(got).map((c, j) => Math.abs(c - hexToRgb(want)[j]));
	const worst = Math.max(...drift);
	const ok = worst <= TOLERANCE;
	if (!ok) failed++;
	console.log(
		`  ${ok ? '✓' : '✗'} ${label.padEnd(16)} токен ${want} → hsl → ${got}`
		+ `  расхождение ${worst}/255 по каналам [${drift.join(', ')}]`
		+ `${ok ? '' : `  допуск ${TOLERANCE}`}`,
	);
}

if (failed) {
	console.error(
		`\n✗ акцент не переживает преобразование в hsl.`
		+ `\n  Смотри num() в scripts/gen-palette.mjs — вероятно, потеряны знаки после запятой.`,
	);
	process.exit(1);
}
console.log('\n✓ Акцент сходится с токеном во всех четырёх блоках.');
