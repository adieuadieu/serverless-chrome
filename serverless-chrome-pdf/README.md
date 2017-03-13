# thingamajigs / serverless-chrome-pdf experiment

**Warning**: This is an experiment. This code is a mess. Doesn't actually work yet. Once it does, it'll get refactored and split off into it's own cleaned-up repository.

**The Goal:** Run headless Chrome in AWS Lambda and generate a PDF of a webpage (e.g. kinda like what you can do with [PhantomJS](http://phantomjs.org/) or [wkhtmltopdf](https://github.com/wkhtmltopdf/wkhtmltopdf)) or [node-webkitgtk](https://github.com/kapouer/node-webkitgtk) or [electron-pdf](https://github.com/Janpot/electron-pdf) but with Chrome.) Yes; I'm aware that headless Chrome is still missing support for [`Page.printToPDF`](https://chromedevtools.github.io/debugger-protocol-viewer/tot/Page/#method-printToPDF).

**Why?** Because it's neat. And the PhantomJS guy never updates webkit. And I don't want to hack together Xvbf in Lambda.


## Run it (maybe.. or probably not)

Run with:
```bash
npm install serverless -g
yarn install
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







## Building Headless Chrome for AWS Lambda

How to build headless_shell (headless Chrome) for the lambda execution environment. These steps are based on [this](http://www.zackarychapple.guru/chrome/2016/08/24/chrome-headless.html) and [this](https://chromium.googlesource.com/chromium/src/+/master/docs/linux_build_instructions.md).

1. Create a new EC2 instance using the community AMI with name amzn-ami-hvm-2016.03.3.x86_64-gp2 (us-west-2 ami-7172b611).
2. Pick an Instance Type with at least 16 GB of memory. Compile time will take about 4-5 hours on a t2.xlarge, or 2-3ish on a t2.2xlarge or about 45 min on a c4.4xlarge.
3. Give yourself a Root Volume that's at least 30 GB (40 GB if you want to compile a debug build—which you won't be able to upload to Lambda because it's too big.)
4. SSH into the new instance and run:

```bash
sudo printf "LANG=en_US.utf-8\nLC_ALL=en_US.utf-8" >> /etc/environment

sudo yum install -y git redhat-lsb python bzip2 tar pkgconfig atk-devel alsa-lib-devel bison binutils brlapi-devel bluez-libs-devel bzip2-devel cairo-devel cups-devel dbus-devel dbus-glib-devel expat-devel fontconfig-devel freetype-devel gcc-c++ GConf2-devel glib2-devel glibc.i686 gperf glib2-devel gtk2-devel gtk3-devel java-1.*.0-openjdk-devel libatomic libcap-devel libffi-devel libgcc.i686 libgnome-keyring-devel libjpeg-devel libstdc++.i686 libX11-devel libXScrnSaver-devel libXtst-devel libxkbcommon-x11-devel ncurses-compat-libs nspr-devel nss-devel pam-devel pango-devel pciutils-devel pulseaudio-libs-devel zlib.i686 httpd mod_ssl php php-cli python-psutil wdiff --enablerepo=epel
```

_Yum_ will complain about some packages not existing. Whatever. I haven't looked into them. Didn't seem to stop me from building headless_shell, though. Ignore whiney little _Yum_ and move on. Next:

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





<hr />





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
