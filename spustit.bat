@echo off
echo Spoustim server na http://localhost:8000 ...
start microsoft-edge:http://localhost:8000
python3 -m http.server 8000
pause
