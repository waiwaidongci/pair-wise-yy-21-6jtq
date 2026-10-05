/** 统一请求封装：前端只请求 /api，禁止硬编码 host */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { code?: string })?.code ?? "HTTP_ERROR",
      (data as { message?: string })?.message ?? res.statusText,
      data
    );
  }
  return data as T;
};

/** 生成本次复电动作的幂等键；同一动作的重试必须复用它 */
export const createRestoreRequestId = (ticketId: number): string =>
  `rst-web-${ticketId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
