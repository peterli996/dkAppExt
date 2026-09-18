/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
	// A preset that is used as a base for Jest's configuration
	preset: 'ts-jest',

	// The test environment that will be used for testing
	testEnvironment: 'node',

	moduleDirectories: ['node_modules', 'src'],

	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
}
