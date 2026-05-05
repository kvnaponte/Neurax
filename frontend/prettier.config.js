/** @type {import("prettier").Config} */
export default {
	plugins: ['prettier-plugin-svelte'],
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
	printWidth: 100,
	useTabs: true,
	singleQuote: true,
	trailingComma: 'es5',
	arrowParens: 'avoid'
};
