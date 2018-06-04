'use strict'

const fs = require( 'fs' )
const archiver = require( 'archiver' )
const { promisify } = require( 'util' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )
// const compiler = require( '../util/compiler' )

const readDir = promisify( fs.readdir )

// TODO: use spinner with this; https://archiverjs.com/docs/global.html#ProgressData

function zipWrapper( done ) { zip( done ) }

async function zip( done ) {
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

  archive.append( null, { name: `${identifier}/Contents/Localization/` } )

  try {
    const files = await readDir( `${process.cwd()}/contents/localization` )
    files.forEach( file => {
      archive.append(
        `${process.cwd()}/contents/localization/${file}`
      , { name: `${identifier}/Contents/Localization/${file.replace( /[a-z].-([a-z].).strings/gi, function( match,p1 ){ return match.replace( p1, p1.toUpperCase() ) } )}` }
      )
    } )
  } catch( e ) {
    const readError = new Error( ansi.red( e.message ) )
    readError.showStack = false
    throw readError
  }


  archive.pipe( zipFile )
  archive.finalize()
}

const sync = !( process.argv.indexOf( `--no-sync` ) !== -1 )
const compile = !( process.argv.indexOf( `--no-compile` ) !== -1 )

const tasks = []

if ( sync ) tasks.push( `sync` )
if ( compile ) tasks.push( `compile` )

tasks.push( zipWrapper )

const packageIt = maf.series( tasks )

packageIt.description = `Package your MAF App into a zip file ready for uploading to the Metrological Dashboard.`
packageIt.displayName = `package`

maf.task( packageIt )
