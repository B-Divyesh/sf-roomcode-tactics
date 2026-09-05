#!/bin/bash
set -euo pipefail
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh roomcode-tactics-realtime "$PWD" service/Dockerfile 8080
