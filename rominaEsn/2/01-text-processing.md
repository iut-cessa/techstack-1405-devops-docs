romina@romina-VMware-Virtual-Platform:~$ ls -ld ~/week-2-lab
drwxrwxr-x 2 romina romina 4096 Sep 14 20:44 /home/romina/week-2-lab
romina@romina-VMware-Virtual-Platform:~$ head -n 5 /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
romina@romina-VMware-Virtual-Platform:~$ command -v nologin
/usr/sbin/nologin
romina@romina-VMware-Virtual-Platform:~$ nologin_path="$(command -v nologin)"
romina@romina-VMware-Virtual-Platform:~$ printf '%s\n' "$nologin_path"
/usr/sbin/nologin
romina@romina-VMware-Virtual-Platform:~$ cut -d: -f7 /etc/passwd
/bin/bash
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/bin/sync
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/bin/false
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/bin/false
/usr/sbin/nologin
/usr/sbin/nologin
/bin/false
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/bin/false
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/bin/false
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/bin/false
/bin/false
/usr/sbin/nologin
/bin/bash
/bin/bash
/usr/sbin/nologin
/usr/sbin/nologin
romina@romina-VMware-Virtual-Platform:~$ cut -d: -f7 /etc/passwd | grep -Fx "$nologin_path"
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
/usr/sbin/nologin
romina@romina-VMware-Virtual-Platform:~$ cut -d: -f7 /etc/passwd | grep -Fx "$nologin_path" | wc -l
41
romina@romina-VMware-Virtual-Platform:~$ cut -d: -f7 /etc/passwd | sort | uniq -c | sort -nr
     41 /usr/sbin/nologin
      7 /bin/false
      3 /bin/bash
      1 /bin/sync
romina@romina-VMware-Virtual-Platform:~$ cat ~/week-2-lab/access.log
10.20.0.4 GET / 200
10.20.0.8 GET /health 200
10.20.0.4 GET /login 401
10.20.0.4 ERROR database timeout
10.20.0.8 GET / 200
10.20.0.12 ERROR upstream unavailable
romina@romina-VMware-Virtual-Platform:~$ awk '{print $1}' ~/week-2-lab/access.log
10.20.0.4
10.20.0.8
10.20.0.4
10.20.0.4
10.20.0.8
10.20.0.12
romina@romina-VMware-Virtual-Platform:~$ awk '{print $1}' ~/week-2-lab/access.log |
  sort |
  uniq -c |
  sort -nr
      3 10.20.0.4
      2 10.20.0.8
      1 10.20.0.12
romina@romina-VMware-Virtual-Platform:~$ grep 'ERROR' ~/week-2-lab/access.log
10.20.0.4 ERROR database timeout
10.20.0.12 ERROR upstream unavailable
romina@romina-VMware-Virtual-Platform:~$ grep -c 'ERROR' ~/week-2-lab/access.log
2
romina@romina-VMware-Virtual-Platform:~$ ls /etc/hostname /path/that-does-not-exist > ~/week-2-lab/stdout.txt 2> ~/week-2-lab/stderr.txt
romina@romina-VMware-Virtual-Platform:~$ echo $?
2
romina@romina-VMware-Virtual-Platform:~$ cat ~/week-2-lab/stdout.txt
/etc/hostname
romina@romina-VMware-Virtual-Platform:~$ cat ~/week-2-lab/stderr.txt
ls: cannot access '/path/that-does-not-exist': No such file or directory
romina@romina-VMware-Virtual-Platform:~$ df -h / | tee ~/week-2-lab/root-disk.txt
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2        30G   24G  4.6G  84% /
romina@romina-VMware-Virtual-Platform:~$ cat ~/week-2-lab/root-disk.txt
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2        30G   24G  4.6G  84% /
romina@romina-VMware-Virtual-Platform:~$ ls -lh ~/week-2-lab
total 16K
-rw-rw-r-- 1 romina romina 162 Sep 14 20:44 access.log
-rw-rw-r-- 1 romina romina  89 Sep 15 18:25 root-disk.txt
-rw-rw-r-- 1 romina romina  73 Sep 15 18:22 stderr.txt
-rw-rw-r-- 1 romina romina  14 Sep 15 18:22 stdout.txt
