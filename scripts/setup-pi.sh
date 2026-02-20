#!/bin/bash
set -euo pipefail

echo "=== Pi-Note Chat: Raspberry Pi 3 Setup ==="

# Step 1: Update system
echo "[1/5] Updating system..."
sudo apt-get update && sudo apt-get upgrade -y

# Step 2: Install Docker
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. Log out and back in for group changes."
fi

# Step 3: Install Docker Compose plugin
echo "[3/5] Installing Docker Compose..."
sudo apt-get install -y docker-compose-plugin || {
    # Fallback: install compose v2 manually
    DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
    mkdir -p $DOCKER_CONFIG/cli-plugins
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-armv7" -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
}

# Step 4: Setup swap (1GB)
echo "[4/5] Setting up 1GB swap..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap enabled: 1GB"
else
    echo "Swap already exists"
fi

# Step 5: Create project directory
echo "[5/5] Creating project directory..."
mkdir -p ~/pi-note-chat

echo ""
echo "=== Setup complete ==="
echo "Memory status:"
free -h
echo ""
echo "Next: Run deploy.sh from your Mac to build and transfer images."
