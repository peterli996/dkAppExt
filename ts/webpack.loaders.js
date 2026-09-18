/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const env = process.env

function getLessVars(filePath) {
	if (!filePath || !fs.existsSync(filePath)) {
		return {}
	}

	const contents = String(fs.readFileSync(filePath, { encoding: 'utf-8' }))
	return JSON.parse(contents)
}

function styleLadder(options = {}) {
	return [
		MiniCssExtractPlugin.loader,
		{
			loader: 'css-modules-typescript-loader',
			options: {
				mode: 'emit',
			},
		},
		{
			loader: 'css-loader',
			options: {
				url: false,
				importLoaders: 1,
				...options,
			},
		},
	]
}

module.exports = [
	{
		// Match js, jsx, ts & tsx files
		test: /\.[jt]sx?$/,
		loader: 'esbuild-loader',
		options: {
			target: 'es2015',
		},
	},
	{
		test: /\.css$/,
		use: styleLadder({ url: true, importLoaders: 0 }),
	},
	{
		test: /.styl$/,
		use: [
			...styleLadder({
				modules: { localIdentName: '[local]--[hash:base64:5]' },
			}),
			'stylus-loader',
		],
	},
	{
		test: /\.less$/,
		use: [
			...styleLadder(),
			{
				loader: 'less-loader',
				options: {
					lessOptions: {
						javascriptEnabled: true,
						modifyVars: getLessVars(env.THEME_PATH),
					},
				},
			},
		],
	},
	{
		test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
		type: 'asset/resource',
	},
	{
		test: /\.(woff(2)?|eot|ttf|otf|)$/,
		type: 'asset/inline',
	},
	{
		test: /\.svg$/,
		use: ['@svgr/webpack'],
	},
]
