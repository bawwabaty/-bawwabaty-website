export const getApiUrl = (path: string) => {
  // Always use relative paths for local API endpoints to ensure they
  // hit the Express server running on the same host/port.
  return path.startsWith("/") ? path : `/${path}`;
};
