# thingamajigs
Various bits and things for shits 'n' giggles



http://www.zackarychapple.guru/chrome/2016/08/24/chrome-headless.html
https://chromium.googlesource.com/chromium/src/+/master/docs/linux_build_instructions.md
http://mirror.centos.org/centos/6/os/x86_64/
https://mockingbot.com/posts/173

https://chromium.googlesource.com/chromium/src/+/master/docs/mac_build_instructions.md



How to build headless_shell (headless Chrome) for the lambda execution environment amzn-ami-hvm-2016.03.3.x86_64-gp2 (ami-7172b611):

```
sudo printf "LANG=en_US.utf-8\nLC_ALL=en_US.utf-8" >> /etc/environment
```

```sudo yum install -y git redhat-lsb python bzip2 tar pkgconfig atk-devel alsa-lib-devel bison binutils brlapi-devel bluez-libs-devel bzip2-devel cairo-devel cups-devel dbus-devel dbus-glib-devel expat-devel fontconfig-devel freetype-devel gcc-c++ GConf2-devel glib2-devel glibc.i686 gperf glib2-devel gtk2-devel gtk3-devel java-1.*.0-openjdk-devel libatomic libcap-devel libffi-devel libgcc.i686 libgnome-keyring-devel libjpeg-devel libstdc++.i686 libX11-devel libXScrnSaver-devel libXtst-devel libxkbcommon-x11-devel ncurses-compat-libs nspr-devel nss-devel pam-devel pango-devel pciutils-devel pulseaudio-libs-devel zlib.i686 httpd mod_ssl php php-cli python-psutil wdiff --enablerepo=epel
```

It'll complain about some packages not existing. Didn't seem to stop me from building headless_shell, though.

```
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
echo "export PATH=$PATH:$HOME/depot_tools" >> ~/.bash_profile
source ~/.bash_profile
mkdir Chromium && cd Chromium
fetch --no-history chromium
cd src
mkdir -p out/Headless
echo 'import("//build/args/headless.gn")' > out/Headless/args.gn
echo 'is_debug = false' >> out/Headless/args.gn
echo 'symbol_level = 0' >> out/Headless/args.gn
echo 'is_component_build = false' >> out/Headless/args.gn
echo 'remove_webcore_debug_symbols = true' >> out/Headless/args.gn
echo 'enable_nacl = false' >> out/Headless/args.gn
gn gen out/Headless
ninja -C out/Headless headless_shell
```

then cp headless_shell and libomesa.so
add here: part to tar -czvf the tarball with headless chrome
