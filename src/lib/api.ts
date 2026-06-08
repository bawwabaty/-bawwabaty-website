export const getApiUrl = (path: string) => {
  const cleanPath = path.replace(/^\/+/, "/");
  return cleanPath;
};
