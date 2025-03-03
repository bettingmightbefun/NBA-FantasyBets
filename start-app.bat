@echo off
echo Starting NBA Fantasy Bets Application...

echo Starting Server...
start cmd /k "cd server && npm run dev"

echo Starting Client...
start cmd /k "cd client && npm run dev"

echo Both applications should be starting now.
echo Server: http://localhost:5001
echo Client: http://localhost:3000 