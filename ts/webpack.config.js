/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack')
const path = require('path')
const loaders = require('./webpack.loaders')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const { DefinePlugin, HotModuleReplacementPlugin } = webpack
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

const env = process.env
const root = path.resolve(__dirname, './') // this file will be buried in node_modules/@j2inn/react-config, so...
const finstackURL = `http://${env.HOST || 'localhost:8080'}`
const mode = env.NODE_ENV || 'development'
const prod = mode === 'production'

require('@j2inn/react-config/type-receiver')

const config = {
	mode: mode,
	entry: [path.resolve(root, './src/main.tsx')], //[entryPath],
	context: root,
	output: {
		clean: true,
		publicPath: env.OUT_PATH || 'auto',
		path: path.resolve(root, 'build'),
		pathinfo: !prod,
		filename: prod ? '[contenthash].[fullhash].js' : '[name].js',
		chunkFilename: prod
			? 'assets/js/chunk.[chunkhash].js'
			: 'assets/js/chunk.[name].js',
		// ...library,
	},
	resolve: {
		extensions: [
			'.js',
			'.ts',
			'.tsx',
			'.jsx',
			'.css',
			'.styl',
			'.less',
			'.html',
			'.json',
		],
		modules: [path.resolve(root, 'src'), 'node_modules'],
		mainFields: ['jsnext:main', 'module', 'browser', 'main'],
		alias: {
			'@': path.resolve(root, 'src'),
			lodash$: path.resolve(root, 'node_modules/lodash-es'),
			moment$: 'moment/moment.js',
			react$: path.resolve(root, 'node_modules/react'),
		},
	},
	optimization: {
		minimize: false,
		concatenateModules: true,
		emitOnErrors: !prod,
		chunkIds: 'named',
		moduleIds: 'named',
		usedExports: true,
		sideEffects: true,
		splitChunks: {
			chunks: 'all',
		},
	},
	module: {
		rules: loaders,
	},
	devtool: 'source-map',
	devServer: {
		devMiddleware: {
			writeToDisk: true,
		},
		hot: true,
		historyApiFallback: true,
		host: '0.0.0.0',
		allowedHosts: 'all',
		static: {
			directory: path.resolve(root, 'build'),
			publicPath: '/',
		},
		proxy: {
			'/auth/*': finstackURL,
			'/api/*': finstackURL,
			'/fin5Lang/*': finstackURL,
			'/finStackAuth': finstackURL,
			'/finWebApp/finstack': finstackURL,
			'/finGetFile/*': finstackURL,
			'/user/*': finstackURL,
			'/fin5/*': finstackURL,
			'/finPod/*': finstackURL,
			'/pod/*': finstackURL,
		},
	},
	stats: 'minimal',
	plugins: [
		new HtmlWebpackPlugin({ template: './src/template.html' }),
		new DefinePlugin({ DEBUG: !prod, PRODUCTION: prod }),
		new MomentLocalesPlugin(),
		new LodashModuleReplacementPlugin({ paths: true, shorthands: true }),
		new MiniCssExtractPlugin({
			ignoreOrder: true,
		}),
	],
}

if (prod) {
	const TerserPlugin = require('terser-webpack-plugin')
	config.optimization.minimize = true
	config.optimization.minimizer = [new TerserPlugin()]

	config.plugins.push(
		new webpack.ids.HashedModuleIdsPlugin({
			hashFunction: 'sha256',
			hashDigest: 'hex',
			hashDigestLength: 10,
		})
	)
} else {
	config.plugins.push(new ReactRefreshWebpackPlugin())
	config.plugins.push(new HotModuleReplacementPlugin())
}

module.exports = config
