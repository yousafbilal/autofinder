/**
 * Fetch with timeout utility
 * Prevents network requests from hanging indefinitely
 */
// 60 seconds - allows slow backend (e.g. cold start, LAN, slow DB queries) to respond
export const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout: number = 60000): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Network request timed out'));
    }, timeout);

    fetch(url, { ...options, signal: controller.signal })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};









