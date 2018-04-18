'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const fetch = require( 'node-fetch' )
const FormData = require( 'form-data' )
const retry = require( 'async-retry' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )
const getSpinner = require( '../util/spinner' )

async function upload( done ) {
  const identifier = process.cwd().split( `/` ).pop()

  if ( !process.env.METROLOGICAL_API_KEY ) {
    throw new Error( ansi.red( `Uploading requires a Metrological API Key. Get yours at dashboard.metrological.com.` ) )
  }

  const form = new FormData()
  form.append( `file`, fs.createReadStream( `${process.cwd()}/${identifier}.zip` ) )

  // TODO: error when zip not exists

  const translations = getTranslations()

  try {
    await doUpload( form, translations )
    await checkStatus( identifier, translations )
  } catch( e ) {
    throw new Error( ansi.red( ...e ) )
  }

  done()
}

upload.description = `Upload your (zipped) MAF App to the Metrological Dashboard.`

maf.task( upload )

function getTranslations() {
  return require( path.resolve( __dirname, `../resources/translation.json` ) )
}

async function doUpload( form, translations ) {
  const spinner = getSpinner( `Uploading App` ).start()

  const res = await fetch( `https://api.metrological.com/api/admin/applications/upload`, {
    method: `POST`
  , headers: { 'x-api-token': process.env.METROLOGICAL_API_KEY }
  , body: form
  } )

  return new Promise( async ( resolve, reject ) => {
    const messages = await res.json()

    if ( messages.errors ) {
      spinner.fail()
      return reject( messages.errors.map( error =>
        `${translations.error.upload.submit_errors[ error ]}`
      ) )
    } else {
      spinner.succeed()
      resolve()
    }
  } )
}

function checkStatus( identifier, translations ) {
  const spinner = getSpinner( `Checking App status` ).start()
  const metadata = require( `${process.cwd()}/Contents/metadata.json` )

  return new Promise( async ( resolve, reject ) => {
    const status = await retry( async ( bail, attempt ) => {

      const res = await fetch( `https://api.metrological.com/api/admin/applications/upload-status`, {
        method: 'GET'
      , headers: { 'x-api-token': process.env.METROLOGICAL_API_KEY }
      } )

      if ( 403 === res.status ) return bail( new Error( 'Unauthorized' ) )

      const data = await res.json()

      const item = data.find( item =>
        item.params.identifier === identifier &&
        item.params.version === metadata.version &&
        item.status !== 'pending'
      )

      if ( !item ) throw new Error( 'App still pending.' )

      return item
    } )

    if ( status.errors ) {
      spinner.fail()
      reject( [ status.status, status.errors ] )
    } else {
      spinner.succeed()
      resolve( [ status.status ], translations.success.upload.success )
    }
  } )
}
