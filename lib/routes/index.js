'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const express = require( 'express' )
const router = express.Router()

const maf = fs.readFileSync( path.resolve( process.cwd(), `./node_modules/maf3-sdk/lib/maf-sdk.js` ) )

function setIndex( storeConfig ) {
  router.get( `/`, ( req, res ) => {
    res.end( `<html>
    <head>
      <title>MAF🥉SDK</title>
      <meta charset="utf-8">
      <meta name="viewport" content="height=device-height,initial-scale=1.0,maximum-scale=1.0,user-scalable=0">
      <link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiBAMAAADIaRbxAAAAMFBMVEX///9ZWFexsLDNzc3z8/OBgIBBQD82NTQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABU0T28AAAAAXRSTlMAQObYZgAAAMxJREFUeNpjYKAxUHRgcFSAMJkg1DcVFrUPKCJavLpcBii6WMTLRRhQ1PzR+qWDZjRLCIzFCCKchP8cYGBw+fvuAEgOpFNVgEENJPMaJmIiMIvFgYFhD1u8wQWIiOKb9wyrgTTzR4ULELsOvIWY+ffDAajtAReg1lwIQLgHCgSgIgICSAJoavCIQMMBQjMhCSBY4gFQRjjMCnERWCAJQP0l4PXwgiDDe2YdtZUfICL32FRVgWbwM/57APIdEP97dUKRg4H9w+K3LxjoCwBNejDuc5UqcAAAAABJRU5ErkJggg==" rel="icon" type="image/x-icon" />
      <script>
        var MAE = ${JSON.stringify( storeConfig, null, 2 )}
      </script>
      <script src="maf.js"></script>
    </head>
    <body style="overflow:hidden;"></body>
  </html>` )
  } )
}

function setMAF() {
  router.get( `/maf.js`, ( req, res ) => res.end( maf ) )
}

function setLicense() {
  const license = fs.readFileSync( path.resolve( process.cwd(), `./node_modules/maf3-sdk/LICENSE` ) )
  router.get( `/LICENSE`, ( req, res ) => res.end( license ) )
}

function setLinter() {
  router.get( `/lint/:identifier`, ( req, res ) => res.end( `Ok` ) )
}

function setApp( meta ) {
  router.get( `/apps/${meta.identifier}/Contents/${meta.scripts}`, ( req, res ) => {
    res.end( meta.identifier )

    // TODO: get compiled app code here

  } )

  router.use( `/apps/${meta.identifier}`, express.static( process.cwd() ) )
}

function setSrc() {
  router.use( `/src`, express.static( path.resolve( process.cwd(), `./node_modules/maf3-sdk/src/` ) ) )
}

function setApps() {
  router.use( `/apps`, express.static( path.resolve( process.cwd(), `./node_modules/maf3-sdk/apps/` ) ) )
}

function setDocs() {
  // TODO: fix this - e.g. local cache and proper routes for all files
  app.use( `/docs`, express.static( path.resolve( process.cwd(), `./node_modules/maf3-sdk/docs/` ) ) )
  app.use( express.static( path.resolve( process.cwd(), `./node_modules/maf3-sdk/docs/` ) ) )
}

module.exports = function( storeConfig, meta ) {
  setIndex( storeConfig )
  setMAF()
  setLicense()
  setLinter()
  setApp( meta )
  setSrc()
  setApps()
  // setDocs()
  return router
}


