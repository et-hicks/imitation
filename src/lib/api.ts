import { BACKEND_URL } from "./env";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {

  console.log("BACKEND_URL", BACKEND_URL);
  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    // you can add credentials, etc., here if needed
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`);
  }
  // Attempt JSON parse; fall back to text
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}


