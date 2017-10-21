#!/bin/sh
# shellcheck shell=dash

#
# Get current versions of Chromium
#
# Requires jq
#
# Usage: ./latest.sh
#

VERSION=$(curl -s https://omahaproxy.appspot.com/all.json | \
  jq -r '.[] | select(.os == "linux") | .versions[] | select(.channel == "stable") | .current_version' \
)

echo "$VERSION"
