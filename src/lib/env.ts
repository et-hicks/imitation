export const BACKEND_URL = "https://go-example-bitter-cherry-6166.fly.dev"

if (!BACKEND_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "BACKEND_URL is not set. Define BACKEND_URL (server) and NEXT_PUBLIC_BACKEND_URL (client) in your env."
  );
}


