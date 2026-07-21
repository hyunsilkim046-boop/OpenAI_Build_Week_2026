export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly headers?: HeadersInit,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toErrorResponse(error: unknown): Response {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(
          "INTERNAL_ERROR",
          "Something went wrong. Please try again.",
          500,
        );

  return Response.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
      },
    },
    {
      status: apiError.status,
      headers: {
        "Cache-Control": "no-store",
        ...Object.fromEntries(new Headers(apiError.headers).entries()),
      },
    },
  );
}

export const MAX_REQUEST_BODY_BYTES = 16 * 1_024;

async function readRequestBodyWithLimit(request: Request): Promise<string> {
  const declaredLength = request.headers.get("content-length");

  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isInteger(parsedLength) || parsedLength < 0) {
      throw new ApiError(
        "INVALID_CONTENT_LENGTH",
        "Content-Length must be a non-negative integer.",
        400,
      );
    }
    if (parsedLength > MAX_REQUEST_BODY_BYTES) {
      throw new ApiError(
        "REQUEST_TOO_LARGE",
        "Request body must be 16 KB or smaller.",
        413,
      );
    }
  }

  if (!request.body) {
    throw new ApiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let byteCount = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      byteCount += value.byteLength;
      if (byteCount > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new ApiError(
          "REQUEST_TOO_LARGE",
          "Request body must be 16 KB or smaller.",
          413,
        );
      }

      text += decoder.decode(value, { stream: true });
    }

    text += decoder.decode();
    return text;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
}

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown>> {
  let value: unknown;

  try {
    value = JSON.parse(await readRequestBodyWithLimit(request)) as unknown;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError("INVALID_REQUEST", "Request body must be an object.", 400);
  }

  return value as Record<string, unknown>;
}
