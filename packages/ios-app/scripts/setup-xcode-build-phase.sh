#!/bin/bash

# Script to automatically add a "Generate Config" build phase to Xcode project
# This modifies the project.pbxproj file programmatically

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
IOS_APP_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_FILE="$IOS_APP_DIR/CheerioApp.xcodeproj/project.pbxproj"

echo -e "${BLUE}🔧 Setting up Xcode build phase for auto-generating Config.swift${NC}"
echo ""

# Check if project file exists
if [ ! -f "$PROJECT_FILE" ]; then
    echo -e "${RED}❌ Error: Xcode project not found at $PROJECT_FILE${NC}"
    exit 1
fi

# Backup the project file
BACKUP_FILE="${PROJECT_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$PROJECT_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✅ Created backup: $(basename $BACKUP_FILE)${NC}"

# Check if build phase already exists
if grep -q "Generate Config from .env" "$PROJECT_FILE"; then
    echo -e "${YELLOW}⚠️  Build phase 'Generate Config from .env' already exists${NC}"
    echo -e "${YELLOW}   Skipping setup. Remove it manually if you want to recreate it.${NC}"
    exit 0
fi

echo -e "${BLUE}📝 This script will modify your Xcode project file.${NC}"
echo -e "${YELLOW}   It will add a 'Run Script' build phase to auto-generate Config.swift${NC}"
echo ""
echo -e "Project file: $PROJECT_FILE"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    rm "$BACKUP_FILE"
    exit 0
fi

# Generate a unique ID for the build phase (Xcode uses 24-char hex IDs)
BUILD_PHASE_ID="7${RANDOM}$(printf '%016X' $(date +%s))00"
COMMENT_ID="7${RANDOM}$(printf '%016X' $(($(date +%s) + 1)))01"

echo -e "${BLUE}🔨 Adding build phase to project...${NC}"

# The shell script to run (escaped for insertion)
SHELL_SCRIPT='# Auto-generate Config.swift from .env.local\necho \"🔄 Generating Config.swift from .env.local...\"\ncd \"${SRCROOT}\"\n./scripts/generate-config.sh\n'

# Create the build phase entry
BUILD_PHASE_ENTRY="		${BUILD_PHASE_ID} /* ShellScript */ = {
			isa = PBXShellScriptBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			inputFileListPaths = (
			);
			inputPaths = (
				\"\$(SRCROOT)/../../.env.local\",
				\"\$(SRCROOT)/../web-app/.env.local\",
			);
			name = \"Generate Config from .env\";
			outputFileListPaths = (
			);
			outputPaths = (
				\"\$(SRCROOT)/CheerioApp/Config.swift\",
			);
			runOnlyForDeploymentPostprocessing = 0;
			shellPath = /bin/sh;
			shellScript = \"$SHELL_SCRIPT\";
		};"

# Insert the build phase definition in PBXShellScriptBuildPhase section
# If section doesn't exist, create it before PBXSourcesBuildPhase
if grep -q "Begin PBXShellScriptBuildPhase section" "$PROJECT_FILE"; then
    # Section exists, add to it
    sed -i '' "/Begin PBXShellScriptBuildPhase section/a\\
$BUILD_PHASE_ENTRY
" "$PROJECT_FILE"
else
    # Create new section
    sed -i '' "/Begin PBXSourcesBuildPhase section/i\\
/* Begin PBXShellScriptBuildPhase section */\\
$BUILD_PHASE_ENTRY\\
/* End PBXShellScriptBuildPhase section */\\
\\
" "$PROJECT_FILE"
fi

# Add the build phase to the target's buildPhases array
# Find the CheerioApp target and add the script phase before Sources phase
TARGET_SECTION=$(grep -n "isa = PBXNativeTarget" "$PROJECT_FILE" | head -1 | cut -d: -f1)
BUILD_PHASES_LINE=$(tail -n +$TARGET_SECTION "$PROJECT_FILE" | grep -n "buildPhases = (" | head -1 | cut -d: -f1)
INSERT_LINE=$((TARGET_SECTION + BUILD_PHASES_LINE))

# Add the build phase reference (with comment for readability)
sed -i '' "${INSERT_LINE}a\\
				${BUILD_PHASE_ID} /* Generate Config from .env */,
" "$PROJECT_FILE"

echo -e "${GREEN}✅ Build phase added successfully!${NC}"
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Open CheerioApp.xcodeproj in Xcode"
echo -e "  2. Go to Target → Build Phases"
echo -e "  3. You should see 'Generate Config from .env'"
echo -e "  4. Drag it above 'Compile Sources' if needed"
echo -e "  5. Build your project (Cmd+B)"
echo ""
echo -e "${YELLOW}Note: If something goes wrong, restore from backup:${NC}"
echo -e "  cp '$BACKUP_FILE' '$PROJECT_FILE'"
echo ""
