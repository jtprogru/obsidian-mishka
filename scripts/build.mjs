#!/usr/bin/env node
/*
 * Оркестратор сборки темы «Мишка на сервере» для Obsidian.
 *
 * Obsidian грузит ровно один файл и не разворачивает @import, поэтому тема
 * пишется по кускам в src/ и склеивается сюда, в theme.css. Порядок склейки —
 * лексикографический по имени файла, отсюда числовые префиксы: 00 — шапка,
 * 0x — сгенерированное из токенов, 1x и дальше — написанное руками.
 *
 * Часть кусков не пишется руками вообще: цвет, кегль, отступ и радиус приходят
 * из vendor/mishka-ds/tokens/tokens.json. Ни одного хекса в исходниках темы —
 * расхождение с дизайн-системой возможно только вместе с расхождением токенов.
 *
 *   node scripts/build.mjs
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => resolve(root, ...p);
const ds = (...p) => resolve(root, 'vendor/mishka-ds', ...p);

/* ── 1. Дизайн-система на месте ────────────────────────────────────────── */

if (!existsSync(ds('tokens/tokens.json'))) {
	console.error(
		'✗ vendor/mishka-ds пуст.\n'
		+ '  Дизайн-система подключена submodule-ом и без неё собирать нечего:\n'
		+ '  git submodule update --init --recursive',
	);
	process.exit(1);
}

const tokens = JSON.parse(readFileSync(ds('tokens/tokens.json'), 'utf8'));

/* ── 2. Генераторы ─────────────────────────────────────────────────────── */

/* Каждый модуль экспортирует default-функцию (ctx) => css. Список растёт по
   фазам; файла в списке нет — значит этот кусок темы ещё пишется руками или
   не написан вовсе. Молча пропущенных генераторов здесь не бывает: если
   модуль не грузится, сборка падает. */
const GENERATORS = [
	['gen-fonts.mjs', 'src/01-fonts.css'],
	['gen-palette.mjs', 'src/02-palette.css'],
	['gen-mapping.mjs', 'src/03-mapping.css'],
	['gen-code.mjs', 'src/04-code.css'],
	['gen-callouts.mjs', 'src/05-callouts.css'],
];

const ctx = { tokens, root, r, ds };

mkdirSync(r('src'), { recursive: true });

/* Генератор может отдать ещё и кусок документации. Таблица типов callout
   живёт ровно в одном месте — в генераторе, — и в README приезжает оттуда же,
   что и CSS: разъехаться они могут только вместе. Место в README размечено
   парой маркеров, всё между ними принадлежит генератору. */
const docs = new Map();

for (const [script, out] of GENERATORS) {
	const mod = await import(new URL(script, import.meta.url).href);
	const css = await mod.default(ctx);
	writeFileSync(r(out), css.endsWith('\n') ? css : css + '\n');
	console.log(`  ${out.padEnd(22)} ${(Buffer.byteLength(css) / 1024).toFixed(1)} КБ`);

	if (typeof mod.docs === 'function') {
		docs.set(script.replace(/^gen-|\.mjs$/g, ''), await mod.docs(ctx));
	}
}

/* ── 3. Склейка ────────────────────────────────────────────────────────── */

const parts = readdirSync(r('src'))
	.filter((f) => f.endsWith('.css'))
	.sort();

if (!parts.length) {
	console.error('✗ src/ пуст — склеивать нечего');
	process.exit(1);
}

/* Разделители нужны живому человеку: собранный файл переваливает за 400 КБ,
   и без отбивок в нём не найти, откуда приехало правило. */
const rule = (name) => `/* ${'═'.repeat(4)} src/${name} ${'═'.repeat(Math.max(4, 68 - name.length))} */`;

const css = parts
	.map((name) => `${rule(name)}\n\n${readFileSync(r('src', name), 'utf8').trimEnd()}\n`)
	.join('\n');

writeFileSync(r('theme.css'), css);

/* ── 4. Документация ───────────────────────────────────────────────────── */

if (docs.size) {
	let readme = readFileSync(r('README.md'), 'utf8');

	for (const [name, body] of docs) {
		const open = `<!-- ${name}:start -->`;
		const close = `<!-- ${name}:end -->`;
		const re = new RegExp(`${open}[\\s\\S]*?${close}`);
		if (!re.test(readme)) {
			console.error(`✗ в README.md нет маркеров ${open} … ${close}`);
			process.exit(1);
		}
		readme = readme.replace(re, `${open}\n\n${body.trim()}\n\n${close}`);
	}

	writeFileSync(r('README.md'), readme);
	console.log(`  README.md              ${docs.size} блок(ов) из генераторов`);
}

const size = Buffer.byteLength(css);
console.log(`\n✓ theme.css — ${parts.length} кусков, ${(size / 1024).toFixed(0)} КБ`);
