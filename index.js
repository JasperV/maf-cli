#!/usr/bin/env node

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
