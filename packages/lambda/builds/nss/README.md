# NSS

NSS is a library required by chrome to run. Unfortunately the version provided
by the AWS lambda image is too old, so it's necessary to build it.

*Note:* This work was originally done by @qubyte in [PR#56](https://github.com/adieuadieu/serverless-chrome/pull/56/files). It's currently not necessary to include a special version of NSS but may become necessary again in the future—for that reason this is left here.

## Building

Start a smallish EC2 instance using the same AMI as lambda. You can find a link
to it [here][1]. Build on the instance using the following (adapted from
instructions found [here][2]):

```shell
sudo yum install mercurial
sudo yum groupinstall 'Development Tools'
sudo yum install zlib-devel

hg clone https://hg.mozilla.org/projects/nspr
hg clone https://hg.mozilla.org/projects/nss

cd nss

export BUILD_OPT=1
export USE_64=1
export NSDISTMODE=copy

gmake nss_build_all
```

Remove any simlinks in the `dist` directory (they'll be links to .chk files) and
zip it up for grabbing by scp. Place the archive in this folder (I've used a
reverse date and the commit hash as a name), and replace the name in the
lambda package file.

[1]: http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html
[2]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS/Reference/Building_and_installing_NSS/Build_instructions
