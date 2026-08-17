/*
 * src/01-fonts.css — @font-face с сабсетами, вшитыми в data: URI.
 *
 * Тема в Obsidian — это ровно два файла, а гайдлайны каталога запрещают
 * внешние ссылки. Значит либо шрифты внутри theme.css, либо их нет вовсе:
 * положить woff2 рядом и сослаться относительным путём нельзя, файл до
 * пользователя не доедет.
 *
 * Источник — vendor/mishka-ds/fonts и src/styles/fonts.css. Диапазоны
 * unicode-range копируются оттуда как есть: по ним же нарезаны сами файлы, и
 * расхождение даст дырки в подстановке.
 */

import { readFileSync, statSync } from 'node:fs';

/*
 * Какие сабсеты вшиваем.
 *
 * latin и cyrillic — 14 файлов, ~300 КБ woff2, ~400 КБ base64. Это и есть
 * весь бюджет темы: latin-ext добавил бы ещё 115 КБ у основного шрифта,
 * cyrillic-ext — 76 КБ у моноширинного, и файл ушёл бы за 680 КБ.
 *
 * Что теряется: центральноевропейская диакритика, вьетнамский, часть
 * валютных знаков (включая ₽ — он в latin-ext) и старославянская кириллица.
 * Всё это подставится системным шрифтом, то есть будет читаемым, но чужим.
 * Понадобится — сюда добавляется 'latin-ext', файлы в submodule уже лежат.
 */
const SUBSETS = ['latin', 'cyrillic'];

/*
 * Кавычки вокруг имени гарнитуры — только там, где они нужны.
 *
 * «IBM Plex Sans» без кавычек не запишешь: пробелы. «Iosevka» — обычный
 * идентификатор, и кавычки вокруг него stylelint считает лишними
 * (font-family-name-quotes: always-where-recommended).
 */
const quoteFamily = (name) => (/^[A-Za-z_-][\w-]*$/.test(name) ? name : `"${name}"`);

/** Разбор src/styles/fonts.css системы в записи начертаний. */
const parseFaces = (css) => {
	const faces = [];
	for (const [, body] of css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)) {
		const get = (prop) => body.match(new RegExp(`${prop}:\\s*([^;]+);`))?.[1].trim();
		const src = get('src');
		const path = src?.match(/url\('\.\.\/(fonts\/[^']+)'\)/)?.[1];
		if (!path) throw new Error(`не разобран src начертания: ${src}`);

		const file = path.slice(path.lastIndexOf('/') + 1);
		const subset = SUBSETS.concat('latin-ext', 'cyrillic-ext')
			.sort((a, b) => b.length - a.length)
			.find((s) => file.endsWith(`-${s}.woff2`));
		if (!subset) throw new Error(`не опознан сабсет файла ${file}`);

		faces.push({
			family: get('font-family').replace(/^'|'$/g, ''),
			style: get('font-style'),
			weight: get('font-weight'),
			display: get('font-display'),
			range: get('unicode-range'),
			path,
			file,
			subset,
		});
	}
	if (!faces.length) throw new Error('в fonts.css системы не найдено ни одного @font-face');
	return faces;
};

export default function build({ ds }) {
	const faces = parseFaces(readFileSync(ds('src/styles/fonts.css'), 'utf8'))
		.filter((f) => SUBSETS.includes(f.subset));

	const missing = SUBSETS.filter((s) => !faces.some((f) => f.subset === s));
	if (missing.length) throw new Error(`в fonts.css нет сабсетов: ${missing.join(', ')}`);

	let bytes = 0;
	const blocks = faces.map((f) => {
		const raw = readFileSync(ds(f.path));
		bytes += raw.length;
		return `@font-face {
	font-family: ${quoteFamily(f.family)};
	font-style: ${f.style};
	font-weight: ${f.weight};
	font-display: ${f.display};
	src: url("data:font/woff2;base64,${raw.toString('base64')}") format("woff2");
	unicode-range: ${f.range};
}`;
	});

	const byFamily = {};
	for (const f of faces) byFamily[f.family] = (byFamily[f.family] ?? 0) + statSync(ds(f.path)).size;
	const summary = Object.entries(byFamily)
		.map(([fam, size]) => `     ${fam} — ${faces.filter((f) => f.family === fam).length} начертаний, ${(size / 1024).toFixed(0)} КБ`)
		.join('\n');

	return `/* СГЕНЕРИРОВАНО scripts/gen-fonts.mjs — не править руками.

   Сабсеты ${SUBSETS.join(' и ')}, вшитые в data: URI. Внешних ссылок в теме быть не
   может: Obsidian грузит один файл, и гайдлайны каталога это требуют прямо.

${summary}
     итого ${(bytes / 1024).toFixed(0)} КБ woff2 → ${(blocks.join('').length / 1024).toFixed(0)} КБ base64

   Обе гарнитуры под SIL OFL 1.1, уведомление — в шапке файла и в LICENSES/.
   Файлы приезжают из vendor/mishka-ds/fonts как есть: контуры и имена не
   менялись, нарезка по unicode-range сделана там же.

   Курсив настоящий у обеих гарнитур. У основного шрифта он в 400 и 700, у
   моноширинного только в 400: им набраны комментарии в коде, они нормального
   веса. Полужирный курсив моноширинным браузер синтезирует — в подсветке он
   не встречается. */

${blocks.join('\n\n')}
`;
}
