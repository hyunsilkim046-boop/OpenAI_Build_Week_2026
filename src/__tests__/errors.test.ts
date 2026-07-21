import { describe, expect, it } from "vitest";

import {
  ApiError,
  MAX_REQUEST_BODY_BYTES,
  readJsonObject,
  toErrorResponse,
} from "../lib/errors";

function postRequest(body: string, headers?: HeadersInit): Request {
  return new Request("https://whyright.test/api", {
    method: "POST",
    body,
    headers,
  });
}

describe("bounded JSON request parsing", () => {
  it("parses a valid JSON object", async () => {
    await expect(readJsonObject(postRequest('{"ok":true}'))).resolves.toEqual({
      ok: true,
    });
  });

  it("rejects an oversized declared Content-Length before reading", async () => {
    await expect(
      readJsonObject(
        postRequest("{}", {
          "Content-Length": String(MAX_REQUEST_BODY_BYTES + 1),
        }),
      ),
    ).rejects.toMatchObject({ code: "REQUEST_TOO_LARGE", status: 413 });
  });

  it("stops a streamed body that exceeds 16 KB without Content-Length", async () => {
    const body = JSON.stringify({ value: "x".repeat(MAX_REQUEST_BODY_BYTES) });
    await expect(readJsonObject(postRequest(body))).rejects.toMatchObject({
      code: "REQUEST_TOO_LARGE",
      status: 413,
    });
  });

  it("preserves response headers supplied by an API error", async () => {
    const response = toErrorResponse(
      new ApiError("RATE_LIMITED", "Slow down.", 429, {
        "Retry-After": "7",
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("7");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
