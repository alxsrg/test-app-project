export type ImageDimensions = {
  width: number,
  height: number
}

export async function getImageNaturalDimensionsFromUrl(imageUrl: string, fallback: ImageDimensions): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      resolve({ width: naturalWidth, height: naturalHeight });
    };

    img.onerror = () => {
      resolve({
        width: fallback.width,
        height: fallback.height
      });
    };

    img.src = imageUrl;
  });
}

export async function getImageNaturalDimensions(base64String: string): Promise<ImageDimensions> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.src = base64String;
  });
}

export async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };

    reader.readAsDataURL(file);
  });
}

export function calculateImageDimensions(naturalWidth: number, naturalHeight: number): { width: number; height: number } {
  const maxSize = 300;
  let finalWidth = naturalWidth;
  let finalHeight = naturalHeight;

  if (naturalWidth > maxSize || naturalHeight > maxSize) {
    if (naturalWidth > naturalHeight) {
      finalWidth = maxSize;
      finalHeight = Math.round((naturalHeight * maxSize) / naturalWidth);
    } else {
      finalHeight = maxSize;
      finalWidth = Math.round((naturalWidth * maxSize) / naturalHeight);
    }
  }

  return {
    width: finalWidth,
    height: finalHeight
  };
}
