FROM node:22-slim

WORKDIR /app

COPY package.json .
RUN npm install

# Install Claude Code CLI (required by claude-code-sdk)
RUN npm install -g @anthropic-ai/claude-code

COPY server.js .

EXPOSE 3001

CMD ["node", "server.js"]
