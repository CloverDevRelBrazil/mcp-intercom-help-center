#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
const WORKSPACE = process.env.INTERCOM_WORKSPACE_ID;

if (!TOKEN || !WORKSPACE) {
  console.error("Erro: Configure .env");
  process.exit(1);
}

const client = axios.create({
  baseURL: "https://api.intercom.io",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
});

const tools: Tool[] = [
  {
    name: "search_help_center",
    description: "Busca artigos",
    inputSchema: { type: "object" as const, properties: { query: { type: "string" } }, required: ["query"] },
  },
];

async function search(q: string) {
  try {
    const r = await client.get("/articles", { params: { query: q, lang: "pt", per_page: 10 } });
    return JSON.stringify({ success: true, results: r.data.articles || [] });
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

const server = new Server({ name: "mcp", version: "1.0.0" }, { capabilities: { tools: {} } } as any);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { params } = request;
  const { name, arguments: args } = params;
  
  let result = "";
  if (name === "search_help_center") {
    result = await search(args.query);
  }
  
  return { content: [{ type: "text" as const, text: result }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ MCP iniciado!");
}

main().catch(e => { console.error(e); process.exit(1); });
