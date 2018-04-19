#!/bin/sh
set -e

# This script is meant for quick & easy install via:
#   $ curl -o- -L https:// | bash
#
# NOTE: Make sure to verify the contents of the script
#       you downloaded matches the contents of install.sh
#       located at https://github.com/jasperv/maf-cli
#       before executing.
#

npm i -g maf-cli
touch .mafrc.js
maf init
maf --tasks
