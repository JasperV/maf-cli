#!/usr/bin/env node

'use strict'

const path = require( 'path' )
const fetch = require( 'node-fetch' )
const writeFile = require( 'util' ).promisify( require( 'fs' ).writeFile )

module.exports = async function() {
  const res = await fetch( `https://dashboard.metrological.com/locales/en/translation.json` )

  return writeFile(
    path.resolve( process.cwd(), `./node_modules/maf-cli/lib/resources/translation.json` )
  , JSON.stringify( await res.json(), null, 2 )
  )
}
