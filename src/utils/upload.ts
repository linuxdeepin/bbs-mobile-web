import Taro from "@tarojs/taro";
import { document } from "@tarojs/runtime";

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

/** H5 uses the same-origin browser session; mini programs use the HTTP plugin's cookie jar. */
export async function uploadImage(filePath: string): Promise<string> {
  const isH5 = process.env.TARO_ENV === "h5";
  const header: Record<string, string> = {};
  if (!isH5) {
    const cookie = (document as unknown as { $$cookie?: string }).$$cookie;
    if (!cookie) throw new Error("登录已失效，请重新登录");
    header.Cookie = cookie;
  }
  const response = await Taro.uploadFile({
    url: `${isH5 ? "" : process.env.SERVER}/api/v1/thread/file`,
    filePath,
    name: "image",
    header,
    timeout: 30000,
  });
  if (response.statusCode !== 200) throw new Error("上传图片失败，请稍后重试");
  let parsed: unknown;
  try {
    parsed = JSON.parse(response.data);
  } catch {
    throw new Error("图片上传响应无效，请稍后重试");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("图片上传响应无效，请稍后重试");
  }
  const result = parsed as { code?: unknown; msg?: unknown; data?: unknown };
  if ((result.code !== undefined && result.code !== 0) || !Array.isArray(result.data) ||
      typeof result.data[0] !== "string" || !result.data[0]) {
    throw new Error(typeof result.msg === "string" && result.msg || "上传图片失败，请稍后重试");
  }
  return result.data[0];
}
