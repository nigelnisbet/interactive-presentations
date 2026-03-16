const fs = require('fs');
const { exec } = require('child_process');

// For macOS, we'll use qlmanage or create a simple HTML approach
const svgPath = './packages/extension/public/icons/icon-new.svg';

console.log('SVG icon created at:', svgPath);
console.log('\nTo convert to PNG, you can:');
console.log('1. Open the SVG in Preview.app and export as PNG');
console.log('2. Use online tool: https://cloudconvert.com/svg-to-png');
console.log('3. Install ImageMagick: brew install imagemagick');
console.log('\nOr copy these commands after installing ImageMagick:');
console.log('convert icon-new.svg -resize 16x16 icon16.png');
console.log('convert icon-new.svg -resize 48x48 icon48.png');
console.log('convert icon-new.svg -resize 128x128 icon128.png');
