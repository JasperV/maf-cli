#!/usr/bin/env node

'use strict'

const sdk = require( '../lib/sdk' )

console.log( '!LINKED INSTANCE!' )

sdk.cli()

module.exports = sdk.package
