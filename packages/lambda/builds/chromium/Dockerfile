#
# Launch headless Chromium with:
# docker run -d --rm --name headless-chromium -p 9222:9222 adieuadieu/headless-chromium-for-aws-lambda
#

#FROM amazonlinux:2017.03
FROM lambci/lambda

# ref: https://chromium.googlesource.com/chromium/src.git/+refs
ARG VERSION
ENV VERSION ${VERSION:-master}

LABEL maintainer="Marco Lüthy <marco.luethy@gmail.com>"
LABEL chromium="${VERSION}"

WORKDIR /

ADD dist/headless-chromium /bin/headless-chromium

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
