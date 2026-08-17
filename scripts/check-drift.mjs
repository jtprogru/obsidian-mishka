#!/usr/bin/env node
/*
 * Проверка дрейфа: собранное совпадает с закоммиченным.
 *
 * theme.css и половина src/ генерируются, но лежат в репозитории — Obsidian
 * ждёт theme.css в корне, а diff генерируемых кусков читается на ревью. Значит
 * возможна ровно одна беда: кто-то поправил результат руками, и теперь он
 * расходится с токенами. Пересобираем и смотрим git diff.
 *
 * Падает и в обратном случае — токены в submodule обновили, а тему не
 * пересобрали. Это тот же дрейф, только с другой стороны.
 *
 *   node scripts/check-drift.mjs
 */

import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const git = (...args) =>
	execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/* Грязное дерево до сборки — это не дрейф, а незакоммиченная работа. Отличить
   одно от другого постфактум нельзя, поэтому запоминаем состояние заранее. */
const TRACKED = ['theme.css', 'src'];
const dirtyBefore = git('status', '--porcelain', '--', ...TRACKED).trim();

execFileSync(process.execPath, [resolve(root, 'scripts/build.mjs')], {
	cwd: root,
	stdio: ['ignore', 'ignore', 'inherit'],
});

const dirtyAfter = git('status', '--porcelain', '--', ...TRACKED).trim();

if (dirtyAfter === dirtyBefore) {
	console.log('✓ theme.css и src/ совпадают с токенами submodule');
	process.exit(0);
}

console.error('✗ пересборка изменила результат — собранное разошлось с закоммиченным.\n');
console.error(git('diff', '--stat', '--', ...TRACKED).trimEnd() || '(изменения в неотслеживаемых файлах)');
console.error(
	'\n  Если правил токены или генератор — закоммить пересобранное.'
	+ '\n  Если правил theme.css руками — не надо, правь src/ и генераторы.',
);
process.exit(1);
