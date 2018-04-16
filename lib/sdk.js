'use strict'

require( 'dotenv' ).config()

const path = require( 'path' )
const Liftoff = require( 'liftoff' )
const yargs = require( 'yargs' )

const ansi = require( './util/ansi' )
const exit = require( './util/exit' )
const tildify = require( './util/tildify' )
const cliOptions = require( './cli-options' )

const usage = `\n${ansi.bold( `Usage:` )} maf ${ansi.blue( `[options]` )} tasks`
const parser = yargs.usage( usage, cliOptions )
const opts = parser.argv

const cli = new Liftoff( {
  name: 'maf'
, processTitle: `MAF SDK CLI`
, moduleName: `maf-cli`
, configName: `.mafrc`
, extensions: { '.js': null }
, configFiles: {
    '.mafrc.js': {
      up: {
        path: '.',
        findUp: true
      }
    }
  }
} )

function start( env ) {
  let sdk
  const identifier = process.cwd().split( `/` ).pop()

  if ( opts.help ) {
    parser.showHelp( console.log )
    exit( 0 )
  }

  if ( opts.version ) {
    console.info( `Global version`, require( '../package.json' ).version )

    if ( env.modulePackage && typeof env.modulePackage.version !== `undefined` )
      console.info( `Local version`, env.modulePackage.version )

    console.info( `MAF3-SDK version`, sdk.version )
    exit( 0 )
  }

  if ( identifier !== identifier.toLowerCase() ) {
    console.error( ansi.red( `Your project folder name,` ), ansi.blue( identifier ), ansi.red( `is not lowercase.` ) )
    console.error( ansi.red( `Please convert your project folder (and identifier) to lowercase.` ) )
    process.exit( 1 )
  }

  try {
    sdk = require( `${env.configBase}/node_modules/maf3-sdk/package.json` )
  } catch( e ) {
    if ( e.code === `MODULE_NOT_FOUND` ) {
      console.error( ansi.red( `MAF3 SDK not found.` ) )
      console.error( ansi.red( `Please try re-installing maf-cli and watch for errors during installation.` ) )
      process.exit( 1 )
    } else throw e
  }

  if ( !env.modulePath ) {
    console.error(
      ansi.red( `Local ${this.moduleName} module not found in:` )
    , ansi.magenta( tildify( env.cwd ) )
    )

    console.error( ansi.red( `Try running: npm install maf-cli` ) )
    exit( 1 )
  }

  if ( !env.configPath ) {
    console.error( ansi.red( `No ${this.configName} found.` ) )
    exit( 1 )
  }

  if ( process.cwd() !== env.cwd ) {
    process.chdir( env.cwd )

    console.info(
      `Working directory changed to`
    , ansi.magenta( tildify( env.cwd ) )
    )
  }

  require( path.join( __dirname, '/cli' ) )( opts, env )
}

module.exports = { cli() { cli.launch( {}, start ) } }
