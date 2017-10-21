#!/bin/sh
# shellcheck shell=dash

#
# Get current versions of browsers
#
# Requires jq
#
# Usage: ./latest-versions.sh
#

CHROMIUM=$(curl -s https://omahaproxy.appspot.com/all.json | \
  jq -r '.[] | select(.os == "linux") | .versions[] | select(.channel == "stable") | .current_version' \
)

echo "Current stable version of Chromium: $CHROMIUM"
