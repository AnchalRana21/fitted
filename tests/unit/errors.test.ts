import { describe, expect, it } from "vitest";
import { describeError, ERROR_MESSAGES } from "@/lib/errors";

describe("describeError", () => {
  it("returns the plain message for most codes", () => {
    expect(describeError("network")).toBe(ERROR_MESSAGES.network);
  });

  it("adds the reset time for rate limits", () => {
    const text = describeError("rate_limited", Date.now() + 60_000);
    expect(text).toContain(ERROR_MESSAGES.rate_limited);
    expect(text).toContain("reset at");
  });
});
