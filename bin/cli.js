#!/usr/bin/env node

const log = require( '../lib/log' )
const Liftoff = require( 'liftoff' )
const fetch = require( 'node-fetch' )
const mkdirp = require( 'mkdirp' )
const inquirer = require( 'inquirer' )
const archiver = require( 'archiver' )
const FormData = require( 'form-data' )
const parseAuthor = require( 'parse-author' )
const argv = require( 'minimist' )( process.argv.slice( 2 ) )
const fs = require( 'fs' )
const path = require( 'path' )
const { promisify } = require( 'util' )
const { fork } = require( 'child_process' )
const { createInterface } = require( 'readline' )

require( 'please-upgrade-node' )( require( '../package.json' ) )
require( 'dotenv' ).config()

const fileType = `utf8`
const SIGINT = `SIGINT`

// TODO: all path resolve or similar

const {
  readFile
, writeFile
, rename
, readdir
, stat
, mkdir
, symlink
} = {
  readFile: promisify( fs.readFile )
, writeFile: promisify( fs.writeFile )
, rename: promisify( fs.rename )
, readdir: promisify( fs.readdir )
, stat: promisify( fs.stat )
, mkdir: promisify( mkdirp )
, symlink: promisify( fs.symlink )
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

  const tasks = argv._

  if ( tasks.includes( `init` ) )
    initApp( env )
  else if ( tasks.includes( `package` ) )
    packageApp( env )
  else if ( tasks.includes( `upload` ) )
    uploadApp( env )
  else if ( tasks.includes( `release` ) )
    releaseApp( env )
  else if ( tasks.includes( `publish` ) )
    publishApp( env )
  else
    runSDK( env )
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

  files[ `Contents/metadata.json` ] = JSON.stringify(
    {
      identifier: env.configBase.split( `/` ).pop()
    , name: answers.name
    , version: answers.version
    , author: answers.author
    , company: answers.company
    , copyright: answers.company
    , description: answers.description
    , categories: answers.categories
    , scripts: `JavaScript/init.js`
    , images: { icon: { '192x192': `Images/icon.png` } }
    }
  , null
  , 2
  )

  const contents = `${env.configBase}/Contents`

  await mkdir( contents )
  await mkdir( `${contents}/Fonts` )
  await mkdir( `${contents}/Images` )

  fs.createReadStream( path.resolve( __dirname, `../lib/icon.png` ) )
    .pipe( fs.createWriteStream( `${contents}/Images/icon.png` ) )
  fs.createReadStream( path.resolve( __dirname, `../lib/icon.psd` ) )
    .pipe( fs.createWriteStream( `${contents}/Images/icon.psd` ) )

  await mkdir( `${contents}/Localization` )
  await writeFile( `${contents}/Localization/en-EU.strings`, `// EN`, fileType )
  await writeFile( `${contents}/Localization/${language}-EU.strings`, `// ${language.toUpperCase()}`, fileType )
  await mkdir( `${contents}/JavaScript` )
  await writeFile( `${contents}/JavaScript/init.js`, `// init`, fileType )
  await writeFile( `${contents}/JavaScript/theme.js`, `// theme`, fileType )
  await mkdir( `${contents}/JavaScript/Views` )
  await mkdir( `${contents}/JavaScript/Core` )
  await mkdir( `${contents}/JavaScript/Core` )
  await writeFile( `${contents}/JavaScript/Core/api.js`, `// api`, fileType )

  for ( file in files ) {
    await writeFile(
      `${env.configBase}/${file}`
    , files[ file ]
    , fileType
    )
  }

  process.exit( 0 )
}

function packageApp( env ) {
  const identifier = env.configBase.split( `/` ).pop()
  const archive = archiver( `zip`, { zlib: { level: 9 } } )

  archive.append( null, { name: `${identifier}/` } )
  archive.append( null, { name: `${identifier}/Contents/` } )
  archive.directory( `./Contents`, `${identifier}/Contents/` )
  archive.pipe( fs.createWriteStream( `${identifier}.zip` ) )
  archive.finalize()
}

async function uploadApp( env ) {
  const identifier = env.configBase.split( `/` ).pop()
  const form = new FormData()
  const translationFile = path.resolve( __dirname, `../lib/translation.json` )
  const translations = require( translationFile )

  form.append( `file`, fs.createReadStream( `./${identifier}.zip` ) )

  const res = await fetch( `https://api.metrological.com/api/admin/applications/upload`, {
    method: `POST`
  , headers: { 'x-api-token': process.env.METROLOGICAL_API_KEY }
  , body: form
  } )

  const message = await res.json()

  if ( message.errors )
    message.errors.forEach( error => console.error(
      `Error: ${translations.error.upload.submit_errors[ error ]}`
    ) )
  else if ( message.success )
    console.log(
      `Success: ${translations.success.upload.success}`
    )
}

function releaseApp( env ) {

  /* release

  // const res = await fetch( `https://api.metrological.com/api/admin/applications/upload`, {
    //   method: `POST`
    // , headers: { 'x-api-token': process.env.METROLOGICAL_API_KEY }
    // , body: form
    // } )

  curl "https://api.metrological.com/api/admin/applications/release" \
      -H "X-API-Token: 8605068c9545f6a25e64b634000bea6023a140850ffe561e8417614d6150eca3" \
      -H "Content-Type: application/json;charset=UTF-8" \
      --data-binary "{\"appIds\":\"$1\",\"skipImageCompression\":false}"
  */

}

function publishApp( env ) {
  packageApp( env )
  uploadApp( env )
  releaseApp( env )
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
    metadata = require( `${env.configBase}/Contents/metadata.json` )
  } catch( e ) {
    if ( e.code === `MODULE_NOT_FOUND` ) {
      console.log( `metadata.json not found in: ${env.cwd}` )
      process.exit( 1 )
    } else {
      throw e
    }
  }

  const html = '../node_modules/maf3-sdk/index.html'
  const config = require( env.configPath )
  const apps = await dirs( path.resolve( __dirname, `../node_modules/maf3-sdk/apps/` ) )

  fs.createReadStream( path.resolve( __dirname, `../lib/index.html` ) )
    .pipe( fs.createWriteStream( path.resolve( __dirname, html ) ) )

  apps.push( metadata.identifier )

  const merged = Object.assign( Object.assign( {}, mae ), config )
  merged.categories = mae.categories.concat( metadata.categories )
  merged.apps = apps

  await replaceRegexInFile(
    path.resolve( __dirname, html )
  , /{{MAE}}/gi
  , `var MAE = ${JSON.stringify( merged, null, 2 )}`
  )

  try {
    await symlink( env.configBase, path.resolve( __dirname, `../node_modules/maf3-sdk/apps/${metadata.identifier}` ), `dir` )
  } catch( e ) {
    if ( e.code !== `EEXIST` ) throw e
  }

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

async function replaceRegexInFile( file, search, replace ) {

  const contents = await readFile( file, fileType )
  const replaced = contents.replace( search, replace )
  const tmpfile = `${file}.jstmpreplace`

  await writeFile( tmpfile, replaced, fileType )
  await rename( tmpfile, file )

  return true
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