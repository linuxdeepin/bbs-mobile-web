export function requestErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return fallback;
  const request = error as { response?: { status?: number }; isAxiosError?: boolean; message?: string };
  if (request.response?.status === 429) return "发送过于频繁，请稍后再试";
  if (request.response?.status === 401) return "登录已失效，请重新登录";
  if (request.isAxiosError) return fallback;
  return request.message || fallback;
}
