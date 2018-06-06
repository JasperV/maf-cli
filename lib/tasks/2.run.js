'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const clear = require( 'clear' )
const boxen = require( 'boxen' )
const argv = require( 'yargs' ).argv
const hostile = require( 'hostile' )
const ON_DEATH = require( 'death' )
const notifier = require( 'node-notifier' )
const { fork } = require( 'child_process' )
const { promisify } = require( 'util' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

const { readdir, stat } = {
  readdir: promisify( fs.readdir )
, stat: promisify( fs.stat )
}

function server( done ) { runWrapper( done ) }

const sync = !( process.argv.indexOf( `--no-sync` ) !== -1 )
const compile = !( process.argv.indexOf( `--no-compile` ) !== -1 )
const verbose = process.argv.indexOf( `--verbose` ) !== -1

const tasks = []

if ( sync ) tasks.push( `sync` )
if ( compile ) tasks.push( `compile` )

tasks.push( server )

const run = maf.series( tasks )

run.displayName = `run`
run.description = `Run a MAF Development Server to test your App on. ${ansi.yellow( `Default task` )}`
run.flags = {
  '--external': `Share your development environment over the internet.`
, '--http': `Use http in favor of https. Not recommended!`
, '--verbose': `Show additional info`
}

maf.task( run )

async function runWrapper( done ) {

  // clear()

  const meta = getAppMetadata()
  const sdkApps = await getSDKApps()
  const storeConfig = mergeSettings( meta, getStoreConfig(), maf.config, sdkApps )

  let watcher
  if ( compile ) watcher = maf.watch(
    path.resolve( process.cwd(), `./contents/**/*.js` )
  , maf.series( `compile` )
  )

  startServer( storeConfig, meta, _ => {
    if ( watcher ) watcher.close()
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

  const index = apps.map( app => app.toLowerCase() ).indexOf( metadata.identifier.toLowerCase() )

  if ( index !== -1 ) apps.splice( index, 1 )

  if ( !apps.find( app => app.toLowerCase() === metadata.identifier.toLowerCase() ) )
    apps.push( metadata.identifier )

  const merged = Object.assign( Object.assign( {}, cfg ), rc )
  merged.categories = cfg.categories.concat( metadata.categories )
  merged.apps = apps

  return merged
}

function startServer( storeConfig, meta, done ) {
  const server = fork(
    path.resolve( __dirname, '../server' )
  , []
  , { cwd: process.cwd() }
  )

  server.on( `close`, done )

  server.on( `message`, m => {
    if ( m.serverStart ) {
      const server = m.serverStart
      const message = [ ansi.white( ansi.bold( `MAF3 SDK is available at:\n` ) ) ]

      let host = false
      let uri

      hostile.get( false, ( err, lines ) => {
        if ( err ) throw new Error( ansi.red( err ) )

        lines.forEach( line => {
          if ( line[ 0 ] === `127.0.0.1` && line[ 1 ] === `maf` )
            host = true
        } )

        if ( host ) uri = `http${server.secure?`s`:``}://maf:${server.port}`
        else uri = `http${server.secure?`s`:``}://${server.hosts[ 0 ]}:${server.port}`

        message.push( ansi.green( uri ) )

        if ( verbose )
          server.hosts.forEach( host => {
            message.push( `http${server.secure?`s`:``}://${host}:${server.port}` )
          } )

        if ( !host ) message[ 1 ] = ansi.green( message[ 1 ] )

        if ( server.external ) {
          if ( !server.secure )
            server.external = server.external.replace( `https://`, `http://` )
          message.push( ansi.yellow( server.external ) )
        }

        if ( host )
          message.push( `\n ${ansi.bold( `Docs at: https://maf:${server.docsPort}` )}` )
        else
          message.push( `\n ${ansi.bold( `Docs at: https://localhost:${server.docsPort}` )}` )

        console.log(
          boxen( message.join( `\n` ), {
            padding: 1
          , borderColor: 'yellow'
          , borderStyle: 'round'
          , margin: 1
          , float: 'center'
          , align: 'center'
          } )
        )

        notifier.notify( {
          title: `MAF🥉SDK is running`
        , message: uri
        , icon: path.resolve( __dirname, `../resources/logo.png` )
        } )
      } )
    }
  } )

  server.send( {
    meta
  , store: storeConfig
  , start: true
  , secure: !argv.http
  , external: argv.external
  , maf: maf.config
  , global: maf.global
  } )

  ON_DEATH( ( signal, err ) => {
    console.log()
    server.kill( `SIGINT` )
  } )
}
