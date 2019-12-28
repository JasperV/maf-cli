'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const fetch = require( 'node-fetch' )
const FormData = require( 'form-data' )
const retry = require( 'async-retry' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )
const getSpinner = require( '../util/spinner' )
const downloadTranslations = require('../../scripts/translations')

const now = +new Date

async function upload( done ) {
  const identifier = process.cwd().split( `/` ).pop()

  if ( !process.env.METROLOGICAL_API_KEY ) {
    const noApiKeyError = new Error( ansi.red( `Uploading requires a Metrological API Key. Get yours at dashboard.metrological.com.` ) )
    noApiKeyError.showStack = false
    throw noApiKeyError
  }

  const fileRead = fs.createReadStream( `${process.cwd()}/${identifier}.zip` )

  fileRead.on( `error`, err => {
    if ( err.code === `ENOENT` ) {
      const noZipError = new Error( `${ansi.red( `${identifier}.zip does not exist. Did you forget to run '` )}${ansi.yellow( `maf package` )}${ansi.red( `' first?` )}` )
      noZipError.showStack = false
      throw noZipError
    }
  } )

  const form = new FormData()
  form.append( `file`, fileRead )

  const translations = await getTranslations()

  try {
    await doUpload( form, translations )
    await checkStatus( identifier, translations )
  } catch( e ) {
    const checkUploadError = new Error( ansi.red( ...e ) )
    checkUploadError.showStack = false
    throw checkUploadError
  }

  done()
}

upload.description = `Upload your (zipped) MAF App to the Metrological Dashboard.`

maf.task( upload )

async function getTranslations() {
  await downloadTranslations()
  return require( path.resolve( __dirname, `../resources/translation.json` ) )
}

async function doUpload( form, translations ) {
  const spinner = getSpinner( `Uploading App` ).start()

  return new Promise( async ( resolve, reject ) => {
    let res
    let messages

    try {
      const res = await fetch( `https://api.metrological.com/api/developer/applications/upload`, {
        method: `POST`
      , headers: { 'x-api-token': process.env.METROLOGICAL_API_KEY }
      , body: form
      } )

      if ( res.status === 403 ) {
        console.log( res.status )
        return reject( `Uploading not allowed` )
      }

      messages = await res.json()
    } catch ( e ) {
      spinner.fail( `Uploading failed` )
      return reject( e )
    }

    if ( messages.errors ) {
      spinner.fail( `Uploading failed` )
      return reject( messages.errors.map( error =>
        `${translations.error.upload.submit_errors[ error ]}`
      )[ 0 ] )
    } else {
      spinner.succeed( `Uploading succeeded` )
      resolve()
    }
  } )
}

function checkStatus( identifier, translations ) {
  const spinner = getSpinner( `Checking App status` ).start()
  const metadata = require( `${process.cwd()}/Contents/metadata.json` )

  return new Promise( async ( resolve, reject ) => {
    const status = await retry( async ( bail, attempt ) => {

      const res = await fetch( `https://api.metrological.com/api/developer/applications/upload-status`, {
        method: 'GET'
      , headers: { 'x-api-token': process.env.METROLOGICAL_API_KEY }
      } )

      if ( 403 === res.status ) return bail( new Error( 'Unauthorized' ) )

      const data = await res.json()

      const item = data.find( item =>
        item.params.identifier === identifier &&
        item.params.version === metadata.version &&
        item.status !== 'pending' &&
        +new Date( item.start ) > now
      )

      if ( !item ) throw new Error( `App still pending.` )

      return item
    } )

    if ( status.errors ) {
      spinner.fail( `App did not pass` )
      reject( [ status.status, status.errors ] )
    } else {
      spinner.succeed( `App passed` )
      resolve( [ status.status ], translations.success.upload.success )
    }
  } )
}
