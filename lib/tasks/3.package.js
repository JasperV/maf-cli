'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const archiver = require( 'archiver' )
const storage = require( 'node-persist' )
const { promisify } = require( 'util' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )
const getSpinner = require( '../util/spinner' )

const readDir = promisify( fs.readdir )

function zip( done ) { zipWrapper( done ) }

async function zipWrapper( done ) {
  const identifier = process.cwd().split( `/` ).pop()
  const zipFile = fs.createWriteStream( `${identifier}.zip` )
  const archive = archiver( `zip`, { zlib: { level: 9 } } )
  const spinner = getSpinner( `Creating zip archive` ).start()

  let totalEntries

  archive.on( `error`, err => {
    const zipError = new Error( `Creating zipfile failed. ${err.message}` )
    zipError.showStack = false

    throw zipError
  } )

  archive.on( `warning`, function( err ) {
    if ( err.code === `ENOENT` ) console.log( err )
    else throw err
  } )

  archive.on( `progress`, data => {
    totalEntries = data.entries.total
    spinner.text = `${data.entries.total} files added to archive`
  } )
  archive.on( `entry`, data => spinner.text = `${data.name} added to archive` )

  zipFile.on( `close`, _ => {
    spinner.succeed( `${totalEntries} files added to zip archive` )
    done()
  } )

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

tasks.push( zip )

const packageIt = maf.series( tasks )

packageIt.description = `Package your MAF App into a zip file ready for uploading to the Metrological Dashboard.`
packageIt.displayName = `package`

maf.task( packageIt )
