# Based on Dockferfile from JeongHoon Byun (aka Outsider)
# via https://github.com/outsideris/headless-chrome-for-lambda
# Thank you, JeongHoon!
#
# Launch headless Chromium with:
# docker run -d --rm --name headless-chromium -p 9222:9222 adieuadieu/headless-chromium-for-aws-lambda
#

ARG VERSION=latest

FROM adieuadieu/chromium-for-amazonlinux-base:$VERSION

ARG VERSION
ENV VERSION ${VERSION:-master}

LABEL maintainer="Marco Lüthy <marco.luethy@gmail.com>"
LABEL chromium="${VERSION}"

WORKDIR /build/chromium/src

# tweak to disable use of the tmpfs mounted at /dev/shm
RUN sed -e '/if (use_dev_shm) {/i use_dev_shm = false;\n' -i base/files/file_util_posix.cc

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

# strip symbols
RUN strip -o /build/headless-chromium /build/chromium/src/out/Headless/headless_shell

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

EXPOSE 9222

ENTRYPOINT [ \
  "/build/headless-chromium-unstripped", \
  "--no-sandbox", \
  "--hide-scrollbars", \
  "--remote-debugging-address=0.0.0.0", \
  "--remote-debugging-port=9222" \
  ]
