const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
).replace(/\/$/, "");

type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
    }; // 定义后端返回格式

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

const TOKEN_KEY = "campus_wall_token"; // token 存在浏览器 localStorage 里
// 管理登录状态
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}
/*
调用 apiRequest
  -> 拼接 URL
  -> 设置 JSON 请求头
  -> 添加 JWT
  -> fetch 发请求
  -> 解析后端 JSON
  -> 检查 HTTP/业务状态
  -> 成功返回 data，失败抛 Error
*/
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const { body, auth = false, headers, ...fetchOptions } = options; // 取出部分字段，剩下的放入 fetchOptions
  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAuthToken();

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  } // 把 token 添加到请求头

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  }); // 拼接路径，发送请求

  const result = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null; // 解析后端返回的 JSON

  if (!result) {
    throw new Error("Request failed");
  }

  if (!response.ok || !result.ok) {
    throw new Error(result.ok ? "Request failed" : result.message);
  }

  return result.data;
}
