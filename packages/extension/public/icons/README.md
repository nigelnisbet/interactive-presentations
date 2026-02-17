# Extension Icons

For now, you can use the icon.svg as a base. To create the required PNG icons (16x16, 48x48, 128x128), you can:

1. Use an online SVG to PNG converter
2. Use ImageMagick: `convert icon.svg -resize 16x16 icon16.png`
3. Or temporarily use placeholder images

The extension will work without icons, they just won't display properly in Chrome.

For quick testing, you can copy any PNG file three times with the correct names:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)
