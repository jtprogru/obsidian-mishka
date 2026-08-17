/*
 * src/05-callouts.css — тринадцать типов callout Obsidian на пять
 * семантических ролей дизайн-системы.
 *
 * Восьмёрка --color-* здесь не участвует: пойди callouts через неё, note уехал
 * бы в Blue, а система на этом месте требует Lavender ровно потому, что Blue
 * сливается с Sapphire. Отсюда отдельная таблица.
 *
 * Алиасы разруливать не нужно: ядро само сводит [!hint] к --callout-tip,
 * а [!tldr] к --callout-summary. Красим канонические переменные, алиасы
 * приезжают следом.
 */

const TAB = '\t';

/* Тип ядра → роль системы. Слева канонические имена --callout-*, в скобках —
   алиасы, которые ядро на них сводит. */
const TYPES = [
	['default', 'c-note', 'без типа'],
	['info', 'c-note', 'info'],
	['todo', 'c-note', 'todo'],
	['summary', 'accent', 'summary, abstract, tldr'],
	['tip', 'c-tip', 'tip, hint'],
	['success', 'c-tip', 'success, check, done'],
	['important', 'c-important', 'important'],
	['question', 'c-important', 'question, help, faq'],
	['example', 'c-important', 'example'],
	['warning', 'c-warn', 'warning, caution, attention'],
	['fail', 'c-danger', 'fail, failure, missing'],
	['error', 'c-danger', 'error, danger'],
	['bug', 'c-danger', 'bug'],
	['quote', 'fg-muted', 'quote, cite'],
];

export default function build() {
	const width = Math.max(...TYPES.map(([t]) => t.length));

	const rows = TYPES.map(([type, role, aliases]) => {
		const pad = ' '.repeat(width - type.length);
		return `${TAB}--callout-${type}:${pad} var(--${role});${' '.repeat(Math.max(1, 18 - role.length))}/* ${aliases} */`;
	});

	return `/* СГЕНЕРИРОВАНО scripts/gen-callouts.mjs — не править руками.

   Тринадцать типов Obsidian на пять семантических ролей системы плюс тихий
   quote. Алиасы ядро сводит к каноническим типам само. */

.theme-light,
.theme-dark {
${rows.join('\n')}
}

/* Оформление блока — как .callout в системе.

   Ядро красит подложку как color-mix(…, var(--callout-color) 10%, transparent)
   и накладывает mix-blend-mode. Система смешивает тот же процент в --bg-elev
   непрозрачно: callout там читается как карточка, а не как подсветка на
   странице. Берём вариант системы, режим наложения гасим — иначе он размажет
   и текст внутри.

   Рамка в ядре нулевой толщины. Это не та полоска, которую система убрала:
   левой акцентной полоски у callout в Obsidian нет вовсе, --callout-border-width
   задаёт рамку целиком. В системе она есть — 1px в цвете типа на 28%
   прозрачности, и без неё блок разваливается на светлой теме, где тинт 10%
   почти не виден.

   Паддинг в ядре асимметричный: слева --size-4-6 против --size-4-3 с трёх
   других сторон, место под иконку. Иконка в системе стоит в потоке, поэтому
   выравниваем. */

.theme-light,
.theme-dark {
${TAB}--callout-radius: var(--radius-md);
${TAB}--callout-padding: var(--gap-md);
${TAB}--callout-border-width: 1px;
${TAB}--callout-border-opacity: 0.28;
${TAB}--callout-blend-mode: normal;
${TAB}--callout-title-weight: var(--font-bold);

${TAB}/* Заголовок — цветом обычного текста, а не цветом типа.

${TAB}   Это система, и это же снимает старую проблему: яркие тона Latte держат
${TAB}   подложку, но как текст валят AA, из-за чего в токенах и появилась
${TAB}   отдельная ступень --c-*-text. Заголовку она не нужна — тип несёт
${TAB}   иконка и рамка, а цвет остаётся вторым различителем, не единственным.

${TAB}   Ядро красит .callout-title в --callout-color, а .callout-title-inner —
${TAB}   в --callout-title-color, и текст заголовка лежит именно во втором.
${TAB}   Значит хватает переменной, правило не нужно. */
${TAB}--callout-title-color: var(--fg);
}

.callout {
${TAB}background-color: color-mix(in oklch, var(--callout-color) 10%, var(--bg-elev));
}
`;
}
