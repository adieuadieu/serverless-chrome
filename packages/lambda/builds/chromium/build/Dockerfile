#
# Build with:
# docker build --compress -t adieuadieu/chromium-for-amazonlinux-base:62.0.3202.62 --build-arg VERSION=62.0.3202.62 .
#
# Jump into the container with:
# docker run -i -t --rm --entrypoint /bin/bash  adieuadieu/chromium-for-amazonlinux-base
#
# Launch headless Chromium with:
# docker run -d --rm --name headless-chromium -p 9222:9222 adieuadieu/headless-chromium-for-aws-lambda
#

FROM amazonlinux:2017.03

# ref: https://chromium.googlesource.com/chromium/src.git/+refs
ARG VERSION
ENV VERSION ${VERSION:-master}

LABEL maintainer="Marco Lüthy <marco.luethy@gmail.com>"
LABEL chromium="${VERSION}"

WORKDIR /

ADD build.sh /
ADD .gclient /build/chromium/

RUN sh /build.sh

EXPOSE 9222

ENTRYPOINT [ \
  "/bin/headless-chromium", \
  "--disable-dev-shm-usage", \
  "--disable-gpu", \
  "--no-sandbox", \
  "--hide-scrollbars", \
  "--remote-debugging-address=0.0.0.0", \
  "--remote-debugging-port=9222" \
  ]
