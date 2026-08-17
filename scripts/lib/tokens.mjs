/*
 * Чтение того, чего нет в tokens.json.
 *
 * gen-tokens-json.mjs в дизайн-системе складывает в JSON вычисленные значения
 * тем, а медиазапросы теряет: @media (prefers-contrast: more) существует
 * только в src/styles/tokens.css. Разбираем исходник — и здесь же, чтобы
 * генератор палитры и проверка акцента читали его одинаково.
 */

import { readFileSync } from 'node:fs';

/* Комментарии убираем на входе: в tokens.css пояснения многострочные, и
   строка внутри них легко выглядит как объявление. */
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Содержимое @-правила целиком, по балансу скобок. */
const atRule = (css, head) => {
	const at = css.indexOf(head);
	if (at < 0) throw new Error(`не найден блок ${head}`);
	let depth = 0;
	for (let i = css.indexOf('{', at); i < css.length; i++) {
		if (css[i] === '{') depth++;
		else if (css[i] === '}' && --depth === 0) return css.slice(at, i);
	}
	throw new Error(`не закрыт блок ${head}`);
};

/** Объявления кастомных свойств из тела правила. */
const decls = (body) =>
	[...body.matchAll(/^\s*--([\w-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim()]);

/**
 * Блок повышенного контраста из tokens.css.
 *
 * @returns {{ light: {decls: [string, string][], accent: string},
 *             dark:  {decls: [string, string][], accent: string} }}
 *   decls — объявления без --accent и --accent-hover, они приезжают отдельно;
 *   accent — значение --accent, из которого считается тройка h/s/l.
 */
export const highContrastTokens = (tokensCssPath) => {
	const css = strip(readFileSync(tokensCssPath, 'utf8'));

	const at = css.indexOf('@media (prefers-contrast: more)');
	if (at < 0) throw new Error('в tokens.css нет блока prefers-contrast: more');

	let depth = 0;
	let end = -1;
	for (let i = css.indexOf('{', at); i < css.length; i++) {
		if (css[i] === '{') depth++;
		else if (css[i] === '}' && --depth === 0) { end = i; break; }
	}
	if (end < 0) throw new Error('в tokens.css не закрыт блок prefers-contrast: more');
	const body = css.slice(at, end);

	const pick = (selector) => {
		const m = body.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
		if (!m) throw new Error(`в prefers-contrast нет блока ${selector}`);

		const decls = [];
		let accent = null;
		for (const line of m[1].split('\n')) {
			const d = line.match(/^\s*--([\w-]+):\s*([^;]+);/);
			if (!d) continue;
			const [, name, value] = d;
			/* --accent и --accent-hover в тему не переносятся: первый у нас
			   алиас на --color-accent ядра, второй считается от него. */
			if (name === 'accent') { accent = value.trim(); continue; }
			if (name === 'accent-hover') continue;
			decls.push([name, value.trim()]);
		}
		if (!accent) throw new Error(`в prefers-contrast нет --accent для ${selector}`);
		return { decls, accent };
	};

	return {
		light: pick(':root,\\s*:root\\[data-theme="light"\\]'),
		dark: pick(':root\\[data-theme="dark"\\]'),
	};
};
