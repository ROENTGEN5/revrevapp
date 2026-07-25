/**
 * Client-side Image Auto-Compressor
 * Resizes and compresses any image file to ultra-compact Web JPEG format using HTML5 Canvas.
 * 
 * @param {File} file - The uploaded Image File object
 * @param {number} maxWidth - Maximum width (default 800px)
 * @param {number} maxHeight - Maximum height (default 800px)
 * @param {number} quality - JPEG compression quality (0.0 to 1.0, default 0.75)
 * @returns {Promise<string>} Base64 Data URL of the compressed image
 */
export async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (PNG, JPG, WebP, etc.).'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio downscaling
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = (err) => reject(new Error('Failed to load image for compression.'));
    };

    reader.onerror = (err) => reject(new Error('Failed to read image file.'));
  });
}
