export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.7
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
}
