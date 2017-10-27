#
# Launch headless Chromium with:
# docker run -d --rm --name headless-chromium -p 9222:9222 adieuadieu/headless-chromium-for-aws-lambda
#

FROM amazonlinux:2017.03

LABEL maintainer="Marco Lüthy <marco.luethy@gmail.com>"
LABEL chromium="${VERSION}"

# Do everything in a single step so that we don't end up with a huge layer
# in our image because of the huge size of the Chromium git repository
# ADD build.sh /build/build.sh
# RUN sh /build/build.sh

ADD dist/headless-chromium /chromium/headless_shell

EXPOSE 9222

ENTRYPOINT [ \
  "/chromium/headless_shell", \
  "--no-sandbox", \
  "--hide-scrollbars", \
  "--remote-debugging-address=0.0.0.0", \
  "--remote-debugging-port=9222" \
  ]
