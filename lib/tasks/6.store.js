'use strict'

const fetch = require( 'node-fetch' )
const argv = require( 'yargs' ).argv

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )
const getSpinner = require( '../util/spinner' )

const storeId = argv.store
const app = argv.app
const version = argv.appVersion

let spinner
let lock
let storeVersion

function update( done ) { updateWrapper( done ) }

async function updateWrapper( done ) {
  const identifier = process.cwd().split( `/` ).pop()
  const regex = RegExp( `[a-zA-z0-9]*\/[a-zA-z0-9]{2}\/[a-zA-z0-9]*`, `gi` )

  spinner = getSpinner( `Updating Store` )

  if ( !process.env.METROLOGICAL_API_KEY ) {
    const noApiKeyError = new Error( ansi.red( `Updating your store requires a Metrological API Key. Get yours at dashboard.metrological.com.` ) )
    noApiKeyError.showStack = false
    throw noApiKeyError
  }

  if ( !maf.config.store || !regex.test( maf.config.store )  ) {
    const noStoreIdError = new Error( ansi.red( `Please set a store identifier in your .mafrc.js config.` ) )
    noStoreIdError.showStack = false
    throw noStoreIdError
  }

  const store = maf.config.store.split( `/` )

  spinner.start()

  try {
    if (
      await lockStore( store ) &&
      await getStoreVersion( store )
    ) {
      // 3) Create new app store version
      // 4) Publish the newly created version
      // 5) get store preview link (hashed url)
      // 6) Unlock the store

// console.log( lock, storeVersion )

      spinner.succeed( `Store updated` )
    }
  } catch( e ) {
    spinner.fail( `Could not update Store` )
    const storeError = new Error( ansi.red( e ) )
    storeError.showStack = false
    throw storeError
  } finally { done() }

}

const store = maf.series( `sync`, update )

store.description = `Update your store in the Metrological Dashboard. ${ansi.gray( `Defaults to using info from metadata.'` )}`
store.displayName = `store`
store.flags = {
  '--store': `Override which store identifier to update`
, '--app': `Override which app identifier to use`
, '--version': `Override which app version to use`
}

maf.task( store )

function lockStore( store ) {
  return new Promise( async ( resolve, reject ) => {
    try {
      const res = await fetch( `https://api.metrological.com/api/developer/app-store/lock`, {
        method: `POST`
      , headers: {
          'x-api-token': process.env.METROLOGICAL_API_KEY
        , 'content-type': `application/json;charset=utf-8`
        }
      , body: `{"operator":"${store[ 0 ]}","country":"${store[ 1 ]}","environment":"${store[ 2 ]}","ref":"${Math.random()}"}`
      } )

      lock = await res.json()

    } catch( e ) {
      spinner.fail( `Could not aquire lock` )
      return reject( e.message )
    }

    spinner.text = `Lock acquired`
    resolve( true )
  } )
}

function getStoreVersion( store ) {
  return new Promise( async ( resolve, reject ) => {
    try {
      const res = await fetch( `https://api.metrological.com/api/developer/app-store/versions?operator=${store[ 0 ]}&country=${store[ 1 ]}&environment=${store[ 2 ]}&size=1`, {
        headers: {
          'x-api-token': process.env.METROLOGICAL_API_KEY
        , 'content-type': `application/json;charset=utf-8`
        }
      } )

      storeVersion = await res.json()
    } catch( e ) {
      spinner.fail( `Could not get Store version info` )
      return reject( e.message )
    }

    spinner.text = `Store Version retrieved`
    resolve( true )
  } )
}


// function doRelease( identifier ) {
//   const spinner = getSpinner( `Releasing App` ).start()

//   let res
//   let messages

//   return new Promise( async ( resolve, reject ) => {
//     try {

//       res = await fetch( `https://api.metrological.com/api/developer/applications/release`, {
//         method: `POST`
//       , headers: {
//           'x-api-token': process.env.METROLOGICAL_API_KEY
//         , 'content-type': `application/json;charset=utf-8`
//         }
//       , body: `{"appIds":"${identifier}","skipImageCompression":false}`
//       } )

//       messages = await res.json()
//     } catch( e ) { return reject( e.message ) }

//     let error = false

//     if ( messages.length && messages[ 0 ].error ) {
//       if ( messages[ 0 ].error === `exists` ) {
//         spinner.warn( `App already published` )
//         return resolve()
//       } else {
//         spinner.fail( `Releasing App failed` )
//         return reject( `${messages[ 0 ].id} ${messages[ 0 ].error}` )
//       }
//     }

//     spinner.succeed( `App released` )
//     resolve()
//   } )
// }
