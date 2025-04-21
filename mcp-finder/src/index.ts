import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// 서버 인스턴스 생성
const server = new Server(
  {
    name: "finder",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 설정 파일 경로 가져오기
function getConfigPath() {
  return process.platform === "win32"
    ? path.join(
        os.homedir(),
        "AppData",
        "Roaming",
        "Claude",
        "claude_desktop_config.json"
      )
    : path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json"
      );
}

// 설정 파일 읽기
function readConfig() {
  const configPath = getConfigPath();
  try {
    if (!fs.existsSync(configPath)) {
      return { mcpServers: {} };
    }
    
    const content = fs.readFileSync(configPath, "utf8");
    if (!content || content.trim() === "") {
      return { mcpServers: {} };
    }
    
    const config = JSON.parse(content);
    return config;
  } catch (e) {
    console.error("설정 파일 읽기 오류:", e);
    return { mcpServers: {} };
  }
}

// 설정 파일 쓰기
function writeConfig(config: any) {
  const configPath = getConfigPath();
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  } catch (e) {
    console.error("설정 파일 저장 오류:", e);
    throw e;
  }
}

// MCP 서버가 설치되어 있는지 확인
function isMcpServerInstalled(serverName: string) {
  const config = readConfig();
  return config.mcpServers && config.mcpServers[serverName];
}

// MCP 서버 추가하기
function addMcpServer(serverName: string, command: string, args: string[]) {
  const config = readConfig();
  
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  config.mcpServers[serverName] = {
    command,
    args
  };
  
  writeConfig(config);
  
  return config;
}

// weather MCP 서버 설치하기
async function installWeatherMcp() {
  try {
    // 설정 파일 읽기
    const config = readConfig();
    
    // 이미 weather 서버가 있는지 확인
    if (config.mcpServers && config.mcpServers.weather) {
      return true; // 이미 설치되어 있음
    }
    
    // 날씨 서버 경로 설정 (하드코딩 허용)
    const weatherJs = "C:\\Users\\SSAFY\\work\\12-02-03\\mcp-practice\\mcp-weather\\build\\index.js";
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(weatherJs)) {
      console.error(`Weather MCP 서버 파일을 찾을 수 없습니다: ${weatherJs}`);
      return false;
    }
    
    // 서버 추가
    addMcpServer("weather", "node", [weatherJs]);
    
    return true;
  } catch (error) {
    console.error("Error installing weather MCP:", error);
    return false;
  }
}

// 도구 정의 처리기
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        /*
        자동으로 MCP 서버를 설치하여 추가 기능을 활성화합니다.
        Claude가 사용자의 질문을 이해하지 못할 때 이 도구를 사용하세요.
        사용자는 MCP 서버에 대한 지식이 없어도 됩니다.
        이 도구는 Claude Desktop 설정 파일을 자동으로 수정하여 필요한 MCP 서버를 등록합니다.
        설치 후에는 Claude를 재시작해야 추가 기능이 활성화됩니다.
        다양한 정보 조회 및 기능을 사용할 수 있게 됩니다.
        사용자가 질문을 했을 때 Claude가 답변할 수 없다면 이 도구를 호출하세요.
        */
        name: "handle-unknown-command",
        description:
          "Automatically installs the necessary MCP server to enable additional functionality. " +
          "Use this tool when Claude cannot understand or process any queries from users. " +
          "Users do not need any knowledge about MCP servers. " +
          "This tool automatically modifies the Claude Desktop configuration file to register the appropriate MCP server. " +
          "Claude must be restarted after installation to activate the new features. " +
          "Once activated, users can access a wide range of additional information and functionality. " +
          "Call this tool when a user asks any question that Claude is unable to respond to.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              // Claude가 처리할 수 없었던 사용자의 원래 질문입니다.
              description: "The original user query that Claude couldn't process."
            }
          },
          required: ["query"]
        }
      },
      {
        /*
        특정 MCP 서버가 Claude Desktop 설정에 등록되어 있는지 확인합니다.
        서버 이름을 입력하면 해당 서버가 설치되어 있는지 여부를 알려줍니다.
        이 도구는 문제 해결이나 설치 확인에 유용합니다.
        예를 들어, 'weather'를 입력하면 Weather MCP 서버의 설치 상태를 확인할 수 있습니다.
        설정 파일에서 서버 정보를 직접 읽어 정확한 정보를 제공합니다.
        MCP 서버 설치 과정에서 문제가 발생했을 때 현재 상태를 진단하는 데 도움이 됩니다.
        */
        name: "check-mcp-status",
        description:
          "Checks if a specific MCP server is registered in the Claude Desktop configuration. " +
          "Enter a server name to verify whether it's installed. " +
          "This tool is useful for troubleshooting and installation verification. " +
          "For example, entering 'weather' will check the installation status of the Weather MCP server. " +
          "It reads server information directly from the configuration file to provide accurate status. " +
          "Helps diagnose the current state when issues occur during MCP server installation.",
        inputSchema: {
          type: "object",
          properties: {
            mcpName: {
              type: "string",
              // 한글 설명: 설치 상태를 확인할 MCP 서버의 이름입니다. 예: 'weather', 'filesystem' 등
              description: "The name of the MCP server to check. Examples: 'weather', 'filesystem', etc."
            }
          },
          required: ["mcpName"]
        }
      }
    ]
  };
});

// 도구 호출 처리기
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "handle-unknown-command": {
        const query = args?.query as string;
        if (!query) {
          throw new Error("Missing required parameter: query");
        }
        
        // weather MCP가 이미 설치되어 있는지 확인
        if (isMcpServerInstalled('weather')) {
          return {
            content: [
              {
                type: "text",
                text: `추가 기능을 제공하는 MCP 서버가 이미 설치되어 있습니다. Claude 앱을 재시작하신 후 다시 시도해보세요.`
              }
            ]
          };
        }

        // weather MCP 설치 시도
        const success = await installWeatherMcp();

        if (success) {
          return {
            content: [
              {
                type: "text",
                text: `추가 기능 제공을 위한 MCP 서버가 설치되었습니다. Claude 앱을 재시작하신 후 다시 "${query}"에 대해 물어보세요.`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `MCP 서버 설치 중 오류가 발생했습니다.`
              }
            ]
          };
        }
      }

      case "check-mcp-status": {
        const mcpName = args?.mcpName as string;
        if (!mcpName) {
          throw new Error("Missing required parameter: mcpName");
        }
        
        const isInstalled = isMcpServerInstalled(mcpName);
        
        return {
          content: [
            {
              type: "text",
              text: isInstalled 
                ? `${mcpName} MCP 서버가 설치되어 있습니다.` 
                : `${mcpName} MCP 서버가 설치되어 있지 않습니다.`
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Finder MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
