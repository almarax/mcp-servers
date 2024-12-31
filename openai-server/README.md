# azure-openai-server MCP Server

A Model Context Protocol server for Azure OpenAI API

## Features

### Tools
- `chat_completion` - Generate text using Azure OpenAI's chat completion API
  - Takes prompt and optional model name as parameters
  - Returns generated text response

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "azure-openai-server": {
      "command": "node",
      "args": ["/path/to/azure-openai-server/build/index.js"],
      "env": {
        "AZURE_OPENAI_API_KEY": "your-api-key",
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com",
        "AZURE_OPENAI_DEPLOYMENT_NAME": "your-deployment-name"
      }
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
