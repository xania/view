const fspath = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (_, argv) => {
  return [createConfig('commonjs2'), createConfig('umd')];
};

function createConfig(outputType) {
  return {
    target: 'web',
    entry: ['./lib/index.ts'],
    mode: 'production',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                esModule: true,
                name: '[path][name]-[hash].css',
              },
            },
            { loader: 'extract-loader' },
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                // you can specify a publicPath here
                // by default it uses publicPath in webpackOptions.output
                publicPath: './',
                // esModule: true,
                // hmr: true,
              },
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [['autoprefixer']],
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                // Prefer Dart Sass
                implementation: require('sass'),
                sassOptions: {
                  includePaths: ['./node_modules'],
                },
              },
            },
          ],
        },
        {
          test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
          use: {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
            },
          },
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.scss', '.css'],
    },
    output: {
      filename: '[name].' + outputType + '.js',
      path: fspath.resolve(__dirname, 'dist'),
      library: {
        name: 'XaniaJS',
        type: outputType,
      },
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].[chunkhash:8].css',
        chunkFilename: '[id].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
    ],
  };
}
