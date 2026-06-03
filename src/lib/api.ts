export const getApiUrl = (path: string) => {
  // Use VITE_API_BASE_URL if defined, otherwise default to empty string (relative path)
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseUrl}${path}`;
};
