#!/bin/sh
set -e

# This script is meant for quick & easy install via:
#   $ curl -L git.io/maf-cli | bash

# NOTE: Make sure to verify the contents of the script
# you downloaded matches the contents of install.sh
# located at https://github.com/JasperV/maf-cli
# before executing.

npm i -g maf-cli
npm i -D maf-cli Metrological/maf3-sdk
touch .mafrc.js
