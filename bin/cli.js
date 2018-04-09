#!/usr/bin/env node

'use strict'

// const log = require( '../lib/log' )
const sdk = require( '../lib/sdk' )

console.log( 'linked dev instance!' )

sdk.cli()

module.exports = sdk.package
