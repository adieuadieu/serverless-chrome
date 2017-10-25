FROM adieuadieu/chromium-for-amazonlinux-base

# ref: https://chromium.googlesource.com/chromium/src.git/+refs
ARG VERSION
ENV VERSION ${VERSION:-64.0.3242.2}

WORKDIR /build/chromium/src

# Pull latest in case Docker used a cache in the git clone step (which we want as it takes forever)
RUN git pull

# checkout the release tag
RUN git checkout -b build "${VERSION}"

# tweak to disable use of the tmpfs mounted at /dev/shm
RUN sed -e '/if (use_dev_shm) {/i use_dev_shm = false;\n' -i src/base/files/file_util_posix.cc

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

RUN cp /build/chromium/src/out/Headless/headless_shell /build/headless-chromium-unstripped

WORKDIR /build

# Use UPX to package headless chromium
# this adds 1-1.5 seconds of startup time so generally
# not so great for use in AWS Lambda so we don't actually use it 
# but left here in case someone finds it useful
# RUN yum install -y ucl ucl-devel --enablerepo=epel
# RUN git clone https://github.com/upx/upx.git
# WORKDIR /build/upx
# RUN git submodule update --init --recursive
# RUN make all
# RUN cp /build/chromium/src/out/Headless/headless_shell /build/headless-chromium-packaged
# RUN src/upx.out /build/headless-chromium-packaged
# WORKDIR /build

# strip symbols
RUN strip -o /build/headless-chromium /build/chromium/src/out/Headless/headless_shell
