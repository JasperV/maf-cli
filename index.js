#!/usr/bin/env node

'use strict'

const isCLI = require.main === module
const wasRequired = !isCLI

if ( !isCLI && wasRequired )
  module.exports = require( './lib/maf.js' )
else if ( isCLI && !wasRequired )
  module.exports = require( './bin/cli.js' )
