/*
 * src/04-code.css — подсветка кода на ролях --syn-* дизайн-системы.
 *
 * Два слоя. Первый — одиннадцать ролей ядра: --code-keyword, --code-string и
 * так далее. Их хватает, чтобы код перестал быть чужим: Obsidian сам развесил
 * их и на Prism (режим чтения), и на CodeMirror (режим правки).
 *
 * Второй слой — добивка. Ролей у ядра одиннадцать, у системы десять, но
 * границы между ними проходят по-разному, и в паре мест ядро сваливает в одну
 * роль то, что система разводит:
 *
 *   .cm-meta       → комментарий, а в системе это --syn-meta (Teal)
 *   .token.variable → свойство, а в системе это --syn-variable (цвет текста)
 *   .token.constant → тег,       а в системе это --syn-constant (Peach)
 *   .token.class-name → функция, а в системе это --syn-type (Yellow)
 *
 * Раскладка добивки повторяет ROLES из scripts/gen-chroma.mjs системы: блог
 * красит код Chroma'ой по той же таблице, и расхождение между постом и
 * заметкой читалось бы сразу.
 *
 * Начертание — второй различитель к цвету, и оно тоже из системы: комментарии
 * курсивом (курсив Iosevka режется ровно ради них), операторы полужирным.
 */

const TAB = '\t';

/* Одиннадцать ролей ядра на десять ролей системы. Пунктуация своей роли в
   системе не имеет: Chroma её не красит, и она печатается цветом текста. Здесь
   приглушается — в заметке скобок и запятых больше, чем в посте. */
const CORE_ROLES = [
	['code-background', 'code-bg'],
	['code-normal', 'syn-variable'],
	['code-comment', 'syn-comment'],
	['code-function', 'syn-function'],
	['code-keyword', 'syn-keyword'],
	['code-operator', 'syn-operator'],
	['code-property', 'syn-meta'],
	['code-string', 'syn-string'],
	['code-tag', 'syn-type'],
	['code-value', 'syn-number'],
	['code-important', 'syn-constant'],
	['code-punctuation', 'fg-muted'],
];

/* Классы, которые ядро отправило не в ту роль. Слева — Prism (режим чтения) и
   CodeMirror (режим правки) вперемешку: раскладка у них разная, а роль одна.

   Комментарий у каждой группы — из ROLES в gen-chroma.mjs системы. */
const FIXUPS = [
	[
		'syn-meta',
		'атрибуты, декораторы, свойства, регулярные выражения',
		['.token.property', '.token.attr-name', '.token.regex', '.cm-meta', '.cm-attribute', '.cm-property'],
	],
	[
		'syn-variable',
		'переменные и всё, что печатается цветом текста',
		['.token.variable', '.token.parameter', '.cm-variable', '.cm-variable-2', '.cm-variable-3'],
	],
	[
		'syn-type',
		'типы, классы, пространства имён, исключения',
		['.token.class-name', '.token.namespace', '.cm-type', '.cm-def'],
	],
	[
		'syn-constant',
		'константы и escape-последовательности',
		['.token.constant', '.token.boolean', '.token.symbol', '.token.entity', '.cm-atom'],
	],
	[
		'syn-function',
		'функции и встроенные имена',
		['.token.builtin', '.cm-builtin'],
	],
	[
		'syn-keyword',
		'ключевые слова и теги разметки',
		['.token.tag', '.token.atrule', '.token.selector'],
	],
];

/* Диффы внутри блока кода: здесь цвет несёт смысл, поэтому берётся не из
   палитры подсветки, а из семантики системы. Значения --c-*-text проверены
   на подложке кода — она совпадает с подложкой карточки. */
const SEMANTIC = [
	['c-danger-text', 'удалённые строки диффа', ['.token.deleted']],
	['c-tip-text', 'добавленные строки диффа', ['.token.inserted']],
];

const ITALIC = ['.token.comment', '.token.prolog', '.token.cdata', '.cm-comment'];
const BOLD = ['.token.operator', '.cm-operator'];

const sel = (list) => list.join(',\n');

export default function build() {
	const out = [];

	out.push(`/* СГЕНЕРИРОВАНО scripts/gen-code.mjs — не править руками.

   Подсветка кода на ролях --syn-* дизайн-системы. Профиль один: тему
   переключают сами токены, светлой и тёмной таблицы не нужно.

   Порог AA на подложке кода держится в токенах и проверяется
   scripts/check-contrast.mjs — здесь только раскладка ролей. */

/* Одиннадцать ролей ядра на десять ролей системы. Дальше Obsidian развесит их
   сам: и на .token.* режима чтения, и на .cm-* режима правки. */

.theme-light,
.theme-dark {`);
	for (const [core, role] of CORE_ROLES) out.push(`${TAB}--${core}: var(--${role});`);
	out.push('}');

	out.push(`
/* Добивка: классы, которые ядро отправило в соседнюю роль. Раскладка — из
   ROLES генератора Chroma в системе, чтобы заметка и пост подсвечивались
   одинаково. */`);

	for (const [role, note, classes] of [...FIXUPS, ...SEMANTIC]) {
		out.push(`\n/* ${note} */\n${sel(classes)} {\n${TAB}color: var(--${role});\n}`);
	}

	out.push(`
/* Начертание — второй различитель к цвету, правило системы. Комментарии
   курсивом: курсив Iosevka нарезан ровно ради них. Операторы полужирным. */

${sel(ITALIC)} {
${TAB}font-style: italic;
}

${sel(BOLD)} {
${TAB}font-weight: var(--font-bold);
}`);

	return out.join('\n') + '\n';
}
