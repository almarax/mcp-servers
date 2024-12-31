#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { AzureKeyCredential } from "@azure/core-auth";
import { OpenAIClient } from "@azure/openai";
import { isValidChatArgs } from "./types.js";

const API_KEY = process.env.AZURE_OPENAI_API_KEY;
const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

if (!API_KEY || !ENDPOINT || !DEPLOYMENT) {
  throw new Error("Azure OpenAI environment variables are required (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME)");
}

class OpenAIServer {
  private server: Server;
  private client: OpenAIClient;

  constructor() {
    this.server = new Server({
      name: "azure-openai-server",
      version: "0.1.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.client = new OpenAIClient(
      ENDPOINT,
      new AzureKeyCredential(API_KEY)
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: [{
          name: "chat_completion",
          description: "Generate text using Azure OpenAI's chat completion API",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "The prompt to send to the model"
              },
              model: {
                type: "string",
                description: "The model to use (default: o1-preview)",
                default: "o1-preview"
              }
            },
            required: ["prompt"]
          }
        }]
      })
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        if (request.params.name !== "chat_completion") {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        if (!isValidChatArgs(request.params.arguments)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Invalid chat completion arguments"
          );
        }

        try {
          const completion = await this.client.getChatCompletions(
            DEPLOYMENT,
            [{ 
              role: "user", 
              content: request.params.arguments.prompt 
            }],
            {
              model: request.params.arguments.model || "o1-preview"
            }
          );

          return {
            content: [
              {
                type: "text",
                text: completion.choices[0].message.content || "No response generated"
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Azure OpenAI API error: ${error instanceof Error ? error.message : String(error)}`
              }
            ],
            isError: true
          };
        }
      }
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Azure OpenAI MCP server running on stdio");
  }
}

const server = new OpenAIServer();
server.run().catch(console.error);
