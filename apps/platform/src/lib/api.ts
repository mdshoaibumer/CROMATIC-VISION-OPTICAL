import { Product, Category, Order, Prescription, Invoice, User } from "../types";

export function removeTokens() {
  // handled via HttpOnly cookie expiration natively by backend via /auth/logout
}

// Read CSRF token from cookie for double-submit protection
function getCSRFToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Global API Fetch proxy
export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Include CSRF token for state-changing requests
  if (method !== "GET") {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  const rawRes = await fetch(`/api/v1${path}`, {
    method,
    headers,
    credentials: "include", // Required for HttpOnly Cookies
    body: body ? JSON.stringify(body) : undefined,
  });

  if (rawRes.ok) {
    // Handle 204 No Content responses
    if (rawRes.status === 204) {
      return null as T;
    }
    const res = await rawRes.json();
    return res.data as T;
  } else {
    let errorMessage = `Request failed (${rawRes.status})`;
    try {
      const errorJson = await rawRes.json();
      errorMessage = errorJson?.error?.message || errorMessage;
    } catch (_) {
      // If JSON parsing fails, use the generic message
    }
    throw new Error(errorMessage);
  }
}

export function logoutCustomer() {
  localStorage.removeItem("cromatic_active_customer");
}
