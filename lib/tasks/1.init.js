'use strict'

// TODO: add basic main view, add basic theme file

const fs = require( 'fs' )
const path = require( 'path' )
const fetch = require( 'node-fetch' )
const mkdirp = require( 'mkdirp-promise' )
const inquirer = require( 'inquirer' )
const parseAuthor = require( 'parse-author' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

const { promisify } = require( 'util' )

const { writeFile, access } = {
  writeFile: promisify( fs.writeFile )
, access: promisify( fs.access )
}

async function init( done ) {
  const path = `${process.cwd()}/contents`

  // TODO:
  /*
  npm init
  git init
  npm i -D maf-cli
  */

  const language = await getLanguageFromIP()
  const pkg = await getPackageData()
  const answers = await getAnswers( pkg )
  const metadata = createMetadata( answers )

  await createDirs( getDirs( path ) )
  await createFiles( getFiles( {
    path
  , language
  , metadata
  , apikey: answers.apikey
  } ) )
  copyFiles( path ) // TODO: make await as well

  done()
}

init.description = `Initialize a new MAF project. ${ansi.gray( `Runs` )} ${ansi.yellow( `npm init` )} and ${ansi.yellow( `git init` )} and installs the CLI locally.`
init.flags = {
  '--test': `test`
}

maf.task( 'init', init )

function getLanguageFromIP() {
  return new Promise( async ( resolve, reject ) => {
    const res = await fetch( `https://jsonip.metrological.com/?maf=true` )
    const ipData = await res.json()

    if ( ipData && ipData.geo && ipData.geo.country )
      resolve( ipData.geo.country.toLowerCase() )
    else
      reject( new Error( 'Could not get language.' ) )
  } )
}

function getPackageData() {
  return new Promise( ( resolve, reject ) => {
    try {
      resolve( require( `${process.cwd()}/package.json` ) )
    } catch( e ) {
      reject( 'Could not load project package.json.' )
    }
  } )
}

function getAnswers( pkg ) {
  return inquirer.prompt( [
    { name: `name`, message: `App Name:`, default: pkg.name }
  , { name: `version`, message: `App Version:`, default: pkg.version || `1.0.0` }
  , { name: `author`, message: `Author:`, default: parseAuthor( pkg.author || `` ).name }
  , { name: `company`, message: `Company:` }
  , { name: `description`, message: `App Description:`, default: pkg.description }
  , { name: `categories`, message: `App Categories:`, filter: answer => answer.split( /\W+/ ) }
  , { name: `apikey`, message: `Metrological API Key:` }
  ] )
}

function createMetadata( answers ) {
  return JSON.stringify( {
    identifier: process.cwd().split( `/` ).pop()
  , name: answers.name
  , version: answers.version
  , author: answers.author
  , company: answers.company
  , copyright: answers.company
  , description: answers.description
  , categories: answers.categories
  , scripts: `javascript/init.js`
  , images: { icon: { '192x192': `images/icon.png` } }
  }, null, 2 )
}

function getDirs( path ) {
  return [
      `${path}/fonts`
    , `${path}/images`
    , `${path}/Localization`
    , `${path}/javascript/views`
    , `${path}/javascript/core`
  ]
}

function createDirs( dirs ) {
  return Promise.all( dirs.map( async dir => await mkdirp( dir ) ) )
}

function getFiles( opts ) {
  return {
    [ `${opts.path}/Localization/en-eu.strings` ]: `// EN`
  , [ `${opts.path}/javascript/theme.js` ]: `// theme`
  , [ `${opts.path}/javascript/core/api.js` ]: `// api`
  , [ `${opts.path}/javascript/views/main.js` ]: `// init`
  , [ `${opts.path}/metadata.json` ]: opts.metadata
  , [ `${opts.path}/Localization/${opts.language}-eu.strings` ]: `// ${opts.language.toUpperCase()}`
  , [ `${process.cwd()}/.env` ]: `METROLOGICAL_API_KEY="${opts.apikey}"`
  , [ `${process.cwd()}/.gitignore` ]: `.env
*.zip`
  , [ `${process.cwd()}/.mafrc.js` ]: `const maf = require( 'maf-cli' )

module.exports = {
  language: '${opts.language}'
, lint: false
}`
  , [ `${process.cwd()}/.editorconfig` ]: `[contents/*.js]
indent_style = space
indent_size = tab
tab_width = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 80`
  , [ `${opts.path}/javascript/init.js` ]: `// init
include( 'javascript/theme.js' )
include( 'javascript/core/api.js' )
include( 'javascript/views/main.js' )

MAF.application.init( {
  views: [
    { id: 'MAIN', viewClass: Main }
  , { id: 'ABOUT', viewClass: MAF.views.AboutBox } // Use standard About view
  ]
, defaultViewId: 'MAIN'
, settingsViewId: 'ABOUT'
} )`
  }
}

function createFiles( files ) {
  const options = { encoding: `utf8`/*, flag: `wx`*/ }

  return Promise.all( Object.entries( files ).map(
    async ( [ name, contents ] ) => {
      try {
        await writeFile( name, contents, options )
      } catch( e ) {
        if ( e.code !== `EEXIST` ) throw new Error( e )
      }
    }
  ) )
}

function copyFiles( dir ) {
  const resourceDir = path.resolve( __dirname, `../resources` )

  fs.createReadStream( `${resourceDir}/icon.png` )
    .pipe( fs.createWriteStream( `${dir}/images/icon.png` ) )
  fs.createReadStream( `${resourceDir}/icon.psd` )
    .pipe( fs.createWriteStream( `${dir}/images/icon.psd` ) )
}
