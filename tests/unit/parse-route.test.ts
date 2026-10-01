import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/parse/route";

function post(body?: FormData, headers?: Record<string, string>) {
  return POST(new Request("http://localhost/api/parse", { method: "POST", body, headers }));
}

describe("POST /api/parse", () => {
  it("returns 400 when no file is attached", async () => {
    const res = await post(new FormData());
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("bad_request");
  });

  it("returns 422 for unsupported types", async () => {
    const form = new FormData();
    form.set("file", new File(["x"], "cv.txt", { type: "text/plain" }));
    const res = await post(form);
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("unsupported_type");
  });

  it("returns 413 when content-length is over the limit", async () => {
    const res = await post(new FormData(), { "content-length": String(10 * 1024 * 1024) });
    expect(res.status).toBe(413);
    expect((await res.json()).code).toBe("too_large");
  });
});
