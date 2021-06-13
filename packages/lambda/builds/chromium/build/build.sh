#!/bin/sh
# shellcheck shell=dash

#
# Build Chromium for Amazon Linux.
# Assumes root privileges. Or, more likely, Docker—take a look at
# the corresponding Dockerfile in this directory.
#
# Requires
#
# Usage: ./build.sh
#
# Further documentation: https://github.com/adieuadieu/serverless-chrome/blob/develop/docs/chrome.md
#

set -e

BUILD_BASE=$(pwd)
VERSION=${VERSION:-master}

printf "LANG=en_US.utf-8\nLC_ALL=en_US.utf-8" >> /etc/environment

# install dependencies
yum groupinstall -y "Development Tools"
yum install -y \
  alsa-lib-devel atk-devel binutils bison bluez-libs-devel brlapi-devel \
  bzip2 bzip2-devel cairo-devel cmake cups-devel dbus-devel dbus-glib-devel \
  expat-devel fontconfig-devel freetype-devel gcc-c++ git glib2-devel glibc \
  gperf gtk3-devel htop httpd java-1.*.0-openjdk-devel libatomic libcap-devel \
  libffi-devel libgcc libgnome-keyring-devel libjpeg-devel libstdc++ libuuid-devel \
  libX11-devel libxkbcommon-x11-devel libXScrnSaver-devel libXtst-devel mercurial \
  mod_ssl ncurses-compat-libs nspr-devel nss-devel pam-devel pango-devel \
  pciutils-devel php php-cli pkgconfig pulseaudio-libs-devel python python3 \
  tar zlib zlib-devel

mkdir -p build/chromium

cd build

# install dept_tools
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git

export PATH="/opt/gtk/bin:$PATH:$BUILD_BASE/build/depot_tools"

cd chromium

# fetch chromium source code
# ref: https://www.chromium.org/developers/how-tos/get-the-code/working-with-release-branches

# git shallow clone, much quicker than a full git clone; see https://stackoverflow.com/a/39067940/3145038 for more details

git clone --branch "$VERSION" --depth 1 https://chromium.googlesource.com/chromium/src.git

# Checkout all the submodules at their branch DEPS revisions
gclient sync --with_branch_heads --jobs 16

cd src

# the following is no longer necessary since. left here for nostalgia or something.
# ref: https://chromium.googlesource.com/chromium/src/+/1824e5752148268c926f1109ed7e5ef1d937609a%5E%21
# tweak to disable use of the tmpfs mounted at /dev/shm
# sed -e '/if (use_dev_shm) {/i use_dev_shm = false;\n' -i base/files/file_util_posix.cc

#
# tweak to keep Chrome from crashing after 4-5 Lambda invocations
# see https://github.com/adieuadieu/serverless-chrome/issues/41#issuecomment-340859918
# Thank you, Geert-Jan Brits (@gebrits)!
#
SANDBOX_IPC_SOURCE_PATH="content/browser/sandbox_ipc_linux.cc"

sed -e 's/PLOG(WARNING) << "poll";/PLOG(WARNING) << "poll"; failed_polls = 0;/g' -i "$SANDBOX_IPC_SOURCE_PATH"


# specify build flags
mkdir -p out/Headless && \
  echo 'import("//build/args/headless.gn")' > out/Headless/args.gn && \
  echo 'is_debug = false' >> out/Headless/args.gn && \
  echo 'symbol_level = 0' >> out/Headless/args.gn && \
  echo 'is_component_build = false' >> out/Headless/args.gn && \
  echo 'remove_webcore_debug_symbols = true' >> out/Headless/args.gn && \
  echo 'enable_nacl = false' >> out/Headless/args.gn && \
  gn gen out/Headless

# build chromium headless shell
ninja -C out/Headless headless_shell

cp out/Headless/headless_shell "$BUILD_BASE/bin/headless-chromium-unstripped"

cd "$BUILD_BASE"

# strip symbols
strip -o "$BUILD_BASE/bin/headless-chromium" build/chromium/src/out/Headless/headless_shell

# Use UPX to package headless chromium
# this adds 1-1.5 seconds of startup time so generally
# not so great for use in AWS Lambda so we don't actually use it
# but left here in case someone finds it useful
# yum install -y ucl ucl-devel --enablerepo=epel
# cd build
# git clone https://github.com/upx/upx.git
# cd build/upx
# git submodule update --init --recursive
# make all
# cp "$BUILD_BASE/build/chromium/src/out/Headless/headless_shell" "$BUILD_BASE/bin/headless-chromium-packaged"
# src/upx.out "$BUILD_BASE/bin/headless-chromium-packaged"
