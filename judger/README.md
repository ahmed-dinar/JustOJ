### Run Test

```javascript
sudo npm run test-sandbox
```


### Before Test

#### Setup Chroot
 - https://www.digitalocean.com/community/tutorials/how-to-configure-chroot-environments-for-testing-on-an-ubuntu-12-04-vps
 - http://gernotklingler.com/blog/use-chroot-jail-software-development/
 - https://www.youtube.com/watch?v=XTyY3in5r6Q
 
##### Ubuntu versions
  https://wiki.ubuntu.com/Releases
##### Mirrors
  https://launchpad.net/ubuntu/+archivemirrors

#### Chroot Steps

```javascript
sudo apt-get update
sudo apt-get install dchroot debootstrap
sudo mkdir /var/SECURITY/JAIL/
sudo gedit /etc/schroot/schroot.conf

[xenial]
description=Ubuntu Xenial Xerus
location=/var/SECURITY/JAIL
priority=3
users=ahmed-dinar
groups=sbuild
root-groups=root

sudo debootstrap --variant=buildd --arch amd64 xenial /var/SECURITY/JAIL/ http://mirror.dhakacom.com/ubuntu/
sudo mount proc /var/SECURITY/JAIL/proc -t proc
```

#### Install OpenJDK 8 in Chroot

```javascript
apt-get update
apt-get install default-jdk
update-alternatives --config java
```
