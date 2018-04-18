#!/usr/bin/env node

'use strict'

const sdk = require( '../lib/sdk' )

// TODO: remove before release
console.log( 'linked dev instance!' )

sdk.cli()

module.exports = sdk.package
