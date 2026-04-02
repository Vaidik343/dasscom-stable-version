const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const buildDir = path.join(process.cwd(), 'build');

const originalIco = path.join(publicDir, 'wifi.ico');
const png32 = path.join(publicDir, 'favicon-32x32.png');
const outputIco = path.join(buildDir, 'icon.ico');

if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir);

try {
    const originalBuf = fs.readFileSync(originalIco);
    const numImages = originalBuf.readUInt16LE(4);
    
    // We assume the first image is the 256x256 high-res PNG
    const offsetTo256 = originalBuf.readUInt32LE(6 + 12);
    const size256 = originalBuf.readUInt32LE(6 + 8);
    const data256 = originalBuf.slice(offsetTo256, offsetTo256 + size256);
    const data32 = fs.readFileSync(png32);

    const images = [
        { width: 256, height: 256, data: data256 },
        { width: 32, height: 32, data: data32 }
    ];

    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);

    let currentOffset = 6 + (images.length * 16);
    const entries = [];

    for (const img of images) {
        const entry = Buffer.alloc(16);
        entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
        entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
        entry.writeUInt8(0, 2);
        entry.writeUInt8(0, 3);
        entry.writeUInt16LE(1, 4);
        entry.writeUInt16LE(32, 6);
        entry.writeUInt32LE(img.data.length, 8);
        entry.writeUInt32LE(currentOffset, 12);
        entries.push(entry);
        currentOffset += img.data.length;
    }

    const finalBuf = Buffer.concat([header, ...entries, ...images.map(img => img.data)]);
    fs.writeFileSync(outputIco, finalBuf);
    console.log('✅ Successfully created multi-size icon.ico (256x256 + 32x32)');
} catch (err) {
    console.error('❌ Error building icon:', err.message);
    process.exit(1);
}
