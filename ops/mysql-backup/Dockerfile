FROM mysql:8.4
COPY backup.sh /usr/local/bin/backup-mysql.sh
ENTRYPOINT ["/bin/bash", "/usr/local/bin/backup-mysql.sh"]
