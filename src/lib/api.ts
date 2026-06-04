export const getApiUrl = (path: string) => {
  // Always use standard relative paths for local API endpoints.
  // Use replace to strip any accidental double leading slashes.
  const cleanPath = path.replace(/^\/+/, "/");
  return cleanPath;
};
