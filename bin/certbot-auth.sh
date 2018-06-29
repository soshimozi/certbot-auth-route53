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
    -f|--folder)
    FOLDER="$2"
    shift # past argument
    shift # past value
    ;;
    -s|--staging)
    STAGING=--staging
    shift # past argument
    ;;
    *)    # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift # past argument
    ;;
esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters


export CERT_DIR=${FOLDER:-"${PWD}/letsencrypt"}
CHECK_DIR="${CERT_DIR}/live/${DOMAIN}-0001"
OPTIONAL=$1

mkdir -p "${CERT_DIR}"

certbot certonly \
 --non-interactive \
 --manual \
 --manual-auth-hook "${PWD}/auth-hook.js" \
 --manual-cleanup-hook "${PWD}/auth-hook.js" \
 --preferred-challenge dns \
 --config-dir "${CERT_DIR}" \
 --work-dir "${CERT_DIR}" \
 --logs-dir "${CERT_DIR}" \
 --agree-tos \
 --email "${EMAIL}" \
 --manual-public-ip-logging-ok \
 --deploy-hook "${PWD}/deploy-hook.js" \
 -d "${DOMAIN}" \
 $STAGING \
 $OPTIONAL \
 "$@"
