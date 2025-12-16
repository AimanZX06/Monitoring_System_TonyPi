@echo off
echo Stopping frontend container...
docker-compose stop frontend

echo Building frontend without cache...
docker-compose build frontend --no-cache

echo Starting frontend container...
docker-compose up -d frontend

echo Waiting for container to start...
timeout /t 10

echo Checking container status...
docker-compose logs frontend --tail=20

echo Done! Frontend should be available at http://localhost:3001