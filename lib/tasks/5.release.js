'use strict'

const fetch = require( 'node-fetch' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

async function release( done ) {
  const identifier = process.cwd().split( `/` ).pop()

  if ( !process.env.METROLOGICAL_API_KEY ) {
    throw new Error( ansi.red( `Releasing requires a Metrological API Key. Get yours at dashboard.metrological.com.` ) )
  }

  try {
    await doRelease( identifier )
  } catch( e ) {
    throw new Error( ansi.red( e ) )
  }

  done()
}

release.description = `Release your MAF App in the Metrological Dashboard. ${ansi.gray( `Not applicable if you have '` )}${ansi.yellow( `auto-release` )}${ansi.gray( `' enabled.` )}`

maf.task( release )

function doRelease( identifier ) {

  return new Promise( async ( resolve, reject ) => {
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

    if ( messages.length && messages[ 0 ].error )
      return reject( `${messages[ 0 ].id} ${messages[ 0 ].error}` )

    resolve()
  } )
}
