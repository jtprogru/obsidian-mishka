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

/*
 * Тип ядра → роль системы.
 *
 * canonical — имя переменной --callout-*, её и красим.
 * names     — все написания, которые ядро на эту переменную сводит.
 * icon      — идентификатор иконки в ядре; тема его не меняет, но в
 *             документации он нужен: иконка и есть второй различитель к цвету,
 *             и без неё правило системы «цвет не единственный носитель смысла»
 *             у callout не выполняется.
 *
 * Один источник на CSS и на таблицу в README: разъехаться они могут только
 * вместе, и это проверяет check-drift.mjs.
 */
const TYPES = [
	{ canonical: 'default', role: 'c-note', tone: 'Lavender', icon: 'lucide-pencil', names: ['note'], note: 'и любой незнакомый ядру тип' },
	{ canonical: 'info', role: 'c-note', tone: 'Lavender', icon: 'lucide-info', names: ['info'] },
	{ canonical: 'todo', role: 'c-note', tone: 'Lavender', icon: 'lucide-check-circle-2', names: ['todo'] },
	{ canonical: 'summary', role: 'accent', tone: 'Sapphire', icon: 'lucide-clipboard-list', names: ['summary', 'abstract', 'tldr'] },
	{ canonical: 'tip', role: 'c-tip', tone: 'Green', icon: 'lucide-flame', names: ['tip', 'hint'] },
	{ canonical: 'success', role: 'c-tip', tone: 'Green', icon: 'lucide-check', names: ['success', 'check', 'done'] },
	{ canonical: 'important', role: 'c-important', tone: 'Mauve', icon: 'lucide-flame', names: ['important'] },
	{ canonical: 'question', role: 'c-important', tone: 'Mauve', icon: 'help-circle', names: ['question', 'help', 'faq'] },
	{ canonical: 'example', role: 'c-important', tone: 'Mauve', icon: 'lucide-list', names: ['example'] },
	{ canonical: 'warning', role: 'c-warn', tone: 'Peach', icon: 'lucide-alert-triangle', names: ['warning', 'caution', 'attention'] },
	{ canonical: 'fail', role: 'c-danger', tone: 'Red', icon: 'lucide-x', names: ['fail', 'failure', 'missing'] },
	{ canonical: 'error', role: 'c-danger', tone: 'Red', icon: 'lucide-zap', names: ['error', 'danger'] },
	{ canonical: 'bug', role: 'c-danger', tone: 'Red', icon: 'lucide-bug', names: ['bug'] },
	{ canonical: 'quote', role: 'fg-muted', tone: 'приглушённый текст', icon: 'quote-glyph', names: ['quote', 'cite'] },
];

export default function build() {
	const width = Math.max(...TYPES.map((t) => t.canonical.length));

	const rows = TYPES.map(({ canonical, role, names, note }) => {
		const pad = ' '.repeat(width - canonical.length);
		const aliases = names.join(', ') + (note ? `, ${note}` : '');
		return `${TAB}--callout-${canonical}:${pad} var(--${role});${' '.repeat(Math.max(1, 18 - role.length))}/* ${aliases} */`;
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

/*
 * Фрагмент README между маркерами callouts. Пишется тем же прогоном сборки,
 * что и CSS, из той же таблицы TYPES: документация, разъезжающаяся с кодом,
 * хуже отсутствующей, а проверить разъезд иначе нечем.
 */
export function docs() {
	const rows = TYPES.map(({ canonical, role, tone, icon, names, note }) => {
		const spellings = names.map((n) => `\`[!${n}]\``).join(', ') + (note ? ` ${note}` : '');
		return `| ${spellings} | \`--callout-${canonical}\` | \`--${role}\` | ${tone} | \`${icon}\` |`;
	});

	const total = TYPES.reduce((n, t) => n + t.names.length, 0);
	const semantic = new Set(TYPES.map((t) => t.role).filter((r) => r.startsWith('c-'))).size;

	return `${total} написаний ядро сводит к ${TYPES.length} переменным, а тема — к ${semantic} семантическим ролям системы. Двум типам роли не досталось, и это намеренно: \`summary\` красится акцентом, потому что подводка к тексту и есть его тема, а \`quote\` берёт \`--fg-muted\` и цвета не несёт вовсе.

Восьмёрка \`--color-*\` в раскладке не участвует: пойди callouts через неё, \`note\` уехал бы в Blue, а система на этом месте требует Lavender ровно потому, что Blue сливается с Sapphire.

| Написание | Переменная ядра | Роль системы | Тон catppuccin | Иконка |
|---|---|---|---|---|
${rows.join('\n')}

Тип несут иконка и рамка, а не только цвет: заголовок у всех типов набран \`--fg\`, как \`.callout__title\` в системе. Это же правило системы «цвет не единственный носитель смысла», и оно снимает старую проблему яркой Latte, где тон типа как текст не держит AA.`;
}
