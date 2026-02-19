FROM node:lts-alpine AS base

ENV NEXT_PUBLIC_SUPABASE_URL=https://dbmxbfeuxflznukpuvnf.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_MFTgfJ7nuchS4tQmegpmRA_TRslOmk8


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
RUN npm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]