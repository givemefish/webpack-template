/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');
const getPublicUrlOrPath = require('./getPublicUrlOrPath.js');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const publicUrlOrPath = getPublicUrlOrPath(
  process.env.NODE_ENV === 'development',
  require(resolveApp('package.json')).homepage
);

const moduleFileExtensions = ['.js', '.jsx', '.json'];

const resolveModule = (resolveFn, filePath) => {
  const extension = moduleFileExtensions.find((ext) => fs.existsSync(resolveFn(`${filePath}.${ext}`)));

  if (extension) {
    return resolveFn(`${filePath}.${extension}`);
  }

  return resolveFn(`${filePath}.js`);
};

module.exports = {
  dotenv: resolveApp('.env'),
  appPath: resolveApp('.'),
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public'),
  appHtml: resolveApp('public/index.html'),
  appIndexJs: resolveModule(resolveApp, 'src/index'),
  appNodeModules: resolveApp('node_modules'),
  appSrc: resolveApp('src'),
  publicUrlOrPath
};

module.exports.moduleFileExtensions = moduleFileExtensions;
