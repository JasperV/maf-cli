#!/bin/sh

# TODO: Windows + Linux support
# https://sdqali.in/blog/2012/06/05/managing-security-certificates-from-the-console---on-windows-mac-os-x-and-linux/

# TODO: make this into a node script to be run with npm

NAME=MAF3SDK
EMAIL=sdksupport@metrological.com
MAC=Darwin
BITSIZE=2048
DAYS=3650
HOST=$(hostname)
LOCALHOST=localhost
ROOTNAME=rootCA
ROOTKEY="$ROOTNAME.key"
ROOTPEM="$ROOTNAME.pem"
SERVERCERTIFICATE="server.csr"
MAFCERTIFICATE="$NAME.crt"
CONFIG=csr.cnf
EXT="v3.ext"
KEYCHAIN="/Library/Keychains/System.keychain"
read IP1 IP2 IP3 IP4 IP5 <<< $(ifconfig | awk '$1 == "inet" {print $2}')

for i in {1..5}; do
  TMP="IP${i}"
  if [[ ! -z "${!TMP// }" ]]; then
    IPSCSR="${IPSCSR},IP:${!TMP}"
    IPSV3="${IPSV3}IP.${i}=${!TMP}"$'\n'
  fi
done

if [ "$(uname)" == $MAC ]; then
  CERT="$(sudo security find-certificate -p -e $EMAIL $KEYCHAIN)"

  if [[ "$CERT" =~ ^"-----BEGIN CERTIFICATE-----".* ]]; then
    sudo security delete-certificate -c $NAME $KEYCHAIN
  fi
fi

# create csr.cnf
cat > $CONFIG << EOL
[req]
default_bits=$BITSIZE
prompt=no
default_md=sha256
distinguished_name=dn

[dn]
C=NL
ST=Zuid-Holland
L=Rotterdam
O=Metrological
OU=$NAME
emailAddress=$EMAIL
CN=$NAME

[req]
req_extensions = v3_req

[v3_req]
subjectAltName=DNS:$HOST$LOCALHOST$IPSCSR
EOL

# create v3.ext configuration file
cat > $EXT << EOL
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,nonRepudiation,keyEncipherment,dataEncipherment
subjectAltName=@alt_names

[alt_names]
DNS.1=$HOST
DNS.2=$LOCALHOST
$IPSV3
EOL

# create CA key
openssl genrsa \
  -out $ROOTKEY \
  $BITSIZE

# create CA cert
openssl req \
  -x509 \
  -new \
  -nodes \
  -key $ROOTKEY \
  -sha256 \
  -days $DAYS \
  -out $ROOTPEM \
  -config $CONFIG

# create server key
openssl req \
  -new \
  -sha256 \
  -nodes \
  -out $SERVERCERTIFICATE \
  -newkey rsa:$BITSIZE \
  -keyout $NAME.key \
  -config $CONFIG

# create server cert
openssl x509 \
  -req \
  -in $SERVERCERTIFICATE \
  -CA $ROOTPEM \
  -CAkey $ROOTKEY \
  -CAcreateserial \
  -out $MAFCERTIFICATE \
  -days $DAYS \
  -sha256 \
  -extfile $EXT

# remove tmp files
rm $ROOTKEY
rm $ROOTPEM
rm rootCA.srl
rm $SERVERCERTIFICATE
rm $CONFIG
rm $EXT

if [ "$(uname)" == $MAC ]; then
  sudo security add-trusted-cert \
    -d \
    -r trustAsRoot \
    -k $KEYCHAIN \
    $MAFCERTIFICATE

  sudo security verify-cert \
    -c $MAFCERTIFICATE
else
  echo "\033[0;33mWindows and Linux are currently not supported by this script."
  echo "Please add the created \"MAF3SDK.crt\" certificate to your trust list manually.\033[0m"
fi

exit 0
