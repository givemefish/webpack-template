const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const postcssNormalize = require('postcss-normalize');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const safePostCssParser = require('postcss-safe-parser');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const paths = require('./config/paths');
const getClientEnvironment = require('./config/getClientEnvironment');

const appName = process.env.APP_NAME || 'Template';

// Provide "paths.publicUrlOrPath" as %PUBLIC_URL% in "index.html"
// and "process.env.PUBLIC_URL" in JS
const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000', 10);

module.exports = {
  mode: 'production',
  // Stop compilation early
  bail: true,
  devtool: 'source-map',
  entry: paths.appIndexJs,
  output: {
    path: paths.appBuild,
    pathinfo: false,
    filename: 'static/js/[name].[contenthash:8].js',
    // remove this when upgrading to webpack 5
    futureEmitAssets: true,
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    publicPath: '/',
    globalObject: 'this'
  },
  resolve: {
    // This allows you to set a fallback for where webpack should look for modules.
    // if any conflicts exists, we want "node_modules" to win.
    modules: ['node_modules', paths.appNodeModules],
    extensions: paths.moduleFileExtensions
  },
  module: {
    strictExportPresence: true,
    rules: [
      // Disable require.ensure as it's not a standard language feature.
      {
        parser: {
          requireEnsure: false
        }
      },
      // Run the linter first.
      {
        test: /\.(js|mjs|jsx)$/,
        enforce: 'pre',
        use: [
          {
            loader: require.resolve('eslint-loader'),
            options: {
              cache: true,
              eslintPath: require.resolve('eslint'),
              formatter: 'table',
              resolvePluginRelativeTo: __dirname
            }
          }
        ]
      },
      {
        // "oneOf" will traverse all following loaders until one will match the requirements.
        // When no loader matches it will fall back to the "file" loader at the end of the
        // loader list.
        oneOf: [
          // Process application images.
          // Embedded assets smaller than specified limit in "bytes" as data URLS to avoid requests
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: imageInlineSizeLimit,
              name: 'static/media/[name].[hash:8].[ext]'
            }
          },
          // Process application JS with Babel
          {
            test: /.(js|mjs|jsx)$/,
            loader: require.resolve('babel-loader'),
            include: paths.appSrc,
            options: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-transform-runtime'],
              cacheDirectory: true,
              cacheCompression: false,
              compact: true
            }
          },
          // Support for css with autoprefixer
          // In production, use MiniCssExtractPlugin to extract CSS to a file.
          {
            test: /\.css$/,
            loader: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  publicPath: '../../'
                }
              },
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                  sourceMap: true
                }
              },
              {
                loader: require.resolve('postcss-loader'),
                options: {
                  ident: 'postcss',
                  plugins: () => [
                    // fix flexbox issues: ref. https://github.com/philipwalton/flexbugs
                    require('postcss-flexbugs-fixes'),
                    // convert modern CSS, determining the polyfills based on targeted browsers
                    require('postcss-preset-env')({
                      autoprefixer: {
                        flexbox: 'no-2009'
                      },
                      stage: 3
                    }),
                    // Adds PostCSS Normalize as the reset css with default options,
                    // so that it honors browserslist config in package.json
                    // which in turn let's users customize the target behavior as per their needs.
                    postcssNormalize()
                  ],
                  sourceMap: true
                }
              }
            ],
            sideEffects: true
          },
          // Opt-in support for SASS/SCSS
          {
            test: /\.(scss|sass)$/,
            loader: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 3,
                  sourceMap: true
                }
              },
              {
                loader: require.resolve('postcss-loader'),
                options: {
                  ident: 'postcss',
                  plugins: () => [
                    // fix flexbox issues: ref. https://github.com/philipwalton/flexbugs
                    require('postcss-flexbugs-fixes'),
                    // convert modern CSS, determining the polyfills based on targeted browsers
                    require('postcss-preset-env')({
                      autoprefixer: {
                        flexbox: 'no-2009'
                      },
                      stage: 3
                    }),
                    // Adds PostCSS Normalize as the reset css with default options,
                    // so that it honors browserslist config in package.json
                    // which in turn let's users customize the target behavior as per their needs.
                    postcssNormalize()
                  ],
                  sourceMap: true
                }
              },
              {
                loader: require.resolve('resolve-url-loader'),
                options: {
                  sourceMap: true
                }
              },
              {
                loader: require.resolve('sass-loader'),
                options: {
                  // sourceMap here need to be true for resolve-url-loader
                  sourceMap: true
                }
              }
            ],
            sideEffects: true
          },
          // Support of all other type of assets
          {
            loader: require.resolve('file-loader'),
            exclude: [/\.(js|mjs|jsx)$/, /\.html$/, /\.json$/],
            options: {
              name: 'static/media/[name].[hash:8].[ext]'
            }
          }
          // ** Any new loader(s) must be added before the "file" loader.
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml,
      title: appName,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),
    new webpack.DefinePlugin(env.stringified),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css'
    }),
    // Generate an asset manifest file with the following content:
    // 1. "files": Mapping of all asset filenames to their corresponding output file.
    // 2. "entrypoints": Array of files which are included in "index.html"
    new ManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: paths.publicUrlOrPath,
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);
        const entrypointFiles = entrypoints.main.filter((filename) => !filename.endsWith('.map'));
        return {
          files: manifestFiles,
          entrypoints: entrypointFiles
        };
      }
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: paths.appPublic,
          to: paths.appBuild,
          globOptions: {
            ignore: '**/index.html'
          }
        }
      ]
    }),
    new CleanWebpackPlugin()
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2
          },
          mangle: {
            safari10: true
          },
          keep_classnames: true,
          keep_fnames: true,
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true
          }
        },
        sourceMap: true
      }),
      new OptimizeCssAssetsPlugin({
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: {
            inline: false,
            annotation: true
          }
        },
        cssProcessorPluginOptions: {
          presets: ['default', { minifyFontValues: { removeQuotes: false } }]
        }
      })
    ],
    // Automatically split vendor and commons
    splitChunks: {
      chunks: 'all',
      name: false
    },
    // Keep the runtime chunk separated to enable long term caching.
    runtimeChunk: {
      name: (entrypoint) => `runtime-${entrypoint.name}`
    }
  }
};
