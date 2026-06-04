export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Helper to reliably construct API URLs
export const getApiUrl = (path: string) => {
  // If the path already has http/https, just return it
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Ensure we don't have double slashes
  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};
