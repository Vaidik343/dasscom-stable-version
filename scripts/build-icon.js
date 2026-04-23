/**
 * build-icon.js
 * Takes a SINGLE high-resolution PNG and auto-resizes it into all
 * required sizes, then combines them into one multi-layer .ico file.
 *
 * Usage: node scripts/build-icon.js <path-to-your-png>
 * Example: node scripts/build-icon.js build/icons/my-icon-2000.png
 *
 * If no argument is given, it defaults to the INPUT_FILE below.
 */

const pngToIco = require('png-to-ico').default ?? require('png-to-ico');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');

// --- CONFIGURE YOUR SINGLE INPUT FILE HERE ---
const INPUT_FILE = process.argv[2] || 'build/icons/suggetionIcon4.png';

// --- OUTPUT FILE ---
const OUTPUT_FILE = 'build/icons/suggetionIcon4-test.ico';

// Required sizes for a proper Windows ICO file
const SIZES = [16, 32, 48, 64, 128, 256];

async function buildIcon() {
  // Check input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    console.error('Usage: node scripts/build-icon.js <path-to-your-png>');
    process.exit(1);
  }

  console.log(`\n🖼️  Input: ${INPUT_FILE}`);
  console.log(`🎯 Output: ${OUTPUT_FILE}`);
  console.log(`📐 Generating sizes: ${SIZES.join('px, ')}px\n`);

  // Create temp directory for resized PNGs
  const tmpDir = path.join(os.tmpdir(), 'dasscom-icon-build');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // Resize the source PNG into each required size
  const resizedPaths = [];
  for (const size of SIZES) {
    const outPath = path.join(tmpDir, `icon-${size}.png`);
    await sharp(INPUT_FILE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 255 } // transparent background
      })
      .png()
      .toFile(outPath);
    resizedPaths.push(outPath);
    console.log(`   ✅ Generated ${size}x${size}px`);
  }

  // Combine all sizes into a single ICO file
  console.log('\n🔧 Combining all sizes into ICO...');
  const buf = await pngToIco(resizedPaths);
  fs.writeFileSync(OUTPUT_FILE, buf);

  // Cleanup temp files
  resizedPaths.forEach(f => fs.unlinkSync(f));

  console.log(`\n✅ ICO file created: ${OUTPUT_FILE}`);
  console.log(`📁 File size: ${(buf.length / 1024).toFixed(1)} KB`);
  console.log(`\n🎉 Done! Update package.json and main.js to use: ${OUTPUT_FILE}`);
}

buildIcon().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
