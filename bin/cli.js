#!/usr/bin/env node

'use strict'

// TODO: remove before publish
console.log( require( '../lib/util/ansi' ).red.bold('!!!LINKED INSTANCE!!!' ) )

const sdk = require( '../lib/sdk' )

sdk.cli()

module.exports = sdk.package
