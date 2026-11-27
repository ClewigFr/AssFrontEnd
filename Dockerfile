# The built site is plain files, so it's built on the build machine's platform
# and served by nginx (a few MB of RAM) on the target one (arm64 for the Raspberry Pi).
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
# The API address is fixed at build time (required)
ARG BACKEND_URL
# Optional public address of the dashboard: canonical links, link previews, sitemap.xml
ARG SITE_URL
RUN test -n "$BACKEND_URL" || (echo 'Set --build-arg BACKEND_URL=https://api.example.com' && exit 1)
RUN BACKEND_URL=$BACKEND_URL SITE_URL=$SITE_URL npm run build

# Unprivileged image: nginx runs as user 101, not root. It still listens on 80
# (Docker lets non-root processes bind low ports inside the container), so the
# Compose port mapping and the Cloudflare tunnel's dashboard:80 stay unchanged.
FROM nginxinc/nginx-unprivileged:1.29-alpine
ARG BACKEND_URL
USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
# The CSP only lets the page call the API it was built for
RUN sed -i "s|__BACKEND_URL__|${BACKEND_URL%/}|" /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
USER 101
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
