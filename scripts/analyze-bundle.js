#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Analyzes the production bundle and reports size metrics
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_SIZE_THRESHOLDS = {
  warning: 2 * 1024 * 1024, // 2MB
  error: 5 * 1024 * 1024, // 5MB
};

function getDirectorySize(dirPath) {
  let totalSize = 0;

  function traverse(currentPath) {
    const stats = fs.statSync(currentPath);

    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach((file) => {
        traverse(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }

  if (fs.existsSync(dirPath)) {
    traverse(dirPath);
  }

  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function analyzeBundleSize() {
  console.log('🔍 Analyzing bundle size...\n');

  const distPath = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(distPath)) {
    console.log('⚠️  No dist folder found. Run a production build first.');
    console.log('   Run: npx expo export --platform all\n');
    return;
  }

  const totalSize = getDirectorySize(distPath);

  console.log('📊 Bundle Size Report:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Size: ${formatBytes(totalSize)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check thresholds
  if (totalSize > BUNDLE_SIZE_THRESHOLDS.error) {
    console.log('❌ ERROR: Bundle size exceeds 5MB threshold!');
    console.log('   Consider code splitting and lazy loading.\n');
    process.exit(1);
  } else if (totalSize > BUNDLE_SIZE_THRESHOLDS.warning) {
    console.log('⚠️  WARNING: Bundle size exceeds 2MB threshold.');
    console.log('   Consider optimizations to reduce bundle size.\n');
  } else {
    console.log('✅ Bundle size is within acceptable limits.\n');
  }

  // Analyze by platform
  ['ios', 'android', 'web'].forEach((platform) => {
    const platformPath = path.join(distPath, platform);
    if (fs.existsSync(platformPath)) {
      const platformSize = getDirectorySize(platformPath);
      console.log(`${platform.toUpperCase()}: ${formatBytes(platformSize)}`);
    }
  });

  console.log('\n💡 Optimization Tips:');
  console.log('   • Use dynamic imports for large components');
  console.log('   • Enable Hermes engine for Android');
  console.log('   • Optimize images and assets');
  console.log('   • Remove unused dependencies');
  console.log('   • Enable ProGuard for Android release builds\n');
}

analyzeBundleSize();
