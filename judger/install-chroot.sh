#!/bin/bash

ls

# install debootstrap
sudo apt-get update
sudo apt-get install dchroot debootstrap
sudo mkdir -p /var/SECURITY/JAIL/

# setup schroot config
sudo chmod 777 /etc/schroot/schroot.conf
sudo cat schroot.conf >> /etc/schroot/schroot.conf

# install chroot
sudo debootstrap --variant=buildd --arch amd64 xenial /var/SECURITY/JAIL/ http://mirror.math.princeton.edu/pub/ubuntu/

# mount proc to chroot
sudo mount proc /var/SECURITY/JAIL/proc -t proc
ls /var/SECURITY/JAIL/

# setup chroot, check gcc, insall java, check java
sudo cp setup-chroot.sh /var/SECURITY/JAIL/
sudo cat /var/SECURITY/JAIL/setup-chroot.sh
sudo chmod +x /var/SECURITY/JAIL/setup-chroot.sh
sudo chroot /var/SECURITY/JAIL/ ./setup-chroot.sh

# make programm run directory inside chroot
sudo mkdir -p /var/SECURITY/JAIL/home/runs
ls /var/SECURITY/JAIL/home/runs