'use strict'

require( 'dotenv' ).config()

const fs = require( 'fs' )
const path = require( 'path' )
const Liftoff = require( 'liftoff' )
const FormData = require( 'form-data' )
const fetch = require( 'node-fetch' )
const retry = require( 'async-retry' )
const mkdirp = require( 'mkdirp' )
const inquirer = require( 'inquirer' )
const archiver = require( 'archiver' )
const parseAuthor = require( 'parse-author' )
const yargs = require( 'yargs' )
const findRange = require( 'semver-greatest-satisfied-range' )
const { promisify } = require( 'util' )
const { fork } = require( 'child_process' )
const { createInterface } = require( 'readline' )

const cliVersion = require( '../package.json' ).version

const ansi = require( './ansi' )
const exit = require( './exit' )
const tildify = require( './tildify' )
const cliOptions = require( './cli-options' )

const fileType = `utf8`

const { readFile, writeFile, rename, readdir, stat, mkdir, symlink } = {
  readFile: promisify( fs.readFile )
, writeFile: promisify( fs.writeFile )
, rename: promisify( fs.rename )
, readdir: promisify( fs.readdir )
, stat: promisify( fs.stat )
, mkdir: promisify( mkdirp )
, symlink: promisify( fs.symlink )
}

const usage = `\n${ansi.bold( `Usage:` )} maf ${ansi.blue( `[options]` )} tasks`

const parser = yargs.usage( usage, cliOptions )
const opts = parser.argv

const cli = new Liftoff( {
  name: 'maf'
, processTitle: `MAF SDK CLI`
, moduleName: `maf-cli`
, configName: `.mafrc`
, extensions: { '.json': null }
, configFiles: {
    '.mafrc.json': {
      up: {
        path: '.',
        findUp: true
      }
    }
  }
} )






function start( env ) {
  if ( opts.help ) {
    parser.showHelp( console.log )
    exit( 0 )
  }

  try {
    const sdk = require( `${env.configBase}/node_modules/maf3-sdk/package.json` )
  } catch( e ) {
    if ( e.code === `MODULE_NOT_FOUND` ) {
      console.error( ansi.red( `MAF3 SDK not found.` ) )
      console.error( ansi.red( `Please try re-installing maf-cli and watch for
                                errors during installation.` ) )
      process.exit( 1 )
    } else throw e
  }

  if ( opts.version ) {
    console.info( `CLI version`, cliVersion )

    if ( env.modulePackage && typeof env.modulePackage.version !== `undefined` )
      console.info( `Local version`, env.modulePackage.version )

    console.info( `MAF3-SDK version`, sdk.version )
    exit( 0 )
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

  /*
  TODO:

  console.log( env.modulePackage )

  const range = findRange( env.modulePackage.version, ranges )

  if (!range) {
    return log.error(
      ansi.red('Unsupported gulp version', env.modulePackage.version)
    );
  }
  */

console.log( opts )

  require( path.join( __dirname, '/cli' ) )( opts, env )

  // TODO:
  // if ( tasks.includes( `init` ) )
  //   initApp( env )
  // else if ( tasks.includes( `package` ) )
  //   packageApp( env )
  // else if ( tasks.includes( `upload` ) )
  //   uploadApp( env )
  // else if ( tasks.includes( `release` ) )
  //   releaseApp( env )
  // else if ( tasks.includes( `publish` ) )
  //   publishApp( env )
  // else
  //   runSDK( env )
}

















async function initApp( env ) {
  const files = {}
  const res = await fetch( `https://jsonip.metrological.com/?maf=true` )
  const ipData = await res.json()
  const language = ipData.geo.country.toLowerCase()

  files[ `.mafrc.json` ] = JSON.stringify( { language }, null, 2 )

  let pkg = {}
  try { pkg = require( `${env.configBase}/package.json` ) } catch( e ) {}

  const answers = await inquirer.prompt( [
    { name: `name`, message: `App Name:`, default: pkg.name }
  , { name: `version`, message: `App Version:`, default: pkg.version || `1.0.0` }
  , { name: `author`, message: `Author:`, default: parseAuthor( pkg.author || `` ).name }
  , { name: 'company', message: `Company:` }
  , { name: 'description', message: `App Description:`, default: pkg.description }
  , { name: 'categories', message: `App Categories:`, filter: answer => answer.split( /\W+/ ) }
  ] )

  files[ `contents/metadata.json` ] = JSON.stringify(
    {
      identifier: env.configBase.split( `/` ).pop()
    , name: answers.name
    , version: answers.version
    , author: answers.author
    , company: answers.company
    , copyright: answers.company
    , description: answers.description
    , categories: answers.categories
    , scripts: `javascript/init.js`
    , images: { icon: { '192x192': `images/icon.png` } }
    }
  , null
  , 2
  )

  const contents = `${env.configBase}/contents`

  await mkdir( contents )
  await mkdir( `${contents}/fonts` )
  await mkdir( `${contents}/images` )

  fs.createReadStream( path.resolve( __dirname, `../lib/resources/icon.png` ) )
    .pipe( fs.createWriteStream( `${contents}/images/icon.png` ) )
  fs.createReadStream( path.resolve( __dirname, `../lib/resources/icon.psd` ) )
    .pipe( fs.createWriteStream( `${contents}/images/icon.psd` ) )

  await mkdir( `${contents}/Localization` )
  await writeFile( `${contents}/Localization/en-eu.strings`, `// EN`, fileType )
  await writeFile( `${contents}/Localization/${language}-eu.strings`, `// ${language.toUpperCase()}`, fileType )
  await mkdir( `${contents}/javascript` )
  await writeFile( `${contents}/javascript/init.js`, `// init`, fileType )
  await writeFile( `${contents}/javascript/theme.js`, `// theme`, fileType )
  await mkdir( `${contents}/javascript/views` )
  await mkdir( `${contents}/javascript/core` )
  await mkdir( `${contents}/javascript/core` )
  await writeFile( `${contents}/javascript/core/api.js`, `// api`, fileType )

  for ( file in files ) {
    await writeFile(
      `${env.configBase}/${file}`
    , files[ file ]
    , fileType
    )
  }

  process.exit( 0 )
}

function packageApp( env, cb ) {
  const identifier = env.configBase.split( `/` ).pop()
  const zipFile = fs.createWriteStream( `${identifier}.zip` )
  const archive = archiver( `zip`, { zlib: { level: 9 } } )

  archive.on( `error`, err => { throw err } )
  zipFile.on( 'close', function() { if ( cb ) cb( env ) } )

  archive.append( null, { name: `${identifier}/` } )
  archive.append( null, { name: `${identifier}/Contents/` } )
  archive.directory( `./contents`, `${identifier}/Contents/` )
  archive.pipe( zipFile )
  archive.finalize()

  return true
}

async function uploadApp( env ) {
  if ( !process.env.METROLOGICAL_API_KEY ) {
    console.log( 'Uploading requires a Metrological API Key. Get yours at dashboard.metrological.com.' )
    process.exit(1)
  }

  const identifier = env.configBase.split( `/` ).pop()
  const form = new FormData()
  const translationFile = path.resolve( __dirname, `../lib/resources/translation.json` )
  const translations = require( translationFile )

  form.append( `file`, fs.createReadStream( `./${identifier}.zip` ) )

  const res = await fetch( `https://api.metrological.com/api/admin/applications/upload`, {
    method: `POST`
  , headers: { 'x-api-token': process.env.METROLOGICAL_API_KEY }
  , body: form
  } )

  const message = await res.json()

  if ( message.errors ) {
    message.errors.forEach( error => console.error(
      `Error: ${translations.error.upload.submit_errors[ error ]}`
    ) )
    return false
  } else if ( message.success ) {

    const metadata = require( `${env.configBase}/Contents/metadata.json` )

    const status = await retry( async ( bail, attempt ) => {

      const res = await fetch( `https://api.metrological.com/api/admin/applications/upload-status`, {
        method: 'GET'
      , headers: { 'x-api-token': process.env.METROLOGICAL_API_KEY }
      } )

      if ( 403 === res.status ) {
        return bail( new Error( 'Unauthorized' ) )
      }

      const data = await res.json()

      const item = data.find( item =>
        item.params.identifier === identifier &&
        item.params.version === metadata.version &&
        item.status !== 'pending'
      )

      if ( !item ) throw new Error( 'Item still pending' )

      return item
    }, {
      randomize: true
    , minTimeout: 2000
    } )

    console.log(
      status.status
    , status.errors ? status.errors : translations.success.upload.success
    )
  }

  return true
}

async function releaseApp( env ) {
  if ( !process.env.METROLOGICAL_API_KEY ) {
    console.log( 'Releasing requires a Metrological API Key. Get yours at dashboard.metrological.com.' )
    process.exit(1)
  }

  const identifier = env.configBase.split( `/` ).pop()

  const res = await fetch( `https://api.metrological.com/api/admin/applications/release`, {
    method: `POST`
  , headers: {
      'x-api-token': process.env.METROLOGICAL_API_KEY
    , 'content-type': `application/json;charset=utf-8`
    }
  , body: `{"appIds":"${identifier}","skipImageCompression":false}`
  } )

  const messages = await res.json()

  let error = false

  if ( messages.length )
    messages.forEach( message => {
      console.log( `${message.id} ${message.error}` )
      if ( message.error )
        error = true
    } )

  if ( error ) return false

  return true
}

function publishApp( env ) {
  packageApp( env, async function( env ) {
    const upload = await uploadApp( env )
    if ( upload ) {
      await releaseApp( env )
    }
  } )
}

async function runSDK( env ) {
  const mae = {
    ui: `com.metrological.ui.Demo`
  , language: `en`
  , categories: [
      `favorites`
    , `recently`
    , `video`
    , `news`
    , `social`
    , `games`
    , `sport`
    , `lifestyle`
    ]
  , apps: []
  }

  let metadata

  try {
    metadata = require( `${env.configBase}/contents/metadata.json` )
  } catch( e ) {
    if ( e.code === `MODULE_NOT_FOUND` ) {
      console.log( `metadata.json not found in: ${env.cwd}/contents/` )
      process.exit( 1 )
    } else throw e
  }

  const html = './node_modules/maf3-sdk/index.html'
  const config = require( env.configPath )
  const apps = await dirs( path.resolve( env.configBase, `./node_modules/maf3-sdk/apps/` ) )

  const fileRead = fs.createReadStream( path.resolve( __dirname, `../lib/resources/index.html` ) )
  const fileWrite = fs.createWriteStream( path.resolve( env.configBase, html ) )

  fileRead.pipe( fileWrite )

  fileRead.on( 'end', _ => fileWrite.end() )

  const fileEnd = new Promise( function( resolve, reject ) {
    fileRead.on( 'end', _ => resolve( true ) )
    fileRead.on( 'error', reject )
  } )

  await fileEnd

  if ( !apps.find( app => app === metadata.identifier ) )
    apps.push( metadata.identifier )

  const merged = Object.assign( Object.assign( {}, mae ), config )
  merged.categories = mae.categories.concat( metadata.categories )
  merged.apps = apps

  replaceRegexInFile(
    path.resolve( env.configBase, html )
  , /{{MAE}}/gi
  , `var MAE = ${JSON.stringify( merged, null, 2 )}`
  )

  try {
    await symlink(
      env.configBase
    , path.resolve(
        env.configBase
      , `./node_modules/maf3-sdk/apps/${metadata.identifier}`
      )
    , `dir`
    )
  } catch( e ) {
    if ( e.code !== `EEXIST` ) throw e
  }

  fork(
    path.resolve( env.configBase, `./node_modules/maf3-sdk/sdk.js` )
  , []
  , { cwd: env.cwd }
  )
}

async function dirs( root ) {
  const contents = await readdir( root )
  const dirs = await Promise.resolve( contents.filter( async file => {
    const stats = await stat( path.join( root, file ) )
    return stats.isDirectory()
  } ) )
  return dirs.filter( dir => dir.includes( 'com.metrological.app.' ) )
}

async function replaceRegexInFile( file, search, replace ) {
  const contents = await readFile( file, fileType )
  const replaced = contents.replace( search, replace )
  const tmpfile = `${file}.jstmpreplace`

  await writeFile( tmpfile, replaced, fileType )
  await rename( tmpfile, file )
}











module.exports = {
  cli() {
    cli.launch( {}, start )
  }
}
