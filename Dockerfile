FROM node:lts-alpine AS base

ENV NEXT_PUBLIC_SUPABASE_URL=https://kaodsutlbtjiffsvmckx.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb2RzdXRsYnRqaWZmc3ZtY2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjExNzQsImV4cCI6MjA3MDMzNzE3NH0.v0hDI8nT54mEUbdqzhlVfdgIeJXcjWq-SAyPuP87jNc


# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
# Install packages needed to build node modules
# RUN apt-get update -qq && \
#     apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
RUN if [ -d "/app/public" ]; then cp -r /app/public ./public; fi # Copy public folder if it exists

EXPOSE 3000
CMD ["node", "server.js"]