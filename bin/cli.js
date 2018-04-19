#!/usr/bin/env node

'use strict'

const sdk = require( '../lib/sdk' )

sdk.cli()

module.exports = sdk.package
