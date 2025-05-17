@echo off

REM === CONFIG ===
set PROJECT_DIR=C:\Path\To\Your\Project

REM === Start MongoDB ===
start cmd.exe /k "cd /d C:\Program Files\MongoDB\Server\8.0\bin && mongod"

TIMEOUT /T 2

REM === Open mongosh ===
start cmd.exe /k "mongosh"

REM === Backend ===
start cmd.exe /k "cd /d %PROJECT_DIR%\server && call npm install && nodemon server.js"

REM === Frontend ===
start cmd.exe /k "cd /d %PROJECT_DIR%\client && call npm install && npm start"

REM === Open Browser ===
start chrome http://localhost:3000