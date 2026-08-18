@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM  move_to_legacy.bat
REM  Moves unused / deprecated files to _legacy folder
REM  SAFE: Does NOT touch files used by Java backend, routing, or active code
REM  Run from the project root (where package.json is)
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ============================================================
echo  abr-react-ts-grid — Legacy File Migration Script
echo  Date: %DATE% %TIME%
echo ============================================================
echo.
echo This script will MOVE unused files to _legacy\
echo No files will be deleted. You can restore them by moving back.
echo.

set /p CONFIRM="Continue? (Y/N): "
if /I not "%CONFIRM%"=="Y" (
    echo Cancelled.
    exit /b 0
)

echo.
echo [1/8] Creating _legacy directory structure...

if not exist "_legacy" mkdir "_legacy"
if not exist "_legacy\root-experiments" mkdir "_legacy\root-experiments"
if not exist "_legacy\root-experiments\socket-clients" mkdir "_legacy\root-experiments\socket-clients"
if not exist "_legacy\root-experiments\servers" mkdir "_legacy\root-experiments\servers"
if not exist "_legacy\root-experiments\html-tests" mkdir "_legacy\root-experiments\html-tests"
if not exist "_legacy\root-experiments\react-dev-bundles" mkdir "_legacy\root-experiments\react-dev-bundles"
if not exist "_legacy\src-dead-components" mkdir "_legacy\src-dead-components"
if not exist "_legacy\src-dead-pages" mkdir "_legacy\src-dead-pages"
if not exist "_legacy\src-dead-css" mkdir "_legacy\src-dead-css"
if not exist "_legacy\src-dead-assets" mkdir "_legacy\src-dead-assets"
if not exist "_legacy\src-legacy-app" mkdir "_legacy\src-legacy-app"
if not exist "_legacy\old-scss" mkdir "_legacy\old-scss"

echo    Done.

echo.
echo [2/8] Moving root-level experiment files...

REM --- Socket client experiments ---
if exist "socket_client_2.js"       move "socket_client_2.js"       "_legacy\root-experiments\socket-clients\" >nul 2>&1
if exist "socket_client_ws.js"      move "socket_client_ws.js"      "_legacy\root-experiments\socket-clients\" >nul 2>&1
if exist "socket_client_ws.py"      move "socket_client_ws.py"      "_legacy\root-experiments\socket-clients\" >nul 2>&1
if exist "socket_client_wss.js"     move "socket_client_wss.js"     "_legacy\root-experiments\socket-clients\" >nul 2>&1
if exist "socket_client_wss.py"     move "socket_client_wss.py"     "_legacy\root-experiments\socket-clients\" >nul 2>&1
if exist "socket_http_client_2.js"  move "socket_http_client_2.js"  "_legacy\root-experiments\socket-clients\" >nul 2>&1
if exist "client.js"                move "client.js"                "_legacy\root-experiments\socket-clients\" >nul 2>&1
if exist "client.py"                move "client.py"                "_legacy\root-experiments\socket-clients\" >nul 2>&1

REM --- Server experiments ---
if exist "server.js"                move "server.js"                "_legacy\root-experiments\servers\" >nul 2>&1
if exist "server.py"                move "server.py"                "_legacy\root-experiments\servers\" >nul 2>&1
if exist "proxyServer.js"           move "proxyServer.js"           "_legacy\root-experiments\servers\" >nul 2>&1
if exist "https_server_2.js"        move "https_server_2.js"        "_legacy\root-experiments\servers\" >nul 2>&1
if exist "https_server_csp.3.js"    move "https_server_csp.3.js"    "_legacy\root-experiments\servers\" >nul 2>&1
if exist "socket_server.js"         move "socket_server.js"         "_legacy\root-experiments\servers\" >nul 2>&1

REM --- HTML test pages ---
if exist "WSS-Socket-Test.html"     move "WSS-Socket-Test.html"     "_legacy\root-experiments\html-tests\" >nul 2>&1
if exist "WSS-Socket-Test-2.html"   move "WSS-Socket-Test-2.html"   "_legacy\root-experiments\html-tests\" >nul 2>&1

REM --- Standalone React dev bundles (CRA bundles its own) ---
if exist "react.development.js"     move "react.development.js"     "_legacy\root-experiments\react-dev-bundles\" >nul 2>&1
if exist "react-dom.development.js" move "react-dom.development.js" "_legacy\root-experiments\react-dev-bundles\" >nul 2>&1

REM --- Misc root experiments ---
if exist "OpenAI.js"                move "OpenAI.js"                "_legacy\root-experiments\" >nul 2>&1
if exist "babel.min.js"             move "babel.min.js"             "_legacy\root-experiments\" >nul 2>&1
if exist "socket_test.py"           move "socket_test.py"           "_legacy\root-experiments\" >nul 2>&1
if exist "README-MINIFIED.md"       move "README-MINIFIED.md"       "_legacy\root-experiments\" >nul 2>&1
if exist "README CAPI.md"           move "README CAPI.md"           "_legacy\root-experiments\" >nul 2>&1

echo    Moved root experiments.

echo.
echo [3/8] Moving dead source components (0 external refs)...

REM --- Components with ZERO imports from any other file ---
if exist "src\components\BlockInstructionsDnd.tsx"      move "src\components\BlockInstructionsDnd.tsx"      "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\BlockList.tsx"                  move "src\components\BlockList.tsx"                  "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\BrowserConsole.tsx"             move "src\components\BrowserConsole.tsx"             "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\ErrorTest.tsx"                  move "src\components\ErrorTest.tsx"                  "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\GridDrag2.tsx"                  move "src\components\GridDrag2.tsx"                  "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\MyComponent.tsx"                move "src\components\MyComponent.tsx"                "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\NavigableBKP.tsx"               move "src\components\NavigableBKP.tsx"               "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\StompMessage.tsx"               move "src\components\StompMessage.tsx"               "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\StompSocketComponent.tsx"       move "src\components\StompSocketComponent.tsx"       "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\ToggleActive.tsx"               move "src\components\ToggleActive.tsx"               "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\instructionsMockData4.tsx"      move "src\components\instructionsMockData4.tsx"      "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\instructionsMockData5.tsx"      move "src\components\instructionsMockData5.tsx"      "_legacy\src-dead-components\" >nul 2>&1
if exist "src\components\WebSocketComponentClient2.jsx"  move "src\components\WebSocketComponentClient2.jsx"  "_legacy\src-dead-components\" >nul 2>&1

echo    Moved dead components.

echo.
echo [4/8] Moving dead pages (not reachable from index.tsx)...

REM NOTE: The entire src\pages\ directory is unreachable from the app
REM entry point. However, we move only confirmed-dead individual files
REM to be conservative. Home/Card/ClothingType/FilterComponent/FilterButton
REM form an internal chain but are also unreachable.
if exist "src\pages\InputPage.tsx"  move "src\pages\InputPage.tsx"  "_legacy\src-dead-pages\" >nul 2>&1
if exist "src\pages\Menu.tsx"       move "src\pages\Menu.tsx"       "_legacy\src-dead-pages\" >nul 2>&1
if exist "src\pages\PageOne.tsx"    move "src\pages\PageOne.tsx"    "_legacy\src-dead-pages\" >nul 2>&1
if exist "src\pages\pageone.scss"   move "src\pages\pageone.scss"   "_legacy\src-dead-pages\" >nul 2>&1

echo    Moved dead pages.

echo.
echo [5/8] Moving dead CSS/SCSS files...

if exist "src\components\card.scss"             move "src\components\card.scss"             "_legacy\src-dead-css\" >nul 2>&1
if exist "src\components\mycomponent.scss"       move "src\components\mycomponent.scss"       "_legacy\src-dead-css\" >nul 2>&1
if exist "src\App.css"                           move "src\App.css"                           "_legacy\src-dead-css\" >nul 2>&1

echo    Moved dead CSS.

echo.
echo [6/8] Moving dead asset CSS files...

if exist "src\assets\button.css"     move "src\assets\button.css"     "_legacy\src-dead-assets\" >nul 2>&1
if exist "src\assets\stiles.css"     move "src\assets\stiles.css"     "_legacy\src-dead-assets\" >nul 2>&1
if exist "src\assets\tableView.css"  move "src\assets\tableView.css"  "_legacy\src-dead-assets\" >nul 2>&1
if exist "src\assets\listView.css"   move "src\assets\listView.css"   "_legacy\src-dead-assets\" >nul 2>&1

echo    Moved dead asset CSS.

echo.
echo [7/8] Moving legacy root app files (superseded by MultiTest)...

if exist "src\App.tsx"       move "src\App.tsx"       "_legacy\src-legacy-app\" >nul 2>&1
if exist "src\App.test.tsx"  move "src\App.test.tsx"  "_legacy\src-legacy-app\" >nul 2>&1
if exist "src\logo.svg"      move "src\logo.svg"      "_legacy\src-legacy-app\" >nul 2>&1

echo    Moved legacy app files.

echo.
echo [8/8] Moving old SCSS file (after rename)...

if exist "src\components\MultiTest\mt-readytest.scss" (
    move "src\components\MultiTest\mt-readytest.scss" "_legacy\old-scss\" >nul 2>&1
    echo    Moved old mt-readytest.scss
) else (
    echo    mt-readytest.scss already removed or renamed — skipping.
)

echo.
echo ============================================================
echo  Migration complete!
echo ============================================================
echo.
echo  Files moved to _legacy\ — NOT deleted.
echo  To undo: move files back from _legacy\ subfolders.
echo.
echo  NEXT STEPS:
echo    1. Run: npm start
echo    2. Verify all views load correctly
echo    3. Run: npm run build
echo    4. If build fails, check _legacy\ for accidentally moved files
echo.
echo  FILES NOT MOVED (require manual review):
echo    - src\pages\ (Home, Card, ClothingType chain) — verify with backend team
echo    - scripts\ folder — verify with bot automation team
echo    - XPC10 Tests\ — move to tests_run\ manually if desired
echo    - root index.html — verify if webpack needs it
echo.

pause
