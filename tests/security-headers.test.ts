import { describe, it, expect } from "vitest";
import { getDevHeaders, getProductionHeaders } from "@/lib/security/headers";

describe("getDevHeaders", () => {
  const headers = getDevHeaders();

  it("includes X-Content-Type-Options: nosniff", () => {
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("includes Referrer-Policy", () => {
    expect(headers["Referrer-Policy"]).toBeTruthy();
  });

  it("includes Permissions-Policy without camera/microphone", () => {
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
  });
});

describe("getProductionHeaders", () => {
  const headers = getProductionHeaders();

  it("includes X-Content-Type-Options", () => {
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("includes Strict-Transport-Security", () => {
    expect(headers["Strict-Transport-Security"]).toContain("max-age=31536000");
  });

  it("includes X-Frame-Options: DENY", () => {
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("includes Permissions-Policy", () => {
    expect(headers["Permissions-Policy"]).toContain("interest-cohort=()");
  });
});
