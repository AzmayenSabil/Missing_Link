@echo off
echo ============================================
echo   Starting All Pipes (v2)
echo ============================================
echo.
echo Ports:
echo   Pipe-1: Server 3001, Client 5171
echo   Pipe-2: Server 3002, Client 5172
echo   Pipe-3: Server 3003, Client 5173
echo.

:: Start pipe-1-v2 server
echo Starting pipe-1-v2 server...
start "pipe-1-server" cmd /c "cd pipe-1-v2\server && npm run dev"

:: Start pipe-2-v2 server
echo Starting pipe-2-v2 server...
start "pipe-2-server" cmd /c "cd pipe-2-v2\server && npm run dev"

:: Start pipe-3-v2 server
echo Starting pipe-3-v2 server...
start "pipe-3-server" cmd /c "cd pipe-3-v2\server && npm run dev"

:: Wait for servers to start
echo Waiting for servers to start...
timeout /t 3 /nobreak > nul

:: Start pipe-1-v2 client
echo Starting pipe-1-v2 client...
start "pipe-1-client" cmd /c "cd pipe-1-v2\client && npm run dev"

:: Start pipe-2-v2 client
echo Starting pipe-2-v2 client...
start "pipe-2-client" cmd /c "cd pipe-2-v2\client && npm run dev"

:: Start pipe-3-v2 client
echo Starting pipe-3-v2 client...
start "pipe-3-client" cmd /c "cd pipe-3-v2\client && npm run dev"

:: Wait for clients to start
echo Waiting for clients to start...
timeout /t 5 /nobreak > nul

:: Open Chrome windows
echo Opening Chrome windows...
start chrome --new-window "http://localhost:5171"
timeout /t 1 /nobreak > nul
start chrome --new-window "http://localhost:5172"
timeout /t 1 /nobreak > nul
start chrome --new-window "http://localhost:5173"

echo.
echo ============================================
echo   All pipes started!
echo ============================================
echo.
echo Close this window to see running terminals.
pause
