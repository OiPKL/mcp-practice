### MCP Server 빌드

```
# 1. 의존성 설치
npm install

# 2. TypeScript 컴파일 및 실행 권한 설정
npx tsc && node -e "require('fs').chmodSync('build/index.js', '755')"
```

### claude_desktop_config.json 수정

```
# 3. index.js 파일 절대위치 입력
{
    "mcpServers": {
        "{ server-name }": {
            "command": "node",
            "args": [
                "/ABSOLUTE/PATH/TO/PARENT/FOLDER/build/index.js"
            ]
        }
    }
}
```
