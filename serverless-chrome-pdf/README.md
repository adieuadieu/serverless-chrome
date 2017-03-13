# thingamajigs / serverless-chrome-pdf experiment

**Warning**: This is an experiment. This code is a mess. Doesn't actually work yet. Once it does, it might get refactored and split into it's own cleaned-up repository. Maybe.


Run with:
```bash
npm install serverless -g
serverless deploy
```

Test with `yarn test` or just `yarn ava` to skip the linter.

You must configure your AWS credentials either by defining `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environmental variables, or using an AWS profile. You can read more about this on the [Serverless Credentials Guide](https://serverless.com/framework/docs/providers/aws/guide/credentials/).

In short, either:

```bash
export AWS_PROFILE=<your-profile-name>
```

or

```bash
export AWS_ACCESS_KEY_ID=<your-key-here>
export AWS_SECRET_ACCESS_KEY=<your-secret-key-here>
```




<hr />



## Building Headless Chrome for AWS Lambda

How to build headless_shell (headless Chrome) for the lambda execution environment amzn-ami-hvm-2016.03.3.x86_64-gp2 (us-west-2 ami-7172b611):

ssh into the instance and then:
```bash
sudo printf "LANG=en_US.utf-8\nLC_ALL=en_US.utf-8" >> /etc/environment

sudo yum install -y git redhat-lsb python bzip2 tar pkgconfig atk-devel alsa-lib-devel bison binutils brlapi-devel bluez-libs-devel bzip2-devel cairo-devel cups-devel dbus-devel dbus-glib-devel expat-devel fontconfig-devel freetype-devel gcc-c++ GConf2-devel glib2-devel glibc.i686 gperf glib2-devel gtk2-devel gtk3-devel java-1.*.0-openjdk-devel libatomic libcap-devel libffi-devel libgcc.i686 libgnome-keyring-devel libjpeg-devel libstdc++.i686 libX11-devel libXScrnSaver-devel libXtst-devel libxkbcommon-x11-devel ncurses-compat-libs nspr-devel nss-devel pam-devel pango-devel pciutils-devel pulseaudio-libs-devel zlib.i686 httpd mod_ssl php php-cli python-psutil wdiff --enablerepo=epel
```

It'll complain about some packages not existing. Didn't seem to stop me from building headless_shell, though. Next:

```bash
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

make the tarball:
```bash
mkdir out/headless-chrome && cd out
cp Headless/headless_shell Headless/libosmesa.so headless-chrome/
tar -zcvf headless-chrome-linux-x64.tar.gz headless-chrome/
```



### URL/resource dump:


64 mb size limit issue?
https://bugs.chromium.org/p/chromium/issues/detail?id=522853

/dev/shm doesn't exist in lambda: https://forums.aws.amazon.com/thread.jspa?threadID=219962


some good stuff here https://claudiajs.com/tutorials/pandoc-lambda.html

headless chrome code: https://cs.chromium.org/chromium/src/headless/app/

https://chromedevtools.github.io/debugger-protocol-viewer/tot/Log/

https://productforums.google.com/forum/#!topic/chrome/bBSUEDtLBfA

https://bugs.chromium.org/p/chromium/issues/detail?id=546953#c54
https://chromium.googlesource.com/chromium/src/+/master/headless/README.md

http://www.zackarychapple.guru/chrome/2016/08/24/chrome-headless.html
https://chromium.googlesource.com/chromium/src/+/master/docs/linux_build_instructions.md
http://mirror.centos.org/centos/6/os/x86_64/
https://mockingbot.com/posts/173

https://chromium.googlesource.com/chromium/src/+/master/docs/mac_build_instructions.md
