/**
 * Helper function to extract and format image URLs for dresses.
 * Extracts image path from API dress objects and converts relative/absolute
 * backend image URLs into same-origin proxy paths (/Content/...) to avoid
 * HTTPS Mixed Content blocking on Vercel deployments.
 * 
 * @param {string | object} input - Relative/Absolute image URL or dress object
 * @returns {string} Fully formatted image URL
 */
export const getImageUrl = (input) => {
  if (!input) return '/placeholder-dress.png';

  let path = input;

  // Extract property if dress object or image object was passed
  if (typeof input === 'object') {
    path =
      input.Image ||
      input.ImgPath ||
      input.ImagePath ||
      input.imageUrl ||
      input.ImageUrl ||
      (Array.isArray(input.DressImages) && input.DressImages.length > 0
        ? typeof input.DressImages[0] === 'string'
          ? input.DressImages[0]
          : input.DressImages[0]?.ImgPath || input.DressImages[0]?.ImagePath || input.DressImages[0]?.Url
        : null) ||
      (Array.isArray(input.Images) && input.Images.length > 0
        ? typeof input.Images[0] === 'string'
          ? input.Images[0]
          : input.Images[0]?.ImgPath || input.Images[0]?.ImagePath || input.Images[0]?.Url
        : null);
  }

  if (!path || typeof path !== 'string') {
    return '/placeholder-dress.png';
  }

  // Normalize Windows-style backslashes
  path = path.replace(/\\/g, '/').trim();

  // Strip backend origin (localhost with port or live backend) to use same-origin proxy (/Content/...)
  path = path.replace(/^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|dress-backend\.runasp\.net)/i, '');

  // If external absolute URL (e.g. cloudinary, unsplash) or data URI, return as-is
  if ((path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) && !path.toLowerCase().includes('/content/')) {
    return path;
  }

  // If path starts with 'content/' or 'Content/', ensure leading slash and uppercase 'Content'
  if (path.startsWith('/content/') || path.startsWith('/Content/')) {
    return '/Content/' + path.substring(9);
  }
  if (path.startsWith('content/') || path.startsWith('Content/')) {
    return '/Content/' + path.substring(8);
  }

  // Ensure leading slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return cleanPath;
};

export default getImageUrl;
