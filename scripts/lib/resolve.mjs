/*
 * Мини-резолвер CSS-переменных собранной темы.
 *
 * Проверять контраст по токенам нечестно: между токеном и пикселем стоит
 * цепочка — роль системы, семантическая переменная Obsidian, иногда hsl() из
 * тройки акцента или color-mix() с подложкой. Ошибка в любом звене токенам
 * незаметна. Поэтому читается собранный theme.css и считается то, что реально
 * доедет до пользователя.
 *
 * Полноценного каскада здесь нет и не нужно: тема объявляет цвет только в
 * .theme-light, .theme-dark и body, всё на одном элементе. Порядок объявлений
 * в файле и решает, с одной поправкой — body проигрывает .theme-* по
 * специфичности независимо от порядка.
 *
 * Поддерживаются те формы значений, которые тема действительно пишет:
 * #hex, var() с запасным значением, hsl(), color-mix(in oklch, …),
 * transparent и два именованных цвета ядра.
 */

import { hexToRgb, hslToHex, rgbToHex } from './color.mjs';

/* ── OKLCH ─────────────────────────────────────────────────────────────── */

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** hex → { L, C, h } по Оттоссону. h в радианах, undefined-хроме соответствует C ≈ 0. */
const hexToOklch = (hex) => {
	const [r, g, b] = hexToRgb(hex).map((c) => toLinear(c / 255));

	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

	return { L, C: Math.hypot(A, B), h: Math.atan2(B, A) };
};

const oklchToHex = ({ L, C, h }) => {
	const A = C * Math.cos(h);
	const B = C * Math.sin(h);

	const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
	const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
	const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;

	const rgb = [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	].map((c) => Math.min(255, Math.max(0, Math.round(toSrgb(c) * 255))));

	return rgbToHex(rgb);
};

/** Смешение двух непрозрачных цветов в OKLCH. w — доля первого, 0..1. */
const mixOklch = (aHex, bHex, w) => {
	const a = hexToOklch(aHex);
	const b = hexToOklch(bHex);

	/* Ахроматичный участник тона не несёт — берём тон второго, как требует
	   спецификация. Иначе смесь с чёрным уводила бы оттенок в случайную
	   сторону: у чёрного atan2(0, 0) равен нулю, то есть «красный». */
	const EPS = 1e-4;
	const ha = a.C < EPS ? b.h : a.h;
	const hb = b.C < EPS ? a.h : b.h;

	/* Кратчайшая дуга — режим hue по умолчанию. */
	let d = hb - ha;
	while (d > Math.PI) d -= 2 * Math.PI;
	while (d < -Math.PI) d += 2 * Math.PI;

	return oklchToHex({
		L: a.L * w + b.L * (1 - w),
		C: a.C * w + b.C * (1 - w),
		h: ha + d * (1 - w),
	});
};

/* ── Разбор темы ───────────────────────────────────────────────────────── */

/**
 * Объявления кастомных свойств из блоков .theme-light / .theme-dark / body.
 *
 * Блоки внутри @media пропускаются: обычная тема живёт вне их, а повышенный
 * контраст — отдельный режим со своими парами, и мерить его надо отдельно.
 *
 * @returns {{ light: Map<string, string>, dark: Map<string, string> }}
 */
export const parseTheme = (rawCss) => {
	/* Комментарии выкидываем первыми. Файл написан с расчётом на человека, и
	   в пояснениях встречается «--accent-soft: ровно то, чем …» — разбор без
	   этого шага примет фразу за объявление и подставит её как значение. */
	const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');

	/* Вырезаем содержимое @media целиком — по балансу скобок. */
	let flat = '';
	for (let i = 0; i < css.length; i++) {
		if (css.startsWith('@media', i)) {
			let depth = 0;
			let j = css.indexOf('{', i);
			for (; j < css.length; j++) {
				if (css[j] === '{') depth++;
				else if (css[j] === '}' && --depth === 0) break;
			}
			i = j;
			continue;
		}
		flat += css[i];
	}

	const themes = { light: new Map(), dark: new Map() };
	const priority = { light: new Map(), dark: new Map() };

	for (const [, selector, body] of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		const sel = selector.trim();
		const targets = [];
		/* body проигрывает .theme-* по специфичности, что бы ни стояло позже. */
		let weight;
		if (/^body$/m.test(sel)) { targets.push('light', 'dark'); weight = 0; }
		else if (/\.theme-light/.test(sel) || /\.theme-dark/.test(sel)) {
			if (/\.theme-light/.test(sel)) targets.push('light');
			if (/\.theme-dark/.test(sel)) targets.push('dark');
			weight = 1;
		} else continue;

		for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
			for (const t of targets) {
				if ((priority[t].get(name) ?? -1) > weight) continue;
				themes[t].set(name, value.trim());
				priority[t].set(name, weight);
			}
		}
	}

	/* Переменные, которые тема не объявляет, но использует: они приезжают из
	   app.css ядра. Без них не резолвится ни акцент, ни наведение на него. */
	const core = {
		light: { 'mono-0': '#ffffff', 'mono-100': '#000000' },
		dark: { 'mono-0': '#000000', 'mono-100': '#ffffff' },
	};
	for (const t of ['light', 'dark']) {
		for (const [name, value] of Object.entries(core[t])) {
			if (!themes[t].has(name)) themes[t].set(name, value);
		}
		if (!themes[t].has('color-accent')) {
			themes[t].set('color-accent', 'hsl(var(--accent-h), var(--accent-s), var(--accent-l))');
		}
	}

	return themes;
};

/* ── Резолв значения ───────────────────────────────────────────────────── */

/** Разбивает список аргументов функции по запятым верхнего уровня. */
const splitArgs = (s) => {
	const out = [];
	let depth = 0;
	let cur = '';
	for (const ch of s) {
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
		cur += ch;
	}
	if (cur.trim()) out.push(cur.trim());
	return out;
};

/** Содержимое скобок функции: 'color-mix(a, b)' → 'a, b'. */
const inner = (s) => s.slice(s.indexOf('(') + 1, s.lastIndexOf(')'));

/**
 * Значение в hex. null — если цвет полупрозрачный или нерезолвимый: такие
 * пары контрастом не меряются, их надо перечислять явно.
 */
export const resolveColor = (vars, expr, seen = new Set()) => {
	const v = String(expr).trim();

	if (v === 'transparent' || v === 'inherit' || v === 'currentcolor') return null;
	if (/^#[0-9a-f]{3,8}$/i.test(v)) return v.length === 4 ? rgbToHex(hexToRgb(v)) : v;

	if (v.startsWith('var(')) {
		const [ref, fallback] = splitArgs(inner(v));
		const name = ref.replace(/^--/, '');
		if (seen.has(name)) return null;
		if (vars.has(name)) return resolveColor(vars, vars.get(name), new Set(seen).add(name));
		return fallback === undefined ? null : resolveColor(vars, fallback, seen);
	}

	if (v.startsWith('hsl(')) {
		const [h, s, l] = splitArgs(inner(v)).map((part) => {
			const raw = part.startsWith('var(') ? resolveRaw(vars, part, seen) : part;
			return Number.parseFloat(raw);
		});
		if ([h, s, l].some(Number.isNaN)) return null;
		return hslToHex({ h, s, l });
	}

	if (v.startsWith('color-mix(')) {
		const args = splitArgs(inner(v));
		if (!args[0]?.startsWith('in oklch')) return null;

		const parse = (arg) => {
			const m = arg.match(/^(.*?)(?:\s+([\d.]+)%)?$/s);
			return { color: m[1].trim(), pct: m[2] === undefined ? null : Number(m[2]) };
		};
		const a = parse(args[1]);
		const b = parse(args[2]);

		const aHex = resolveColor(vars, a.color, seen);
		const bHex = resolveColor(vars, b.color, seen);
		if (!aHex || !bHex) return null;

		let w = a.pct ?? (b.pct === null ? 50 : 100 - b.pct);
		w /= 100;
		return mixOklch(aHex, bHex, w);
	}

	return null;
};

/** Значение как строка, без попытки понять цвет: для чисел внутри hsl(). */
const resolveRaw = (vars, expr, seen = new Set()) => {
	const v = String(expr).trim();
	if (!v.startsWith('var(')) return v;
	const [ref, fallback] = splitArgs(inner(v));
	const name = ref.replace(/^--/, '');
	if (seen.has(name)) return '';
	if (vars.has(name)) return resolveRaw(vars, vars.get(name), new Set(seen).add(name));
	return fallback === undefined ? '' : resolveRaw(vars, fallback, seen);
};
