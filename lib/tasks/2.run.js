'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const argv = require( 'yargs' ).argv
const ON_DEATH = require( 'death' )
const { fork } = require( 'child_process' )
const { promisify } = require( 'util' )
const { createInterface } = require( 'readline' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

const { readFile, writeFile, rename, readdir, stat, symlink } = {
  readFile: promisify( fs.readFile )
, writeFile: promisify( fs.writeFile )
, rename: promisify( fs.rename )
, readdir: promisify( fs.readdir )
, stat: promisify( fs.stat )
, symlink: promisify( fs.symlink )
}

function run( done ) { runWrapper( done ) }

run.description = `Run a MAF Development Server to test your App on.`
run.flags = { '--external': `Share your development environment over the internet.` }

maf.task( run )

async function runWrapper( done ) {
  const rc = maf.config
  const cfg = getStoreConfig()
  const meta = getAppMetadata()
  const sdkApps = await getSDKApps()
  const storeConfig = mergeSettings( meta, cfg, rc, sdkApps )
  const html = path.resolve( process.cwd(), `./node_modules/maf3-sdk/index.html` )

  await copyHtmlFile( html )
  updateHtmlConfig( html, storeConfig )

  createProjectSymlink( meta.identifier )

  const watcher = maf.watch(
    [ `${process.cwd()}/package.json`, `${process.cwd()}/contents/metadata.json` ]
  , maf.series( `sync` )
  )

  startServer( _ => {
    watcher.close()
    done()
  } )
}

function getStoreConfig() {
  return {
    ui: `com.metrological.ui.Demo`
  , language: `en`
  , categories: [ `favorites`, `recently`, `video`, `news`, `social`, `games`,
                  `sport`, `lifestyle` ]
  , apps: []
  }
}

function getAppMetadata() {
  let metadata

  try {
    metadata = require( `${process.cwd()}/contents/metadata.json` )
  } catch( e ) {
    if ( e.code === `MODULE_NOT_FOUND` ) {
      const moduleError = new Error( `metadata.json not found in: ${env.cwd}/contents/` )
      moduleError.showStack = false
      throw moduleError
    } else throw e
  }

  return metadata
}

async function getSDKApps() {
  return await dirs( path.resolve( process.cwd(), `./node_modules/maf3-sdk/apps/` ) )
}

async function dirs( root ) {
  const contents = await readdir( root )

  const dirs = await Promise.resolve( contents.filter( async file => {
    const stats = await stat( path.join( root, file ) )
    return stats.isDirectory()
  } ) )

  return dirs.filter( dir => dir.includes( 'com.metrological.app.' ) )
}

function mergeSettings( metadata, cfg, rc, apps ) {
  if ( !apps.find( app => app === metadata.identifier ) )
    apps.push( metadata.identifier )

  const merged = Object.assign( Object.assign( {}, cfg ), rc )
  merged.categories = cfg.categories.concat( metadata.categories )
  merged.apps = apps

  return merged
}

function copyHtmlFile( htmlFile ) {
  const fileRead = fs.createReadStream( path.resolve( __dirname, `../resources/index.html` ) )
  const fileWrite = fs.createWriteStream( htmlFile )

  fileRead.pipe( fileWrite )
  fileRead.on( 'end', _ => fileWrite.end() )

  return new Promise( function( resolve, reject ) {
    fileRead.on( 'end', _ => resolve( true ) )
    fileRead.on( 'error', reject )
  } )
}

function updateHtmlConfig( htmlFile, config ) {
  replaceRegexInFile(
    path.resolve( process.cwd(), htmlFile )
  , /{{MAE}}/gi
  , `var MAE = ${JSON.stringify( config, null, 2 )}`
  )
}

async function replaceRegexInFile( file, search, replace ) {
  const fileType = `utf8`
  const contents = await readFile( file, fileType )
  const replaced = contents.replace( search, replace )
  const tmpfile = `${file}.jstmpreplace`

  await writeFile( tmpfile, replaced, fileType )
  await rename( tmpfile, file )
}

async function createProjectSymlink( identifier ) {
  try {
    await symlink(
      process.cwd()
    , path.resolve( process.cwd(), `./node_modules/maf3-sdk/apps/${identifier}` )
    , `dir`
    )
  } catch( e ) { if ( e.code !== `EEXIST` ) throw e }
}

function startServer( done ) {
  const server = fork(
    path.resolve( process.cwd(), `./node_modules/maf3-sdk/sdk.js` )
  , []
  , { cwd: path.resolve( process.cwd(), `./node_modules/maf3-sdk/` ) }
  )

  server.on( `close`, done )

  ON_DEATH( ( signal, err ) => {
    console.log()
    server.kill( `SIGINT` )
  } )
}
