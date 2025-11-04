#!/bin/bash

set -euo pipefail

# Usage: ./crypt-env.sh <encrypt|decrypt> <password> [input] [output]
# Defaults:
#   encrypt: in=.env, out=env.encrypted
#   decrypt: in=env.encrypted, out=.env

MODE=${1:-}
PASS=${2:-}
INFILE=${3:-}
OUTFILE=${4:-}

usage() {
  echo "사용법: ./crypt-env.sh <encrypt|decrypt> <암호화 키> [입력파일] [출력파일]" >&2
  echo "예시: ./crypt-env.sh encrypt mySecret" >&2
  echo "      ./crypt-env.sh decrypt mySecret" >&2
}

if [[ -z "$MODE" || -z "$PASS" ]]; then
  usage
  exit 1
fi

case "$MODE" in
  encrypt)
    INFILE=${INFILE:-.env}
    OUTFILE=${OUTFILE:-env.encrypted}
    ;;
  decrypt)
    INFILE=${INFILE:-env.encrypted}
    OUTFILE=${OUTFILE:-.env}
    ;;
  *)
    echo "오류: 첫 번째 인자는 encrypt 또는 decrypt 여야 합니다." >&2
    usage
    exit 1
    ;;
esac

if [[ ! -f "$INFILE" ]]; then
  echo "오류: 입력 파일이 존재하지 않습니다: $INFILE" >&2
  exit 1
fi

# Avoid accidental overwrite without confirmation when OUTFILE exists (except same file)
if [[ -f "$OUTFILE" && "$INFILE" != "$OUTFILE" ]]; then
  read -r -p "경고: $OUTFILE 파일이 이미 존재합니다. 덮어쓸까요? [y/N] " ans
  if [[ ! "$ans" =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 1
  fi
fi

if [[ "$MODE" == "encrypt" ]]; then
  openssl aes-256-cbc -salt -pbkdf2 -e -in "$INFILE" -out "$OUTFILE" -k "$PASS"
  echo "암호화 완료: $INFILE -> $OUTFILE"
else
  # Decrypt to temp then move to avoid partial writes
  TMP_FILE="${OUTFILE}.tmp.$$"
  trap 'rm -f "$TMP_FILE"' EXIT
  if openssl aes-256-cbc -d -pbkdf2 -in "$INFILE" -out "$TMP_FILE" -k "$PASS"; then
    mv "$TMP_FILE" "$OUTFILE"
    trap - EXIT
    echo "복호화 완료: $INFILE -> $OUTFILE"
  else
    echo "복호화 실패: 비밀번호 또는 파일을 확인하세요." >&2
    exit 1
  fi
fi
