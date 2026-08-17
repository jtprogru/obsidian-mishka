/*
 * Правила ревью каталога тем Obsidian плюс две отключённые проверки.
 *
 * Конфиг в .mjs, а не в .stylelintrc.json, ровно ради этих комментариев:
 * выключенное правило без объяснения на ревью читается как «мешало».
 */

/** @type {import('stylelint').Config} */
export default {
	extends: ['stylelint-config-obsidianmd'],
	rules: {
		/* Гарнитуры приезжают из токенов дизайн-системы как есть, а имена
		   шрифтов — имена собственные: Roboto, Arial, Georgia, Menlo, Consolas.
		   Приводить их к нижнему регистру пришлось бы либо правкой токенов
		   (их читают ещё четыре потребителя), либо расстановкой кавычек в
		   генераторе по списку generic-семейств — фрагильно ради регистра. */
		'value-keyword-case': null,

		/* Тема попадает в чужие классы, а не заводит свои. Часть классов
		   Obsidian и Prism не в kebab-case: .HyperMD-list-line, .CodeMirror,
		   .cm-s-obsidian, .token.class-name. Паттерн их не пропустит, а
		   переименовать их нельзя. */
		'selector-class-pattern': null,
	},
};
