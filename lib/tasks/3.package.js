'use strict'

const fs = require( 'fs' )
const archiver = require( 'archiver' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )
// const compiler = require( '../util/compiler' )

function zip( done ) {
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

  // TODO: remove all includes and only add compiled file, with pretty print option
  // when asyncing the zip function be sure to validate process in publish...
  // if ( maf.config.es6 ) {
  //   const meta = require( process.cwd() + '/contents/metadata.json' )
  //   const result = await compiler( meta.scripts, maf.config )
  //   // TODO: throw messages if they exist, here or in compiler? goes for all instances... how to handle this gracefully... e.g. render the messages to screen
  //   archive.append( result.code, { name: `${identifier}/Contents/${meta.scripts}` } )
  // }

  archive.pipe( zipFile )
  archive.finalize()
}

const sync = !( process.argv.indexOf( `--no-sync` ) !== -1 )

const tasks = []

if ( sync ) tasks.push( `sync` )

tasks.push( zip )

const packageIt = maf.series( tasks )

packageIt.description = `Package your MAF App into a zip file ready for uploading to the Metrological Dashboard.`
packageIt.displayName = `package`

maf.task( packageIt )
