'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const fetch = require( 'node-fetch' )
const mkdirp = require( 'mkdirp-promise' )
const shell = require( 'shelljs' )
const inquirer = require( 'inquirer' )
const isSemver = require( 'is-semver' )
const isGitUrl = require( 'is-git-url' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )
const getSpinner = require( '../util/spinner' )
const getTranslations = require( '../../scripts/translations' )

const { promisify } = require( 'util' )

const { writeFile, access } = {
  writeFile: promisify( fs.writeFile )
, access: promisify( fs.access )
}

async function init( done ) {
  const path = `${process.cwd()}/contents`

  const language = await getLanguageFromIP()
  await getTranslations()

  const answers = await getAnswers()
  const metadata = createMetadata( answers )

  await createDirs( getDirs( path ) )
  await createFiles( getFiles( {
    path
  , language
  , metadata
  , name: answers.name
  , version: answers.version
  , author: answers.author
  , description: answers.description
  , categories: answers.categories
  , gitrepo: answers.gitrepoe
  , apikey: answers.apikey
  } ) )

  await copyFiles( path )

  runNPM( `i -D maf-cli` )
  initGit( answers.gitrepo )
  createCertificate()
}

init.description = `Initialize a new MAF project. ${ansi.gray( `Runs` )} ${ansi.yellow( `npm init` )} and ${ansi.yellow( `git init` )} and installs the CLI locally.`

maf.task( init )

function getLanguageFromIP() {
  const spinner = getSpinner( `Determining language` ).start()

  return new Promise( async ( resolve, reject ) => {
    const res = await fetch( `https://jsonip.metrological.com/?maf=true` )
    const ipData = await res.json()

    if ( ipData && ipData.geo && ipData.geo.country ) {
      const lang = ipData.geo.country.toLowerCase()
      spinner.succeed( `Language set: ${lang}` )
      resolve( lang )
    } else {
      spinner.fail( `Determining language failed` )
      const languageError = new Error( 'Could not get language.' )
      languageError.showStack = false
      reject( languageError )
    }
  } )
}

function getAnswers( pkg ) {
  return inquirer.prompt( [
    { name: `identifier`, message: `App Identifier:`, default: process.cwd().split( `/` ).pop().toLowerCase(), filter: answer => answer.toLowerCase() }
  , { name: `version`, message: `App Version:`, default: `1.0.0`, validate: answer => isSemver( answer ) }
  , { name: `name`, message: `App Name:`, default: answers => answers.identifier }
  , { name: `author`, message: `Author:` }
  , { name: `company`, message: `Company:` }
  , { name: `description`, message: `App Description:` }
  , { name: `categories`, message: `App Categories:`, filter: answer => answer.toLowerCase().split( /\W+/ ) }
  , { name: `apikey`, message: `Metrological API Key:` }
  , { name: `gitrepo`, message: `Git Repository:`, validate: answer => isGitUrl( answer ) || answer === `` }
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
  , [ `${opts.path}/javascript/core/api.js` ]: `// api`
  , [ `${opts.path}/javascript/theme.js` ]: `// theme
Theme.set( {
} )`
  , [ `${opts.path}/metadata.json` ]: opts.metadata
  , [ `${opts.path}/Localization/${opts.language}-eu.strings` ]: `// ${opts.language.toUpperCase()}`
  , [ `${process.cwd()}/.env` ]: `METROLOGICAL_API_KEY="${opts.apikey}"`
  , [ `${process.cwd()}/.gitignore` ]: `node_modules
.maf
.env
*.zip
*.crt
*.key
.psd`
  , [ `${opts.path}/javascript/views/main.js` ]: `// MAIN
const Main = new MAF.Class( {
  Extends: MAF.system.SidebarView

, initView() {}

, createView() {}

, updateView() {}

, selectView() {}

, focusView() {}

, unselectView() {}

, hideView() {}

, destroyView() {}
} )`
  , [ `${process.cwd()}/.mafrc.js` ]: `const maf = require( 'maf-cli' )

module.exports = {
  language: '${opts.language}'
, lint: false
}`
  , [ `${process.cwd()}/.env` ]: `LANG=en_US.utf8
TERM=xterm-256color
NODE_ENV=production
NODE_SECURE_PORT=8443
NODE_PORT=8080
METROLOGICAL_API_KEY="YOUR_API_KEY_HERE"
`
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
  , [ `${process.cwd()}/package.json` ]: `{
  "name": "${opts.name}",
  "version": "${opts.version}",
  "description": "${opts.description}",
  "scripts": {
    "test": "maf"
  },${
    ( repo => {
      if ( repo ) return `\n"repository": {
    "type": "git",
    "url": "${repo}"
  },`
      else return ``
    } )( opts.gitrepo )
  }
  "keywords": [ "${opts.categories.join( '", "' ) }" ],
  "author": "${opts.author}"
}`
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

  return new Promise( ( resolve, reject ) => {
    try {
      shell.cp( `-u`, `${resourceDir}/icon.psd`, `${dir}/images/icon.psd` )
      shell.cp( `-u`, `${resourceDir}/icon.png`, `${dir}/images/icon.png` )
      resolve( true )
    } catch( e ) { reject( false ) }
  } )
}

function runNPM( command ) {
  console.log( `Running NPM` )

  if ( !shell.which( `npm` ) ) {
    const npmError = new Error( ansi.red( `Sorry, this command requires npm. Please install npm before running this command.` ) )
    npmError.showStack = false
    console.log( `NPM failed` )
    throw npmError
  }

  if ( shell.exec( `npm ${command}`).code !== 0 ) {
    const npmCommandError = new Error( ansi.red( `npm command failed.` ) )
    npmCommandError.showStack = false
    console.log( `NPM failed` )
    throw npmCommandError
  }
}

function initGit( repo ) {
  console.log( `Running Git` )

  if ( !shell.which( `git` ) ) {
    const gitError = new Error( ansi.red( `Sorry, this command requires git. Please install git before running this command.` ) )
    gitError.showStack = false
    console.log( `Git failed` )
    throw gitError
  }

  if ( shell.exec( `git init`).code !== 0 ) {
    const gitInitError = new Error( ansi.red( `git init failed.` ) )
    gitInitError.showStack = false
    console.log( `Git failed` )
    throw gitInitError
  }

  if ( repo ) {
    if ( shell.exec( `git remote add origin ${repo}`).code !== 0 ) {
      const gitRemoteError = new Error( ansi.red( `git remote add failed.` ) )
      gitRemoteError.showStack = false
      console.log( `Git failed` )
      throw gitRemoteError
    }
  }
}

function createCertificate() {
  console.log( `Create certficate` )

  if ( shell.exec( `sh ./node_modules/maf-cli/scripts/cert.sh` ).code !== 0 ) {
    const certCommandError = new Error( ansi.red( `certificate creation failed.` ) )
    certCommandError.showStack = false
    console.log( `Certificate failed` )
    throw certCommandError
  }
}
