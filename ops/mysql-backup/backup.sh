#!/bin/bash
set -euo pipefail

: "${DB_HOST:=database}"
: "${DB_NAME:=skill_swap}"
: "${DB_USER:=skillswap}"
: "${BACKUP_INTERVAL_SECONDS:=86400}"
: "${BACKUP_RETENTION_DAYS:=14}"

mkdir -p /backups

while true; do
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  temporary_file="/backups/.skill_swap_${timestamp}.sql.gz.tmp"
  final_file="/backups/skill_swap_${timestamp}.sql.gz"

  echo "Starting database backup at ${timestamp}"
  if mysqldump \
    --host="${DB_HOST}" \
    --user="${DB_USER}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "${DB_NAME}" | gzip -c > "${temporary_file}"; then
    mv "${temporary_file}" "${final_file}"
    find /backups -type f -name 'skill_swap_*.sql.gz' -mtime "+${BACKUP_RETENTION_DAYS}" -delete
    echo "Completed database backup: ${final_file}"
  else
    rm -f "${temporary_file}"
    echo "Database backup failed at ${timestamp}" >&2
    exit 1
  fi

  sleep "${BACKUP_INTERVAL_SECONDS}"
done
