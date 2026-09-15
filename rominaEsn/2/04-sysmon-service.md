omina@romina-VMware-Virtual-Platform:~/week-2-lab$ systemctl list-timers sysmon-report.timer --all --no-pager --full
NEXT                          LEFT LAST                                PASSED UNIT                ACTIVATES
Tue 2026-09-15 23:50:00 +0330 6min Tue 2026-09-15 23:40:02 +0330 3min 34s ago sysmon-report.timer sysmon-report.service

1 timers listed.
romina@romina-VMware-Virtual-Platform:~/week-2-lab$ sudo journalctl -u sysmon-report.service -n 6 --no-pager
Sep 15 23:29:11 romina-VMware-Virtual-Platform systemd[1]: Starting sysmon-report.service - Generate the sysmon system report...
Sep 15 23:29:11 romina-VMware-Virtual-Platform systemd[1]: sysmon-report.service: Deactivated successfully.
Sep 15 23:29:11 romina-VMware-Virtual-Platform systemd[1]: Finished sysmon-report.service - Generate the sysmon system report.
Sep 15 23:40:02 romina-VMware-Virtual-Platform systemd[1]: Starting sysmon-report.service - Generate the sysmon system report...
Sep 15 23:40:02 romina-VMware-Virtual-Platform systemd[1]: sysmon-report.service: Deactivated successfully.
Sep 15 23:40:02 romina-VMware-Virtual-Platform systemd[1]: Finished sysmon-report.service - Generate the sysmon system report.
