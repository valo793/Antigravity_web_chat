@echo off
REM ============================================================================
REM Antigravity Chat - Script de Instalação de Dependências (Windows)
REM ============================================================================
REM Este script instala todas as dependências do projeto em uma única execução
REM ============================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║                  ANTIGRAVITY CHAT - INSTALADOR                        ║
echo ║                  Instalando Dependências...                           ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

REM Verificar se pnpm está instalado
echo [1/3] Verificando pnpm...
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  pnpm não encontrado. Instalando via npm...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar pnpm. Certifique-se de que Node.js está instalado.
        pause
        exit /b 1
    )
    echo ✓ pnpm instalado com sucesso
) else (
    echo ✓ pnpm encontrado
)

echo.
echo [2/3] Instalando dependências do projeto...
call pnpm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)
echo ✓ Dependências instaladas com sucesso

echo.
echo [3/3] Gerando migrations do banco de dados...
call pnpm drizzle-kit generate
if %errorlevel% neq 0 (
    echo ⚠️  Aviso: Erro ao gerar migrations (pode ser normal se já existem)
) else (
    echo ✓ Migrations geradas com sucesso
)

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║                    ✓ INSTALAÇÃO CONCLUÍDA!                            ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.
echo Próximos passos:
echo   1. Configure as variáveis de ambiente em .env.local
echo   2. Execute: pnpm dev
echo   3. Abra http://localhost:3000 no navegador
echo.
pause
