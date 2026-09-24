/**
 * Formats age in months into a human readable string
 * e.g. 14 -> "1 Year 2 Months Old"
 * e.g. 6 -> "6 Months Old"
 * e.g. 0 -> "Brand New (< 1 Month)"
 */
export const formatDressAge = (months) => {
  if (months === undefined || months === null || months <= 0) {
    return 'Brand New (< 1 Month)';
  }
  const totalMonths = Number(months);
  const years = Math.floor(totalMonths / 12);
  const remMonths = totalMonths % 12;

  if (years === 0) {
    return `${remMonths} Month${remMonths > 1 ? 's' : ''} Old`;
  }
  if (remMonths === 0) {
    return `${years} Year${years > 1 ? 's' : ''} Old`;
  }
  return `${years} Year${years > 1 ? 's' : ''} ${remMonths} Month${remMonths > 1 ? 's' : ''} Old`;
};
