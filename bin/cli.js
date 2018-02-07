#!/usr/bin/env node

const pkg = require( '../package.json' )
const log = require( '../lib/log' )
const Liftoff = require( 'liftoff' )
const argv = require( 'minimist' )( process.argv.slice( 2 ) )
const fs = require( 'fs' )
const path = require( 'path' )
const { promisify } = require( 'util' )
const { fork } = require( 'child_process' )
const { createInterface } = require( 'readline' )

require( 'please-upgrade-node' )( pkg )

const SIGINT = `SIGINT`

process.env.INIT_CWD = process.cwd()

const {
  readFile
, writeFile
, rename
, readdir
, stat
} = {
  readFile: promisify( fs.readFile )
, writeFile: promisify( fs.writeFile )
, rename: promisify( fs.rename )
, readdir: promisify( fs.readdir )
, stat: promisify( fs.stat )
}

const cli = new Liftoff( {
  processTitle: `MAF SDK CLI`
, moduleName: `maf-cli`
, configName: `.mafrc`
} )

cli.launch( { cwd: argv.cwd }, start )

function start( env ) {
  if ( process.cwd() !== env.cwd ) {
    process.chdir( env.cwd )
    console.log( `Working directory changed to ${env.cwd}` )
  }

  if ( !env.modulePath ) {
    console.log( `Local ${this.moduleName} module not found in: ${env.cwd}` )
    process.exit( 1 )
  }

  if ( env.configPath ) {
    require( env.configPath )
  } else {
    console.log( `No ${this.configName} found.` )
  }

  runSDK( env )
}

async function runSDK( env ) {
  console.log( env.configPath )

  const mae = {
      ui: 'com.metrological.ui.Demo'
    , language: 'en'
    , poster: true
    , categories: [
        'favorites'
      , 'recently'
      , 'video'
      , 'news'
      , 'social'
      , 'games'
      , 'sport'
      , 'lifestyle'
      ]
    , apps: []
    }

  const sdkHTML = '../node_modules/maf3-sdk/index.html'
  const metadataPath = `${env.configBase}/metadata.json`
  const metadata = require( metadataPath )
  const config = require( env.configPath )
  const sdkApps = await dirs( path.resolve( __dirname, `../node_modules/maf3-sdk/apps/` ) )

  fs.createReadStream( path.resolve( __dirname, `../lib/index.html` ) )
    .pipe( fs.createWriteStream( path.resolve( __dirname, sdkHTML ) ) )

  console.log( sdkApps )
  console.log( config )
  console.log( mae )
  console.log( metadata )

  // merge configs
  // replace config in html

  fork( require.resolve( `maf3-sdk` ), [], { cwd: process.cwd() } )
}

async function dirs( root ) {
  const contents = await readdir( root )
  const dirs = await Promise.resolve( contents.filter( async file => {
    const stats = await stat( path.join( root, file ) )
    return stats.isDirectory()
  } ) )
  return dirs.filter( dir => dir.includes( 'com.metrological.app.' ) )
}

function stop( code ) {
  this.exit( code || 0 )
}

process.once( SIGINT, stop )
process.once( `SIGTERM`, stop )
process.once( `SIGUSR2`, _ => process.kill( process.pid, `SIGUSR2` ) )

if ( process.platform === `win32` ) {
  createInterface( {
    input: process.stdin
  , output: process.stdout
  } ).on( SIGINT, _ => process.emit( SIGINT ) )
}
