#!/bin/bash

ls

# check if gcc exists
gcc --version

# install java 8
apt-get -y install default-jdk
java -version

# exit from chroot
exit