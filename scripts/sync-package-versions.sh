#!/bin/sh
# shellcheck shell=dash

#
# Synchronises package version with the version in the project root.
# Also synchronizes package dependencies
#
# Note: probably would be better to use something like Lerna here.........
#
# Requires jq.
#
# Usage: ./sync-package-versions.sh
#

set -e

cd "$(dirname "$0")/../"

PROJECT_VERSION=$(jq -r ".version" package.json)

cd packages/

for PACKAGE in */package.json; do
  PACKAGE_NAME="${PACKAGE%%/*}"
    cd "$PACKAGE_NAME" || exit 1

    PACKAGE_VERSION=$(jq -r ".version" package.json)

    if [ "$PACKAGE_VERSION" != "$PROJECT_VERSION" ]; then
      echo "Updating $PACKAGE_NAME version ..."
      
      JSON=$(jq -r \
        ".version |= \"$PROJECT_VERSION\"" \
        package.json
      )

      HAS_LAMBDA_DEPENDENCY=$(echo "$JSON" | \
        jq -r \
        ".dependencies | has(\"@serverless-chrome/lambda\")"
      )

      if [ "$HAS_LAMBDA_DEPENDENCY" = "true" ]; then
        JSON=$(echo "$JSON" | \
          jq -r \
          ".dependencies.\"@serverless-chrome/lambda\" |= \"$PROJECT_VERSION\""
        )
      fi

      echo "$JSON" > package.json
      #yarn generate-lock-entry
    else
      echo "$BUILD_NAME version $CURRENT_VERSION is already latest. Nothing to update."
    fi

    cd ../
done

# @TODO: update integration-test and example dependencies, too
# @TODO: run yarn to update lockfile
