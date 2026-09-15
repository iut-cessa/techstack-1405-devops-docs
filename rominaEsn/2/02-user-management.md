romina@romina-VMware-Virtual-Platform:~$ cat /etc/os-release
PRETTY_NAME="Ubuntu 24.04.2 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"
VERSION="24.04.2 LTS (Noble Numbat)"
VERSION_CODENAME=noble
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=noble
LOGO=ubuntu-logo
romina@romina-VMware-Virtual-Platform:~$ whoami
romina
romina@romina-VMware-Virtual-Platform:~$ command -v nologin
/usr/sbin/nologin
romina@romina-VMware-Virtual-Platform:~$ nologin_path="$(command -v nologin)"
romina@romina-VMware-Virtual-Platform:~$ printf '%s\n' "$nologin_path"
/usr/sbin/nologin
romina@romina-VMware-Virtual-Platform:~$ test -x "$nologin_path"
echo $?
0
romina@romina-VMware-Virtual-Platform:~$ man useradd
romina@romina-VMware-Virtual-Platform:~$ useradd --help
Usage: useradd [options] LOGIN
       useradd -D
       useradd -D [options]

Options:
      --badname                 do not check for bad names
  -b, --base-dir BASE_DIR       base directory for the home directory of the
                                new account
      --btrfs-subvolume-home    use BTRFS subvolume for home directory
  -c, --comment COMMENT         GECOS field of the new account
  -d, --home-dir HOME_DIR       home directory of the new account
  -D, --defaults                print or change default useradd configuration
  -e, --expiredate EXPIRE_DATE  expiration date of the new account
  -f, --inactive INACTIVE       password inactivity period of the new account
  -F, --add-subids-for-system   add entries to sub[ud]id even when adding a system user
  -g, --gid GROUP               name or ID of the primary group of the new
                                account
  -G, --groups GROUPS           list of supplementary groups of the new
                                account
  -h, --help                    display this help message and exit
  -k, --skel SKEL_DIR           use this alternative skeleton directory
  -K, --key KEY=VALUE           override /etc/login.defs defaults
  -l, --no-log-init             do not add the user to the lastlog and
                                faillog databases
  -m, --create-home             create the user's home directory
  -M, --no-create-home          do not create the user's home directory
  -N, --no-user-group           do not create a group with the same name as
                                the user
  -o, --non-unique              allow to create users with duplicate
                                (non-unique) UID
  -p, --password PASSWORD       encrypted password of the new account
  -r, --system                  create a system account
  -R, --root CHROOT_DIR         directory to chroot into
  -P, --prefix PREFIX_DIR       prefix directory where are located the /etc/* files
  -s, --shell SHELL             login shell of the new account
  -u, --uid UID                 user ID of the new account
  -U, --user-group              create a group with the same name as the user
  -Z, --selinux-user SEUSER     use a specific SEUSER for the SELinux user mapping
      --extrausers              Use the extra users database

romina@romina-VMware-Virtual-Platform:~$ getent passwd sysmon
romina@romina-VMware-Virtual-Platform:~$ echo $?
2

omina@romina-VMware-Virtual-Platform:~$
romina@romina-VMware-Virtual-Platform:~$ sudo useradd --system --user-group --home-dir /nonexistent --no-create-home --shell "$nologin_path" sysmon
romina@romina-VMware-Virtual-Platform:~$ echo $?
0
romina@romina-VMware-Virtual-Platform:~$ id sysmon
uid=997(sysmon) gid=984(sysmon) groups=984(sysmon)
romina@romina-VMware-Virtual-Platform:~$ getent passwd sysmon
sysmon:x:997:984::/nonexistent:/usr/sbin/nologin
romina@romina-VMware-Virtual-Platform:~$ getent group sysmon
sysmon:x:984:
romina@romina-VMware-Virtual-Platform:~$ ls -ld /var/log
drwxrwxr-x 17 root syslog 4096 Sep 15 18:08 /var/log
romina@romina-VMware-Virtual-Platform:~$ sudo mkdir -p /var/log/sysmon
romina@romina-VMware-Virtual-Platform:~$ ls -ld /var/log/sysmon
drwxr-xr-x 2 root root 4096 Sep 15 19:03 /var/log/sysmon
romina@romina-VMware-Virtual-Platform:~$ sudo chown sysmon:sysmon /var/log/sysmon
romina@romina-VMware-Virtual-Platform:~$ ls -ld /var/log/sysmon
drwxr-xr-x 2 sysmon sysmon 4096 Sep 15 19:03 /var/log/sysmon
romina@romina-VMware-Virtual-Platform:~$ sudo chmod 700 /var/log/sysmon
romina@romina-VMware-Virtual-Platform:~$ id sysmon
uid=997(sysmon) gid=984(sysmon) groups=984(sysmon)
romina@romina-VMware-Virtual-Platform:~$ getent passwd sysmon
sysmon:x:997:984::/nonexistent:/usr/sbin/nologin
romina@romina-VMware-Virtual-Platform:~$ ls -ld /var/log/sysmon
drwx------ 2 sysmon sysmon 4096 Sep 15 19:03 /var/log/sysmon
romina@romina-VMware-Virtual-Platform:~$ sudo -u sysmon touch /var/log/sysmon/test.log
romina@romina-VMware-Virtual-Platform:~$ sudo ls -l /var/log/sysmon
total 0
-rw-rw-r-- 1 sysmon sysmon 0 Sep 15 19:06 test.log
