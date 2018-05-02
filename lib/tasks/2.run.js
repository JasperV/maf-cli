'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const argv = require( 'yargs' ).argv
const ON_DEATH = require( 'death' )
const { fork } = require( 'child_process' )
const { promisify } = require( 'util' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

const { readdir, stat } = {
  readdir: promisify( fs.readdir )
, stat: promisify( fs.stat )
}

function run( done ) { runWrapper( done ) }

run.description = `Run a MAF Development Server to test your App on.`
run.flags = {
  '--external': `Share your development environment over the internet.` // TODO:
, '--http': `Use http over https. Not recommended.`
}

maf.task( run )

async function runWrapper( done ) {
  const meta = getAppMetadata()
  const sdkApps = await getSDKApps()
  const storeConfig = mergeSettings( meta, getStoreConfig(), maf.config, sdkApps )

  // TODO: enable for live reloading when updated metadata.json or other files
  // const watcher = setupWatcher()

  startServer( storeConfig, meta, done )
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

// function setupWatcher() {
//   const globs = [ `${process.cwd()}/package.json`,
//                   `${process.cwd()}/contents/metadata.json` ]

//   let watcher

//   function pause( done ) {
//     watcher.unwatch( globs )
//     done()
//   }

//   function resume( done ) {
//     setTimeout( _ => {
//       watcher.add( globs )
//       done()
//     }, 1000 ) // Perhaps sync sync task would be better, but for now this works.
//   }

//   const tasks = maf.series( pause, `sync`, resume )

//   watcher = maf.watch( globs, { alwaysStat: true }, tasks )

//   watcher.on('change', function(path, stats) {
//     console.log( stats.mtime )
//     console.log('File ' + path + ' was changed');
//   });

//   // console.log( watcher )

//   return watcher
// }

function startServer( storeConfig, meta, done ) {
  const server = fork(
    path.resolve( __dirname, '../server' )
  , []
  , { cwd: process.cwd() }
  )

  server.on( `close`, done )

  server.on( `message`, m => console.log( m ) )

  server.send( {
    meta
  , storeConfig
  , start: true
  , secure: !argv.http
  } )

  ON_DEATH( ( signal, err ) => {
    console.log()
    server.kill( `SIGINT` )
  } )
}
