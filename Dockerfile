FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATA_DIR=/app/data
WORKDIR /app
COPY --chown=node:node package.json server.mjs operations.mjs domain.mjs xlsx.mjs backup.mjs verify-build.mjs ./
COPY --chown=node:node bundle-public.mjs public-bundle.json ./
RUN node verify-build.mjs
RUN mkdir -p /app/data/files /app/backups && chown -R node:node /app/data /app/backups
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","server.mjs"]
