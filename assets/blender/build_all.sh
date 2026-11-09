#!/bin/sh
# Rebuild every asset (runs up to 4 Blender instances in parallel).
cd "$(dirname "$0")/../.." || exit 1
B=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
ls assets/blender/*.py | grep -v '/lib' | xargs -P 4 -I{} sh -c "\"$B\" --background --factory-startup --python {} 2>&1 | grep -E 'ASSET|Error|Traceback' "
