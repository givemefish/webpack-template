const { URL } = require('url');

function getPublicUrlOrPath(isEnvDevelopment, homepage) {
  const stubDomain = 'https://www.yuanta.com.tw';

  if (!homepage) return '/';

  // Needs to end with slash.
  const homepagePath = homepage.endsWith('/') ? homepage : `${homepage}/`;

  // Validate if "homepage" is a URL or path like and use pathname only.
  const validHomepagePathname = new URL(homepagePath, stubDomain).pathname;
  if (isEnvDevelopment) {
    return homepagePath.startsWith('.') ? '/' : validHomepagePathname;
  }

  // Some apps do not use client-side routing with pushState.
  // For these apps, "homepage" can be set to "." to enable relative asset paths.
  return homepagePath.startsWith('.') ? homepagePath : validHomepagePathname;
}

module.exports = getPublicUrlOrPath;
