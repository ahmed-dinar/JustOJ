#!/bin/bash

ls
lsb_release -a

# check if gcc exists
gcc --version

# install java 8
apt-get -y install default-jdk
java -version

echo "java installed inside chroot"

# exit from chroot
exit