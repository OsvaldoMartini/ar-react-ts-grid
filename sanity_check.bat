@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

echo.
echo ============================================================
echo  CSS Modules Migration - Sanity Checks
echo ============================================================
echo.

set "ANY_FAIL=0"

echo [1/3] Checking for leftover kebab-case selectors in .module.scss...
echo     (should be empty)
echo ------------------------------------------------------------
findstr /R /N /C:"\.[a-z][a-z]*-[a-z]" ^
    src\components\GridItemScann.module.scss ^
    src\components\Griditem.module.scss
if !errorlevel! equ 0 (
    echo     ^>^>^> FOUND kebab selectors above. Migration incomplete.
    set "ANY_FAIL=1"
) else (
    echo     OK - no kebab selectors remaining.
)
echo.

echo [2/3] Checking for === `backtick` bug from earlier script version...
echo     (should be empty)
echo ------------------------------------------------------------
findstr /N /C:"=== `" ^
    src\components\GridItemScann.tsx ^
    src\components\GridItem.tsx ^
    src\components\GridItemComp.tsx ^
    src\components\GridDrag2.tsx ^
    src\components\GridItemScannMobile.tsx
if !errorlevel! equ 0 (
    echo     ^>^>^> FOUND "=== `" above. These need manual fix.
    set "ANY_FAIL=1"
) else (
    echo     OK - no bogus backtick comparisons.
)
echo.

echo [3/3] Checking styles imports (exactly one per file expected)...
echo ------------------------------------------------------------
findstr /N /C:"import styles from" ^
    src\components\GridItemScann.tsx ^
    src\components\GridItem.tsx ^
    src\components\GridItemComp.tsx ^
    src\components\GridDrag2.tsx ^
    src\components\GridItemScannMobile.tsx
echo.

echo ============================================================
if "!ANY_FAIL!"=="1" (
    echo  RESULT: Issues found - review output above.
) else (
    echo  RESULT: All sanity checks passed.
)
echo ============================================================
echo.
pause
endlocal