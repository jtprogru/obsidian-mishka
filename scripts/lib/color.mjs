/*
 * Цветовая арифметика без зависимостей: hex ↔ rgb ↔ hsl и контраст по WCAG.
 *
 * Зависимостей нет намеренно, по той же причине, что и в mishka-ds: формулы
 * детерминированы, а лишний пакет в CI не нужен. Значения совпадают с WebAIM
 * Contrast Checker до второго знака.
 */

/** '#0b7285' → [11, 114, 133] */
export const hexToRgb = (hex) => {
	const h = hex.replace('#', '');
	const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
	return [0, 2, 4].map((i) => Number.parseInt(n.slice(i, i + 2), 16));
};

/** [11, 114, 133] → '#0b7285' */
export const rgbToHex = (rgb) =>
	'#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

/**
 * hex → { h, s, l } в градусах и процентах, дробные.
 *
 * Дробные — принципиально: Obsidian считает акцент как hsl(h, s%, l%), и
 * округление до целых уводит результат на единицу младшего разряда
 * (#0b7285 возвращается как #0b7284). check-accent.mjs проверяет обратный ход.
 */
export const hexToHsl = (hex) => {
	const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	const l = (max + min) / 2;

	if (d === 0) return { h: 0, s: 0, l: l * 100 };

	const s = d / (1 - Math.abs(2 * l - 1));
	let h;
	if (max === r) h = ((g - b) / d) % 6;
	else if (max === g) h = (b - r) / d + 2;
	else h = (r - g) / d + 4;
	h *= 60;
	if (h < 0) h += 360;

	return { h, s: s * 100, l: l * 100 };
};

/** { h, s, l } → hex. Обратный ход к hexToHsl. */
export const hslToHex = ({ h, s, l }) => {
	const sn = s / 100;
	const ln = l / 100;
	const c = (1 - Math.abs(2 * ln - 1)) * sn;
	const hp = (((h % 360) + 360) % 360) / 60;
	const x = c * (1 - Math.abs((hp % 2) - 1));
	const m = ln - c / 2;

	const [r, g, b] = (
		hp < 1 ? [c, x, 0]
			: hp < 2 ? [x, c, 0]
				: hp < 3 ? [0, c, x]
					: hp < 4 ? [0, x, c]
						: hp < 5 ? [x, 0, c]
							: [c, 0, x]
	).map((v) => (v + m) * 255);

	return rgbToHex([r, g, b]);
};

const relLuminance = (hex) => {
	const [r, g, b] = hexToRgb(hex).map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Отношение контраста по WCAG 2.1, от 1 до 21. */
export const contrast = (a, b) => {
	const [l1, l2] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
	return (l1 + 0.05) / (l2 + 0.05);
};

/** '#0b7285' → '11, 114, 133' — формат deprecated-переменных Obsidian. */
export const rgbTriplet = (hex) => hexToRgb(hex).join(', ');

/**
 * Значение токена в вид, который переживёт stylelint-config-standard.
 *
 * Тени в системе записаны как rgba(0, 0, 0, .04) — legacy-нотация с дробной
 * альфой. Стандартный конфиг требует современную функциональную запись и
 * альфу в процентах, а Electron её понимает с запасом. Переписываем на сборке,
 * а не в токенах: тени системы читают ещё четыре потребителя.
 */
export const modernizeColors = (value) =>
	value
		.replace(
			/rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g,
			(_, r, g, b, a) => `rgb(${r} ${g} ${b} / ${+(Number.parseFloat(a) * 100).toFixed(4)}%)`,
		)
		/* Короткая запись там, где она возможна: #ffffff → #fff. Значение то же,
		   а stylelint-config-standard требует короткую. Ловится только чистая
		   серая шкала повышенного контраста — палитра catppuccin не сокращается. */
		.replace(
			/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/gi,
			(_, r, g, b) => `#${r}${g}${b}`,
		);
