import { beforeEach, describe, expect, it } from "vitest";

import {
  clearRateLimitStateForTests,
  enforceRateLimit,
} from "../lib/rate-limit";

function request(ip: string): Request {
  return new Request("https://whyright.test/api/turn", {
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });
}

describe("per-instance request throttling", () => {
  beforeEach(() => clearRateLimitStateForTests());

  it("returns a retryable 429 after the per-window limit", () => {
    const options = {
      scope: "turn:create",
      limit: 2,
      windowMs: 60_000,
      now: 100_000,
    };

    enforceRateLimit(request("192.0.2.1"), options);
    enforceRateLimit(request("192.0.2.1"), options);

    expect(() =>
      enforceRateLimit(request("192.0.2.1"), options),
    ).toThrowError(/Too many requests/);

    try {
      enforceRateLimit(request("192.0.2.1"), options);
    } catch (error) {
      expect(error).toMatchObject({ code: "RATE_LIMITED", status: 429 });
    }
  });

  it("isolates clients and resets after the fixed window", () => {
    const base = {
      scope: "session:create",
      limit: 1,
      windowMs: 1_000,
    };

    enforceRateLimit(request("192.0.2.1"), { ...base, now: 10_000 });
    expect(() =>
      enforceRateLimit(request("192.0.2.1"), { ...base, now: 10_500 }),
    ).toThrow();
    expect(() =>
      enforceRateLimit(request("192.0.2.2"), { ...base, now: 10_500 }),
    ).not.toThrow();
    expect(() =>
      enforceRateLimit(request("192.0.2.1"), { ...base, now: 11_000 }),
    ).not.toThrow();
  });
});
