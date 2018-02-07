#!/usr/bin/env node


/*
import Liftoff from 'liftoff'
import minimist from 'minimist'
// import { jsVariants } from 'interpret'
import * as metadata from './package.json'
import { inspect } from 'util'

const argv = minimist( process.argv.slice( 2 ) )

const oldLog = console.log // eslint-disable-line no-console

console.log = function log( ...args ) { // eslint-disable-line no-console
  oldLog( inspect( ...args, { depth: 5, colors: true } ) )
}

const MAF = new Liftoff( {
  name: `maf`
, moduleName: 'maf-cli'
, configName: 'package'
, processTitle: `MAF SDK`
, extensions: { '.json': null }
// TODO: completions
, configFiles: {
    'package.json': {
      up: {
        path: '.'
      , findUp: true
      }
    }
  }
} )
  .on( `require`, ( name, module ) => console.log( `Loading: ${name}` ) )
  .on( `requireFail`, ( name, err ) => console.log( `Unable to load: ${name}, ${err}` ) )
  .on( `respawn`, ( flags, child ) => {
    console.log( `Detected node flags: ${flags}` )
    console.log( `Respawned to PID: ${child.pid}` )
  } )

// argv.verbose = true

MAF.launch( {
  cwd: argv.cwd
, configPath: argv.maffile
, require: argv.require
, completion: argv.completion
, verbose: argv.verbose
}, invoke )

function invoke( env ) {

  console.log('my environment is:', env);
  console.log('my cli options are:', argv);
  console.log('my liftoff config is:', this);

  if ( argv.verbose ) {
    console.log( `LIFTOFF SETTINGS:`, this )
    console.log( `CLI OPTIONS:`, argv )
    console.log( `CWD: ${env.cwd}` )
    console.log( `LOCAL MODULES PRELOADED:`, env.require )
    console.log( `SEARCHING FOR: ${env.configNameRegex}` )
    console.log( `FOUND CONFIG AT: ${env.configPath}` )
    console.log( `CONFIG BASE DIR: ${env.configBase}` )
    console.log( `YOUR LOCAL MODULE IS LOCATED: ${env.modulePath}` )
    console.log( `LOCAL PACKAGE.JSON:`, env.modulePackage )
    console.log( `CLI PACKAGE.JSON`, metadata )
  }

  if ( process.cwd() !== env.cwd ) {
    process.chdir( env.cwd )
    console.log( `Working directory changed to ${env.cwd}` )
  }

  if ( !env.modulePath ) {
    console.log( env )
    console.log( `Local ${MAF.moduleName} module not found in: ${env.cwd}` )
    process.exit( 1 )
  }

  if ( env.configPath ) {
    require( env.configPath )
  } else {
    console.log( `No ${Hacker.configName} found.` )
  }
}



#!/usr/bin/env node

import * as packageData from '../package.json'
import appMeta from 'maf-metadata'
import blessed from 'blessed'
import { config } from 'dotenv'
import contrib from 'blessed-contrib'
import createInterface from 'readline'
import { fork } from 'child_process'
import fs from 'fs'
import path from 'path'
import pkg from 'please-upgrade-node'
import { inspect, promisify } from 'util'

pkg( packageData )
config()

const SIGINT = `SIGINT`

const oldLog = console.log // eslint-disable-line no-console

console.log = function log( ...args ) { // eslint-disable-line no-console
  oldLog( inspect( ...args, { depth: 5, colors: true } ) )
}

console.log( appMeta )

const readFile = promisify( fs.readFile )
const writeFile = promisify( fs.writeFile )
const rename = promisify( fs.rename )
const readdir = promisify( fs.readdir )
const stat = promisify( fs.stat )

const screen = blessed.screen( { smartCSR: true } )

screen.title = appMeta.description

const grid = new contrib.grid( { // eslint-disable-line new-cap
  rows: 12
, cols: 12
, screen
} )

const table = grid.set( 0, 6, 6, 6, contrib.table, {
  keys: true
, fg: 'white'
, selectedFg: 'white'
, selectedBg: 'blue'
, interactive: true
, label: 'Application Metadata'
, width: '30%'
, height: '30%'
, border: { type: "line", fg: "cyan" }
, columnSpacing: 10
, columnWidth: [16, 12, 12] }
)

table.focus()

// console.log( Object.keys( appMeta ) )
// console.log( Object.values( appMeta ) )

// table.setData( {
//   headers: Object.keys( appMeta )
// , data: Object.values( appMeta )
// } )

// grid.set(row, col, rowSpan, colSpan, obj, opts)
const log = grid.set( 6, 0, 6, 12, contrib.log, {
  fg: `grey`
, selectedFg: `white`
, label: `Server Log`
, mouse: true
, bufferLength: 300
// TODO: keys, search
} )

log.interactive = true

log.focus()

/* TODO: own module: */

/*
const sdkHTML = '../node_modules/maf3-sdk/index.html'

log.log( path.resolve( __dirname, sdkHTML ) )

// TODO: write metadata.json to disk
// TODO: create symlink to current app in module

async function replaceRegexInFile( file, search, replace ) {
  const type = `utf8`
  const contents = await readFile( file, type )
  const replaced = contents.replace( search, replace )
  const tmpfile = `${file}.jstmpreplace`

  await writeFile( tmpfile, replaced, type )
  await rename( tmpfile, file )

  return true
}

async function dirs( root ) {
  const contents = await readdir( root )

  const filtered = Promise.resolve( contents.filter( async file => {
    const stats = await stat( path.join( root, file ) )
    return stats.isDirectory()
  } ) )

  return filtered
}

fs.createReadStream( path.resolve( __dirname, 'index.html' ) )
  .pipe( fs.createWriteStream( path.resolve( __dirname, sdkHTML ) ) )

async function updateHTML() {
  const apps = await dirs( path.resolve( __dirname, `../node_modules/maf3-sdk/apps/` ) )
  await replaceRegexInFile( path.resolve( __dirname, sdkHTML ), /sdkApps/gi, `'${apps.join( `',\n'` )}',` )
  await replaceRegexInFile( path.resolve( __dirname, sdkHTML ), /currentApp/gi, `'${appMeta.identifier}'` )
}

updateHTML()

const maf = fork( require.resolve( `maf3-sdk` ), [], {
  cwd: process.cwd()
, silent: true
} )

/* */
/*
maf.stdout.on( `data`, data => {
  // console.log( data.toString() )
  log.log( data.toString() )
} )
maf.stderr.on( `data`, data => {
  // console.log( data.toString() )
  log.log( data.toString() )
} )
maf.on( `close`, code => {
  // console.log( code.toString() )
  log.log( code.toString() )
} )

screen.key( [ `escape`, `q`, `C-c` ], ( ch, key ) => {
  maf.kill()
  stop.call( process )
} )

screen.render()

function stop() {
  this.exit( 0 )
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
*/
