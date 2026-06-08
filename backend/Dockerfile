# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

ARG PNPM_VERSION=11.1.3

# Install pnpm
RUN npm install -g pnpm@${PNPM_VERSION}

# Copy package files first for layer caching
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./


# Install all dependencies (including dev for build)
RUN if [ -f pnpm-lock.yaml ]; then \
    pnpm install --frozen-lockfile; \
    else \
    pnpm install; \
    fi

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build
RUN pnpm build

# ─────────────────────────────────────────────────────────

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ARG PNPM_VERSION=11.1.3

# Create non-root user
RUN addgroup --system --gid 1001 prism \
 && adduser  --system --uid 1001 --ingroup prism prism

# Install pnpm for production install
RUN npm install -g pnpm@${PNPM_VERSION}

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./


# Production dependencies only
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --prod; else pnpm install --prod; fi

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Switch to non-root user
USER prism

# Cloud Run listens on PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]
