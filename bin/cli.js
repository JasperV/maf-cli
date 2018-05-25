#!/usr/bin/env node

'use strict'

require( 'please-upgrade-node' )( require( '../package.json' ) )

const sdk = require( '../lib/sdk' )

sdk.cli()

module.exports = sdk.package
