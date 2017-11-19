# Build Headless Chromium for AWS Lambda

Documentation has moved [here](docs/chrome.md)

If you're looking for instructions on how to compile/build Chromium/Chrome for AWS Lambda have a look at the [build script](packages/lambda/builds/chromium/build/build.sh) or the [Dockerfile](packages/lambda/builds/chromium/build/Dockerfile) or simply use the built [Docker image](https://hub.docker.com/r/adieuadieu/headless-chromium-for-aws-lambda/):

```bash
docker run -d --rm \
  --name headless-chromium \
  -p 9222:9222 \
  adieuadieu/headless-chromium-for-aws-lambda
```

Headless Chromium is now running and accessible:

```
GET http://localhost:9222/
```



**Note:** to successfully build the Docker image on MacOS, you may need to [increase the size](https://community.hortonworks.com/articles/65901/how-to-increase-the-size-of-the-base-docker-for-ma.html) of the Docker data sparse image. *Warning!:* This will wipe out all of your local images/containers.


```bash
rm ~/Library/Containers/com.docker.docker/Data/com.docker.driver.amd64-linux/Docker.qcow2
qemu-img create -f qcow2 ~/Library/Containers/com.docker.docker/Data/com.docker.driver.amd64-linux/Docker.qcow2 50G
```


----

<br/>
<br/>
<br/>
<br/>
<br/>
The rest of this README is outdated.
<br/>
<br/>
<br/>
<br/>
<br/>

----

# What is this?

`chrome-headless-lambda-linux-x64.tar.gz` was created on a Linux machine. It contains [Headless Chrome](https://cs.chromium.org/chromium/src/headless/app/) binaries specific to the [Lambda execution environment](http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html). The tarball is used during the Serverless deployment/packaging step to create the zip file for deploying the function to Lambda.


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
```

**TODO:** add part here about modifying Chrome to not use /dev/shm. See here: https://groups.google.com/a/chromium.org/d/msg/headless-dev/qqbZVZ2IwEw/CPInd55OBgAJ


```bash
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
tar -zcvf chrome-headless-lambda-linux-x64.tar.gz headless-chrome/
zip headless-chrome chrome-headless-lambda-linux-x64.zip
```

```
scp -i path/to/your/key-pair.pem ec2-user@<the-instance-public-ip>:/home/ec2-user/Chromium/src/out/chrome-headless-lambda-linux-x64.zip ./
```


**TODO:** We don't need `libosmesa.so` cuz we're not using the GPU? See here: https://groups.google.com/a/chromium.org/d/msg/headless-dev/qqbZVZ2IwEw/XMKlEMP3EQAJ


## Updating

```bash
git fetch --tags
gclient sync --jobs 16
```

https://omahaproxy.appspot.com/
