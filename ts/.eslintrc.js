module.exports = {
	globals: {
		DEBUG: false,
		PRODUCTION: false,
		finstack: false,
	},
	parser: '@typescript-eslint/parser',
	extends: [
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react-hooks/recommended',
		'plugin:prettier/recommended',
	],
	env: {
		browser: true,
		es6: true,
		node: true,
		jest: true,
	},
	plugins: ['react', 'react-hooks'],
}
