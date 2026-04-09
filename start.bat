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

echo 3. 初始化数据库...
echo 3.1 重置数据库...
call npm run reset-db
if %errorlevel% neq 0 (
    echo 数据库重置失败！
    pause
    exit /b 1
)

echo 3.2 导入Excel数据...
call npm run import-excel
if %errorlevel% neq 0 (
    echo Excel数据导入失败！
    pause
    exit /b 1
)

echo 4. 启动前后端服务...
cd /d %~dp0
start "前端服务" cmd /k "npm start"
timeout /t 3 /nobreak >nul

cd /d %~dp0server
start "后端服务" cmd /k "npm start" 