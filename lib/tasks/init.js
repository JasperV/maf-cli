'use strict'

const fetch = require( 'node-fetch' )
const inquirer = require( 'inquirer' )

const maf = require( '../maf.js' )

maf.task( `init`, async done => {
  console.log( `hello from init` )

  // const language = await getLanguageFromIP()
  // const pkg = await getPackageData()
  // const answers = await getAnswers( pkg )

  // console.log( answers )

  done()
} )

// function getLanguageFromIP() {
//   return new Promise( async ( resolve, reject ) => {
//     const res = await fetch( `https://jsonip.metrological.com/?maf=true` )
//     const ipData = await res.json()

//     if ( ipData && ipData.geo && ipData.geo.country )
//       resolve( ipData.geo.country.toLowerCase() )
//     else
//       reject( new Error( 'Could not get language.' ) )
//   } )
// }

// function getPackageData() {
//   let pkg = {}
//   try { pkg = require( `${env.configBase}/package.json` ) } catch( e ) {}
// }

// function getAnswers( pkg ) {
//   return inquirer.prompt( [
//     { name: `name`, message: `App Name:`, default: pkg.name }
//   , { name: `version`, message: `App Version:`, default: pkg.version || `1.0.0` }
//   , { name: `author`, message: `Author:`, default: parseAuthor( pkg.author || `` ).name }
//   , { name: 'company', message: `Company:` }
//   , { name: 'description', message: `App Description:`, default: pkg.description }
//   , { name: 'categories', message: `App Categories:`, filter: answer => answer.split( /\W+/ ) }
//   ] )
// }

/*
async function initApp( env ) {
  const files = {}


  files[ `.mafrc.json` ] = JSON.stringify( { language }, null, 2 )





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
*/
