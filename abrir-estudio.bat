@echo off
rem Abre el estudio en Chrome (o en el navegador predeterminado si Chrome no esta)
start "" chrome "%~dp0index.html" 2>nul || start "" "%~dp0index.html"
