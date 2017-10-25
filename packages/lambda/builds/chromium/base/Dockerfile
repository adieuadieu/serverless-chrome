# Based on Dockferfile from JeongHoon Byun (aka Outsider)
# via https://github.com/outsideris/headless-chrome-for-lambda
# Thank you, JeongHoon!
#
# Jump into the container with:
# docker run -i -t --rm --entrypoint /bin/bash  serverless-chrome-chromium
#

FROM amazonlinux:2017.03

LABEL maintainer="Marco Lüthy <marco.luethy@gmail.com>"

# ref: https://medium.com/@marco.luethy/running-headless-chrome-on-aws-lambda-fa82ad33a9eb
RUN printf "LANG=en_US.utf-8\nLC_ALL=en_US.utf-8" >> /etc/environment

# install dependencies
RUN yum install epel-release -y
RUN yum install -y \
  git redhat-lsb python bzip2 tar pkgconfig atk-devel \
  alsa-lib-devel bison binutils brlapi-devel bluez-libs-devel \
  bzip2-devel cairo-devel cups-devel dbus-devel dbus-glib-devel \
  expat-devel fontconfig-devel freetype-devel gcc-c++ GConf2-devel \
  glib2-devel glibc.i686 gperf glib2-devel gtk2-devel gtk3-devel \
  java-1.*.0-openjdk-devel libatomic libcap-devel libffi-devel \
  libgcc.i686 libgnome-keyring-devel libjpeg-devel libstdc++.i686 \
  libX11-devel libXScrnSaver-devel libXtst-devel \
  libxkbcommon-x11-devel ncurses-compat-libs nspr-devel nss-devel \
  pam-devel pango-devel pciutils-devel pulseaudio-libs-devel \
  zlib.i686 httpd mod_ssl php php-cli python-psutil wdiff --enablerepo=epel

WORKDIR /build

# install dept_tools
RUN git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git

ENV PATH="/opt/gtk/bin:${PATH}:/build/depot_tools"

WORKDIR /build/chromium

# fetch chromium source code
# ref: https://www.chromium.org/developers/how-tos/get-the-code/working-with-release-branches
RUN git clone https://chromium.googlesource.com/chromium/src.git

ADD .gclient /build/chromium/

WORKDIR /build/chromium

# Checkout all the submodules at their branch DEPS revisions
RUN gclient sync --with_branch_heads --jobs 16
