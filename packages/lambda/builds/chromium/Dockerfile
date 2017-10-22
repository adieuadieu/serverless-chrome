# Original Dockferfile from JeongHoon Byun (aka Outsider)
# via https://github.com/outsideris/headless-chrome-for-lambda
# Thank you, JeongHoon!
#
# docker run -i -t --rm --entrypoint /bin/bash  serverless-chrome-chromium

FROM amazonlinux:2017.03

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

WORKDIR /build/Chromium

# fetch chromium source code
# ref: https://www.chromium.org/developers/how-tos/get-the-code/working-with-release-branches
RUN git clone https://chromium.googlesource.com/chromium/src.git

# ref: https://chromium.googlesource.com/chromium/src.git/+refs
ARG VERSION
ENV VERSION ${VERSION:-64.0.3242.2}

WORKDIR /build/Chromium/src

# Pull latest in case Docker used a cache in the git clone step (which we want as it takes forever)
RUN git pull

# checkout the release tag
RUN git checkout -b build "${VERSION}"

ADD .gclient /build/Chromium/

WORKDIR /build/Chromium

# Checkout all the submodules at their branch DEPS revisions
RUN gclient sync --with_branch_heads --jobs 16

# tweak to disable use of the tmpfs mounted at /dev/shm
RUN sed -e '/if (use_dev_shm) {/i use_dev_shm = false;\n' -i src/base/files/file_util_posix.cc

WORKDIR /build/Chromium/src

# specify build flags
RUN mkdir -p out/Headless && \
    echo 'import("//build/args/headless.gn")' > out/Headless/args.gn && \
    echo 'is_debug = false' >> out/Headless/args.gn && \
    echo 'symbol_level = 0' >> out/Headless/args.gn && \
    echo 'is_component_build = false' >> out/Headless/args.gn && \
    echo 'remove_webcore_debug_symbols = true' >> out/Headless/args.gn && \
    echo 'enable_nacl = false' >> out/Headless/args.gn && \
    gn gen out/Headless

# build chromium headless shell
RUN ninja -C out/Headless headless_shell

RUN cp /build/Chromium/src/out/Headless/headless_shell /build/headless-chromium-unstripped

WORKDIR /build


# Use UPX to package headless chromium
# this adds 1-1.5 seconds of startup time so generally
# not so great for use in AWS Lambda so we don't actually use it 
# but left here in case someone finds it useful
RUN yum install -y ucl ucl-devel --enablerepo=epel
RUN git clone https://github.com/upx/upx.git
WORKDIR /build/upx
RUN git submodule update --init --recursive
RUN make all
RUN cp /build/Chromium/src/out/Headless/headless_shell /build/headless-chromium-packaged
RUN src/upx.out /build/headless-chromium-packaged

WORKDIR /build

# strip symbols
RUN strip -o /build/headless-chromium /build/Chromium/src/out/Headless/headless_shell
