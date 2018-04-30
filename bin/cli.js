#!/usr/bin/env node

'use strict'

const sdk = require( '../lib/sdk' )

console.log( 'linked instance!' )

sdk.cli()

module.exports = sdk.package
