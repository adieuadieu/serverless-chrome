# Original Dockferfile from Outsider <outsideris@gmail.com>
# via https://github.com/outsideris/headless-chrome-for-lambda
# Thank you, Outsider!

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

# ref: https://chromium.googlesource.com/chromium/src.git/+refs
ENV VERSION 64.0.3242.2

# install dept_tools
WORKDIR /chrome
RUN git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git

ENV PATH="/opt/gtk/bin:${PATH}:/chrome/depot_tools"

WORKDIR /chrome/Chromium
# fetch chromium source code
# ref: https://www.chromium.org/developers/how-tos/get-the-code/working-with-release-branches
RUN git clone https://chromium.googlesource.com/chromium/src.git

WORKDIR /chrome/Chromium/src
# checkout the release tag
RUN git checkout -b build "${VERSION}"

ADD .gclient /chrome/Chromium/
WORKDIR /chrome/Chromium
# Checkout all the submodules at their branch DEPS revisions
RUN gclient sync --with_branch_heads --jobs 16
# tweak to disable use of the tmpfs mounted at /dev/shm
RUN sed -e '/if (use_dev_shm) {/i use_dev_shm = false;\n' -i src/base/files/file_util_posix.cc

WORKDIR /chrome/Chromium/src
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

# strip?
# RUN strip out/Headless/headless_shell
