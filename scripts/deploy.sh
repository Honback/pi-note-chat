#!/bin/bash
set -euo pipefail

# Configuration
PI_USER="${PI_USER:-pi}"
PI_HOST="${PI_HOST:-raspberrypi.local}"
PI_DIR="${PI_DIR:-/home/pi/pi-note-chat}"
PLATFORM="linux/arm/v7"

echo "=== Pi-Note Chat Deploy ==="
echo "Target: ${PI_USER}@${PI_HOST}:${PI_DIR}"
echo ""

# Step 1: Build ARM32 images on Mac using buildx
echo "[1/4] Building ARM32 images..."
docker buildx build --platform ${PLATFORM} \
    -t pi-note-chat/backend:latest \
    --load \
    ./backend

docker buildx build --platform ${PLATFORM} \
    -t pi-note-chat/frontend:latest \
    --load \
    ./frontend

# Step 2: Save images as tar files
echo "[2/4] Saving images to tar..."
mkdir -p .deploy
docker save pi-note-chat/backend:latest | gzip > .deploy/backend.tar.gz
docker save pi-note-chat/frontend:latest | gzip > .deploy/frontend.tar.gz

# Step 3: Transfer to Pi
echo "[3/4] Transferring to Pi..."
ssh ${PI_USER}@${PI_HOST} "mkdir -p ${PI_DIR}"
scp .deploy/backend.tar.gz .deploy/frontend.tar.gz ${PI_USER}@${PI_HOST}:${PI_DIR}/
scp docker-compose.yml .env.example ${PI_USER}@${PI_HOST}:${PI_DIR}/

# Step 4: Load images and start on Pi
echo "[4/4] Loading images and starting services on Pi..."
ssh ${PI_USER}@${PI_HOST} << 'EOF'
cd ~/pi-note-chat
docker load < backend.tar.gz
docker load < frontend.tar.gz
rm -f backend.tar.gz frontend.tar.gz

# Create .env from example if not exists
[ ! -f .env ] && cp .env.example .env

docker compose down || true
docker compose up -d

echo ""
echo "=== Services started ==="
docker compose ps
echo ""
echo "Access at: http://$(hostname -I | awk '{print $1}')"
EOF

# Cleanup local deploy artifacts
rm -rf .deploy

echo ""
echo "=== Deploy complete ==="
