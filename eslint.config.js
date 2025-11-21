const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
	{
		ignores: ['logs/**', 'node_modules/**', '**/*.min.js']
	},
	js.configs.recommended,
	{
		languageOptions: {
			sourceType: 'script',
			globals: {
				...globals.node,
				...globals.browser,
				document: true
			}
		},
		rules: {
			'no-console': 'off',
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
			'no-undef': 'error',
			'prefer-const': ['warn', { destructuring: 'all' }]
		}
	}
];
