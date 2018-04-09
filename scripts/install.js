#!/usr/bin/env node

'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const fetch = require( 'node-fetch' )
const { promisify } = require( 'util' )

const writeFile = promisify( fs.writeFile )

async function getTranslation() {
  const res = await fetch( `https://dashboard.metrological.com/locales/en/translation.json` )
  const translation = await res.json()
  writeFile( path.resolve( `../`, `lib/resources/translation.json` ), JSON.stringify( translation, null, 2 ) )
}

getTranslation()
