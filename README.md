## mcp-weather

```
# 1. 의존성 설치
npm install

# 2. TypeScript 컴파일 및 실행 권한 설정
npx tsc && node -e "require('fs').chmodSync('build/index.js', '755')"
```

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "{ server-name }": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/PARENT/FOLDER/build/index.js"]
    }
  }
}
```

## mcp-installer

Add to your `claude_desktop_config.json`:

```json
  "mcpServers": {
    "mcp-installer": {
      "command": "npx",
      "args": [
        "@anaisbetts/mcp-installer"
      ]
    }
  }
```

## mcp-filesystem

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Desktop",
        "/path/to/other/allowed/dir"
      ]
    }
  }
}
```

## mcp-everything

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"]
    }
  }
}
```
