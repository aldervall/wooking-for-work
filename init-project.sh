#!/bin/bash
# OpenCode Project Initializer
# Usage: init-project.sh <project-name>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi

PROJECT_NAME="$1"
TEMPLATE_DIR="/opt/opencode-template"
TARGET_DIR="/opt/$PROJECT_NAME"

if [ -d "$TARGET_DIR" ]; then
  echo "Error: $TARGET_DIR already exists"
  exit 1
fi

echo "Initializing OpenCode project: $PROJECT_NAME"

# Copy template
cp -r "$TEMPLATE_DIR" "$TARGET_DIR"
cd "$TARGET_DIR"

# Initialize git
git init
git add .
git commit -m "Initial commit from OpenCode template" || true

echo ""
echo "Project created at: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "  cd $TARGET_DIR"
echo "  opencode"
echo "  /init"
echo ""
echo "This will analyze your project and generate AGENTS.md"
