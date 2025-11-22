// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable tree-shaking and minification
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      toplevel: true,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    warnings: false,
  },
};

// Optimize asset handling
config.resolver = {
  ...config.resolver,
  assetExts: [...(config.resolver?.assetExts || []), 'db', 'mp3', 'ttf', 'obj', 'png', 'jpg'],
  sourceExts: [...(config.resolver?.sourceExts || []), 'jsx', 'js', 'ts', 'tsx', 'json', 'mjs', 'cjs'],
};

// Enable lazy bundling for faster development
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Enable gzip compression
      res.setHeader('Content-Encoding', 'gzip');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
