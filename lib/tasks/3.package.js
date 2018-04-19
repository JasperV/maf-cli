'use strict'

const fs = require( 'fs' )
const archiver = require( 'archiver' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

function packageApp( done ) {
  const identifier = process.cwd().split( `/` ).pop()
  const zipFile = fs.createWriteStream( `${identifier}.zip` )
  const archive = archiver( `zip`, { zlib: { level: 9 } } )

  archive.on( `error`, err => {
    const zipError = new Error( `Creating zipfile failed. ${err.message}` )
    zipError.showStack = false

    throw zipError
  } )

  zipFile.on( `close`, function() { done() } )

  archive.append( null, { name: `${identifier}/` } )
  archive.append( null, { name: `${identifier}/Contents/` } )
  archive.directory( `${process.cwd()}/contents`, `${identifier}/Contents/` )
  archive.pipe( zipFile )
  archive.finalize()
}

packageApp.description = `Package your MAF App into a zip file ready for uploading to the Metrological Dashboard.`
packageApp.displayName = `package`

maf.task( packageApp )
