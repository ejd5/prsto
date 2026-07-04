/**
 * Security headers for PRSTO.
 * Applied via middleware or next.config for production.
 * Dev mode is more permissive (no HSTS, relaxed CSP).
 */

import type { NextResponse } from "next/server";

export interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Production security headers.
 * CSP starts relaxed — tighten after confirming extension/API compatibility.
 */
export function getProductionHeaders(): SecurityHeaders {
  return {
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",
    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Frame options
    "X-Frame-Options": "DENY",
    // Minimal permissions policy — disable unused features
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    // HSTS (1 year, include subdomains, preload)
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };
}

/**
 * Dev security headers — permissive for local development.
 */
export function getDevHeaders(): SecurityHeaders {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  };
}
