export const BACKEND_URL = "https://go-example-bitter-cherry-6166.fly.dev"
export const NEXT_PUBLIC_SUPABASE_URL="https://kaodsutlbtjiffsvmckx.supabase.co"
export const NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb2RzdXRsYnRqaWZmc3ZtY2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjExNzQsImV4cCI6MjA3MDMzNzE3NH0.v0hDI8nT54mEUbdqzhlVfdgIeJXcjWq-SAyPuP87jNc"

if (!BACKEND_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "BACKEND_URL is not set. Define BACKEND_URL (server) and NEXT_PUBLIC_BACKEND_URL (client) in your env."
  );
}


