const Jimp = require('jimp');

async function cropAndPad() {
    try {
        console.log("Loading image...");
        const image = await Jimp.read('C:\\electron\\dasscom12febcommit\\dasscom_react_electron\\build\\icons\\dasscom-black-square.png');
        
        console.log("Original dimensions:", image.bitmap.width, "x", image.bitmap.height);
        
        // Autocrop transparent borders
        image.autocrop();
        
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        console.log("Cropped dimensions (actual logo size):", width, "x", height);
        
        // Now pad it into a square
        const size = Math.max(width, height);
        // Add a 10% padding so it doesn't touch the very edges of the square
        const padding = Math.floor(size * 0.1);
        const finalSize = size + (padding * 2);
        
        console.log("Padding into perfect square of size:", finalSize, "x", finalSize);
        
        const squareImage = await new Jimp(finalSize, finalSize, 0x00000000); // Transparent background
        
        // Paste the cropped image in the center
        const xOffset = Math.floor((finalSize - width) / 2);
        const yOffset = Math.floor((finalSize - height) / 2);
        
        squareImage.composite(image, xOffset, yOffset);
        
        // Save
        const outPath = 'C:\\electron\\dasscom12febcommit\\dasscom_react_electron\\build\\icons\\dasscom-autocropped.png';
        await squareImage.writeAsync(outPath);
        console.log("Saved perfected icon to", outPath);
        
    } catch (err) {
        console.error("Error processing image:", err);
    }
}

cropAndPad();
