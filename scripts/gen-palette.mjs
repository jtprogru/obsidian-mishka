/*
 * src/02-palette.css — токены дизайн-системы и палитра Obsidian.
 *
 * Отсюда приезжает всё, что имеет цвет, кегль, отступ или радиус. Руками этот
 * файл не правится: правится vendor/mishka-ds и запускается make build.
 *
 * Три слоя:
 *   1. роли и шкалы системы как есть — тот же словарь, что у блога и резюме;
 *   2. шкала --color-base-* Obsidian — подстраховка для правил ядра, которые
 *      ссылаются на ступени напрямую;
 *   3. восемь цветов ядра и тройка --accent-h/s/l.
 *
 * Почему роли и шкала разведены. Прямая укладка ролей в --color-base-* не
 * работает: в светлой теме шкала Obsidian идёт от светлого к тёмному, в тёмной
 * наоборот, а в системе --bg-elev и --bg-sunken в тёмной теме темнее --bg —
 * у catppuccin возвышение уходит вниз. Семантика поэтому задаётся ролями
 * напрямую (см. 03-mapping.css), а шкала заполняется монотонной лесенкой.
 */

import { hexToHsl, modernizeColors, rgbTriplet } from './lib/color.mjs';
import { highContrastTokens, printTokens } from './lib/tokens.mjs';

const TAB = '\t';

/* Порядок и группировка ролей — как в tokens.css: файл читают глазами. */
const ROLE_GROUPS = [
	['Поверхности', ['bg', 'bg-elev', 'bg-sunken']],
	['Текст', ['fg', 'fg-muted', 'fg-subtle']],
	['Акцентная шкала — брендовая, пикер её не двигает', ['accent-300', 'accent-400', 'accent-600', 'accent-700', 'accent-soft']],
	['Границы', ['border', 'border-strong']],
	['Код', ['code-bg', 'code-fg', 'code-inline-bg']],
	['Семантика callouts: подложка и текст разведены', [
		'c-note', 'c-tip', 'c-important', 'c-warn', 'c-danger',
		'c-note-text', 'c-tip-text', 'c-important-text', 'c-warn-text', 'c-danger-text',
	]],
	['Категориальная палитра', ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-7', 'chart-8']],
	['Подсветка синтаксиса', [
		'syn-keyword', 'syn-string', 'syn-number', 'syn-constant', 'syn-comment',
		'syn-function', 'syn-type', 'syn-variable', 'syn-operator', 'syn-meta',
	]],
	['Тени', ['shadow-sm', 'shadow-md', 'shadow-lg']],
];

/* Восьмёрка ядра идёт под canvas, статусные модификаторы, теги и graph.
   Callouts через неё НЕ маршрутизируются — у них своя таблица в 05-callouts.css,
   иначе note уехал бы в Blue, а система на этом месте требует Lavender ровно
   потому, что Blue сливается с Sapphire. */
const CORE_COLORS = [
	['red', 'c-danger'],
	['orange', 'c-warn'],
	['yellow', 'chart-6'],
	['green', 'c-tip'],
	['cyan', 'chart-7'],
	['blue', 'chart-1'],
	['purple', 'c-important'],
	['pink', 'c-note'],
];

/* Монотонная лесенка от --bg к --fg, одна формула на обе темы. Ступени 30-70
   садятся на роли границ и текста, промежуточные — на смесь.
   color-mix(in oklch, …) безопасен: Obsidian 1.13.7 сам пользуется им в
   app.css больше сотни раз. */
const BASE_LADDER = [
	['00', 'var(--bg)'],
	['05', 'color-mix(in oklch, var(--fg) 3%, var(--bg))'],
	['10', 'color-mix(in oklch, var(--fg) 6%, var(--bg))'],
	['20', 'color-mix(in oklch, var(--fg) 9%, var(--bg))'],
	['25', 'color-mix(in oklch, var(--fg) 12%, var(--bg))'],
	['30', 'var(--border)'],
	['35', 'color-mix(in oklch, var(--border), var(--border-strong))'],
	['40', 'var(--border-strong)'],
	['50', 'color-mix(in oklch, var(--border-strong), var(--fg-subtle))'],
	['60', 'var(--fg-subtle)'],
	['70', 'var(--fg-muted)'],
	['100', 'var(--fg)'],
];

const decl = (name, value) => `${TAB}--${name}: ${modernizeColors(value)};`;

const num = (n) => {
	const s = n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
	return s === '-0' ? '0' : s;
};

/** Тройка --accent-h/s/l из hex. Дробная: округление до целых уводит цвет. */
const accentTriple = (hex) => {
	const { h, s, l } = hexToHsl(hex);
	return [
		decl('accent-h', num(h)),
		decl('accent-s', `${num(s)}%`),
		decl('accent-l', `${num(l)}%`),
	];
};

/**
 * Блок @media (prefers-contrast: more) из tokens.css — как есть, только с
 * заменой селекторов на классы Obsidian и с акцентом, переложенным в тройку
 * h/s/l: так повышенный контраст едет по той же цепочке ядра, что и обычный,
 * и пикер пользователя остаётся сильнее обоих.
 */
const highContrast = (hc) =>
	['light', 'dark'].map((theme) => {
		const lines = hc[theme].decls.map(([name, value]) => decl(name, value));
		lines.push(
			'',
			`${TAB}/* Акцент повышенного контраста — той же тройкой, что и обычный. */`,
			...accentTriple(hc[theme].accent),
		);
		return `${TAB}.theme-${theme} {\n${lines.map((l) => (l ? TAB + l : '')).join('\n')}\n${TAB}}`;
	}).join('\n\n');

export default function build({ tokens, ds }) {
	const hc = highContrastTokens(ds('src/styles/tokens.css'));
	const print = printTokens(ds('src/styles/tokens.css'), ds('src/styles/print-web.css'));
	const out = [];

	out.push(`/* СГЕНЕРИРОВАНО scripts/gen-palette.mjs — не править руками.

   Источник: vendor/mishka-ds/tokens/tokens.json и src/styles/tokens.css.
   Меняешь цвет, кегль, отступ или радиус — правишь дизайн-систему и
   запускаешь make build. Правка значений здесь — возврат к состоянию, из
   которого ушли. */`);

	/* ── Шкалы. Тема их не переключает, поэтому body, а не .theme-*. ────── */
	out.push(`
/* Шкалы системы. Тем не касаются, поэтому объявлены один раз на body.

   --fs-display-* сюда не приезжают: система разрешает их только слайдам.
   --container-width и --header-height — тоже: в Obsidian нет ни контейнера
   страницы, ни шапки сайта. */
body {`);

	const scale = (label, entries) => {
		out.push(`${TAB}/* ${label} */`);
		for (const [name, value] of entries) out.push(decl(name, value));
		out.push('');
	};

	scale('Гарнитуры', Object.entries(tokens.font));
	scale(
		'Кегли — Major Third 1.250',
		Object.entries(tokens.fontSize).filter(([k]) => !k.startsWith('fs-display')),
	);
	scale('Межстрочный', Object.entries(tokens.lineHeight));
	scale('Отступы', Object.entries(tokens.space));
	scale('Радиусы', Object.entries(tokens.radius));
	scale('Ширина колонки текста', [['content-width', tokens.size['content-width']]]);
	scale('Движение', Object.entries(tokens.motion));
	scale('Бумага — единственное место системы с физическими единицами', print.scale);

	out[out.length - 1] = '}';

	/* ── Роли цвета по темам ────────────────────────────────────────────── */

	for (const [theme, title] of [['light', 'light · catppuccin Latte'], ['dark', 'dark · catppuccin Macchiato']]) {
		const vars = tokens.color[theme];
		out.push(`\n/* Роли цвета · ${title} */\n\n.theme-${theme} {`);
		for (const [label, names] of ROLE_GROUPS) {
			out.push(`${TAB}/* ${label} */`);
			for (const name of names) {
				if (vars[name] === undefined) throw new Error(`в токенах нет --${name} (${theme})`);
				out.push(decl(name, vars[name]));
			}
			out.push('');
		}
		out[out.length - 1] = '}';
	}

	/* ── Акцент, следующий за пикером ───────────────────────────────────── */

	out.push(`
/* Акцент. --accent-h/s/l объявляются по темам раздельно: в системе акцент
   разный, --accent-700 #${tokens.color.light['accent-700'].slice(1)} на светлой и --accent-300 #${tokens.color.dark['accent-300'].slice(1)} на тёмной.
   Ядро выводит из тройки --color-accent, --color-accent-1 и --color-accent-2
   внутри каждого блока темы, поэтому раздельное объявление работает без
   обходных путей.

   Пикер акцента в «Оформлении» продолжает работать: если цвет там выбран,
   Obsidian пишет ту же тройку инлайном в body, и инлайн выигрывает у любого
   нашего селектора без !important. Если не выбран — вызывает
   removeProperty(), и в силу вступает объявление ниже. Настройки читают
   вычисленное значение обратно, так что дефолтом в пикере покажется Sapphire. */

.theme-light {
${accentTriple(tokens.color.light.accent).join('\n')}
}

.theme-dark {
${accentTriple(tokens.color.dark.accent).join('\n')}
}

/* Роль --accent системы — алиас на цепочку ядра, а не на токен. Так один
   словарь остаётся один: и наши правила, и правила Obsidian берут акцент из
   одного места, и пикер двигает оба. На настройках по умолчанию тройка выше
   возвращает ровно токенный Sapphire — это проверяет check-accent.mjs.

   --accent-hover считается от акцента, а не берётся из токена, по той же
   причине. Смешивание с --mono-100 уводит от фона в обеих темах: на светлой
   темнее, на тёмной светлее — ровно так же, как --accent-hover в системе. */

.theme-light,
.theme-dark {
${TAB}--accent: var(--color-accent);
${TAB}--accent-hover: color-mix(in oklch, var(--color-accent) 84%, var(--mono-100));
}`);

	/* ── prefers-contrast: more ─────────────────────────────────────────── */

	out.push(`
/* Повышенный контраст. Блок проброшен из tokens.css как есть — срабатывает
   автоматически при системной настройке. */

@media (prefers-contrast: more) {
${highContrast(hc)}
}`);

	/* ── Шкала --color-base-* ───────────────────────────────────────────── */

	/* ── Печать ─────────────────────────────────────────────────────────── */

	out.push(`
/* Бумага. Роли проброшены из print-web.css системы как есть.

   На бумаге тема всегда одна: насыщенный фон полосит на лазерной печати и
   просвечивает на обороте, а Sapphire, читаемый на экране, выцветает. Блок в
   системе объявлен разом на все селекторы темы, поэтому и здесь один.

   --accent тут задан значением, а не алиасом на цепочку ядра: блок стоит
   ниже, специфичность та же, значит он и выигрывает. Тройки h/s/l не нужно —
   на печати акцент никуда дальше не разворачивается. */

@media print {
${TAB}.theme-light,
${TAB}.theme-dark {`);
	for (const [name, value] of print.roles) out.push(TAB + decl(name, value));
	out.push(`${TAB}}\n}`);

	out.push(`
/* Шкала --color-base-*. Семантику Obsidian она не несёт — та задана ролями в
   03-mapping.css. Шкала нужна правилам ядра, которые ссылаются на ступени
   напрямую: --canvas-dot-pattern, --graph-line, --prompt-border-color.
   Заполнена монотонной лесенкой от --bg к --fg, одной формулой на обе темы. */

.theme-light,
.theme-dark {`);
	for (const [step, value] of BASE_LADDER) out.push(decl(`color-base-${step}`, value));
	out.push('}');

	/* ── Восемь цветов ──────────────────────────────────────────────────── */

	out.push(`
/* Восемь цветов ядра. Идут под canvas, статусные модификаторы, теги и graph. */

.theme-light,
.theme-dark {`);
	for (const [core, role] of CORE_COLORS) out.push(decl(`color-${core}`, `var(--${role})`));
	out.push('}');

	out.push(`
/* Тройки --color-*-rgb. В ядре помечены deprecated, но их читают плагины, и
   без них чужой плагин рисует дырку. var() в тройку не подставишь — только
   литералом, поэтому по темам раздельно. */`);
	for (const theme of ['light', 'dark']) {
		out.push(`\n.theme-${theme} {`);
		for (const [core, role] of CORE_COLORS) {
			out.push(decl(`color-${core}-rgb`, rgbTriplet(tokens.color[theme][role])));
		}
		out.push('}');
	}

	return out.join('\n') + '\n';
}
