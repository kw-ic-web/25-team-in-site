import { describe, it, expect } from "@jest/globals";
import { appRequest } from "../utils/test-helpers.js";

describe("Health API", () => {
  it("GET /health", async () => {
    const res = await appRequest().get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
