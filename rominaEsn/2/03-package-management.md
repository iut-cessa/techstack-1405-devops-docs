omina@romina-VMware-Virtual-Platform:~$ command -v apt
command -v dnf
/usr/bin/apt
romina@romina-VMware-Virtual-Platform:~$ sudo apt update
.
.
romina@romina-VMware-Virtual-Platform:~$ apt search jq
Sorting... Done
.
.

omina@romina-VMware-Virtual-Platform:~$ apt show jq
Package: jq
Version: 1.7.1-3ubuntu0.24.04.2
Priority: optional
Section: utils
Origin: Ubuntu
Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>
Original-Maintainer: ChangZhuo Chen (陳昌倬) <czchen@debian.org>
Bugs: https://bugs.launchpad.net/ubuntu/+filebug
Installed-Size: 116 kB
Depends: libc6 (>= 2.38), libjq1 (= 1.7.1-3ubuntu0.24.04.2)
Homepage: https://jqlang.github.io/jq
Task: ubuntu-desktop-minimal, ubuntu-desktop, cloud-image, cloud-image, server, ubuntu-server-raspi, ubuntu-desktop-raspi, kubuntu-desktop, xubuntu-minimal, xubuntu-desktop, lubuntu-desktop, ubuntustudio-desktop-core, ubuntustudio-desktop, ubuntukylin-desktop, ubuntukylin-desktop-minimal, ubuntu-mate-core, ubuntu-mate-desktop, ubuntu-budgie-desktop-minimal, ubuntu-budgie-desktop, ubuntu-budgie-desktop-raspi, ubuntu-unity-desktop, edubuntu-desktop-gnome-minimal, edubuntu-desktop-gnome-raspi, ubuntucinnamon-desktop-minimal, ubuntucinnamon-desktop-raspi
Download-Size: 65.7 kB
APT-Manual-Installed: no
APT-Sources: http://mirror.arvancloud.ir/ubuntu noble-updates/main amd64 Packages
Description: lightweight and flexible command-line JSON processor
 jq is like sed for JSON data – you can use it to slice
 and filter and map and transform structured data with
 the same ease that sed, awk, grep and friends let you
 play with text.
 .
 It is written in portable C, and it has minimal runtime
 dependencies.
 .
 jq can mangle the data format that you have into the
 one that you want with very little effort, and the
 program to do so is often shorter and simpler than
 you’d expect.

N: There is 1 additional record. Please use the '-a' switch to see it
romina@romina-VMware-Virtual-Platform:~$ sudo apt install -y jq
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
jq is already the newest version (1.7.1-3ubuntu0.24.04.2).
jq set to manually installed.
The following packages were automatically installed and are no longer required:
  libfwupd2 libgl1-amber-dri libglapi-mesa libwoff1
Use 'sudo apt autoremove' to remove them.
0 upgraded, 0 newly installed, 0 to remove and 37 not upgraded.
romina@romina-VMware-Virtual-Platform:~$ command -v jq
/usr/bin/jq
romina@romina-VMware-Virtual-Platform:~$ dpkg-query -W -f='${Status} ${Package} ${Version}\n' jq
install ok installed jq 1.7.1-3ubuntu0.24.04.2
romina@romina-VMware-Virtual-Platform:~$ ip -j address | jq -r '.[].ifname'
lo
ens33
br-6af7829da93f
docker0
