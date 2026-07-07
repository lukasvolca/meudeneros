@echo off
echo Buildando MeuDeneros...
cd /d "%~dp0"
pnpm exec vite build --config vite.config.ghpages.ts
if errorlevel 1 ( echo ERRO no build! & pause & exit /b 1 )

echo Limpando assets antigos (evita acumulo que quebra o deploy)...
set REPO=C:\Users\lukas\meudenerosapp\assets
if exist "%REPO%" rmdir /s /q "%REPO%"
mkdir "%REPO%"

echo Copiando para o repositorio...
xcopy /y dist\assets\*.js "%REPO%\" >nul
xcopy /y dist\assets\*.css "%REPO%\" >nul

echo Atualizando entry points no index.html...
for %%f in (dist\assets\index-*.js) do set ENTRY_JS=%%~nxf
for %%f in (dist\assets\index-*.css) do set ENTRY_CSS=%%~nxf
powershell -Command "$html = Get-Content 'C:\Users\lukas\meudenerosapp\index.html' -Raw; $html = $html -replace 'assets/index-[A-Za-z0-9_-]+\.js', 'assets/%ENTRY_JS%'; $html = $html -replace 'assets/index-[A-Za-z0-9_-]+\.css', 'assets/%ENTRY_CSS%'; Set-Content 'C:\Users\lukas\meudenerosapp\index.html' $html -Encoding utf8"

echo Fazendo push para o GitHub...
cd /d "C:\Users\lukas\meudenerosapp"
git add -A
git commit -m "deploy: build atualizado"
git push origin main

echo.
echo Pronto! Site atualizado em ~2 minutos em:
echo https://lukasvolca.github.io/meudenerosapp/
pause
