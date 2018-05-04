#!/usr/bin/env node

'use strict'

console.log( require( '../lib/util/ansi' ).red('!!!LINKED INSTANCE!!!' ) )

const sdk = require( '../lib/sdk' )

sdk.cli()

module.exports = sdk.package
