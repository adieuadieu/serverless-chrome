#!/bin/sh
# shellcheck shell=dash

#
# Get current versions of Chromium
#
# Requires jq
#
# Usage: ./latest.sh [stable|beta|dev]
#

CHANNEL=${1:-stable}

VERSION=$(curl -s https://omahaproxy.appspot.com/all.json | \
  jq -r ".[] | select(.os == \"linux\") | .versions[] | select(.channel == \"$CHANNEL\") | .current_version" \
)

echo "$VERSION"
