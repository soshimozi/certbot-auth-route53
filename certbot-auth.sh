#!/bin/bash


POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -d|--domain)
    DOMAIN="$2"
    shift # past argument
    shift # past value
    ;;
    -e|--email)
    EMAIL="$2"
    shift # past argument
    shift # past value
    ;;
    *)    # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift # past argument
    ;;
esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

CERT_DIR="${PWD}/letsencrypt"

mkdir -p "${CERT_DIR}"

certbot certonly \
 --non-interactive \
 --manual \
 --manual-auth-hook "${PWD}/auth-hook.sh" \
 --manual-cleanup-hook "${PWD}/auth-hook.sh" \
 --preferred-challenge dns \
 --config-dir "${CERT_DIR}" \
 --work-dir "${CERT_DIR}" \
 --logs-dir "${CERT_DIR}" \
 --agree-tos \
 --email "${EMAIL}" \
 --manual-public-ip-logging-ok \
 -d "${DOMAIN}" \
 "$@"



