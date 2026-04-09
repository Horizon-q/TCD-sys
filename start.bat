echo 1. 安装前端依赖...
cd /d %~dp0
call npm install
if %errorlevel% neq 0 (
    echo 前端依赖安装失败！
    pause
    exit /b 1
)

echo 2. 安装后端依赖...
cd /d %~dp0server
call npm install
if %errorlevel% neq 0 (
    echo 后端依赖安装失败！
    pause
    exit /b 1
)

echo 4. 启动前后端服务...
cd /d %~dp0
start "前端服务" cmd /k "npm start"
timeout /t 3 /nobreak >nul

cd /d %~dp0server
start "后端服务" cmd /k "npm start" 