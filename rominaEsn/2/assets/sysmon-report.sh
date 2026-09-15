#!/usr/bin/env bash
set -euo pipefail

if (( $# != 0 )); then
  printf 'Usage: %s\n' "$0" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  printf 'Error: jq is required but was not found.\n' >&2
  exit 127
fi

generated_at="$(date --iso-8601=seconds)"
root_disk_used="$(df -P / | awk 'NR == 2 {print $5}')"

failed_output="$(systemctl --failed --no-legend --plain || true)"
failed_units="$(printf '%s\n' "$failed_output" |
  awk 'NF {count++} END {print count + 0}')"

printf 'Generated at: %s\n' "$generated_at"

printf '\n== Uptime ==\n'
uptime

printf '\n== Root filesystem ==\n'
df -h /

printf '\n== Memory ==\n'
free -h

printf '\n== Top 5 processes by CPU ==\n'
ps -eo pid,user,comm,%cpu,%mem --sort=-%cpu |
  sed -n '1,6p'

printf '\n== Failed systemd units ==\n'
if [[ -n "$failed_output" ]]; then
  printf '%s\n' "$failed_output"
else
  printf 'None\n'
fi

printf '\n== JSON summary ==\n'
jq -cn \
  --arg generated_at "$generated_at" \
  --arg root_disk_used "$root_disk_used" \
  --argjson failed_units "$failed_units" \
  '{generated_at: $generated_at, root_disk_used: $root_disk_used, failed_units: $failed_units}'
