'use strict'

const path = require( 'path' )
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
let appVersions
let hash

function update( done ) { updateWrapper( done ) }

async function updateWrapper( done ) {
  const identifier = process.cwd().split( `/` ).pop()
  const regex = RegExp( `[a-zA-z0-9]*\/[a-zA-z0-9]{2}\/[a-zA-z0-9]*`, `gi` )
  const meta = require( path.resolve( process.cwd(), `./contents/metadata.json` ) )

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
      await getStoreVersion( store ) &&
      await getAppVersions( store, identifier )
    ) {

      const versionHash = Object.values( appVersions ).find( version => version.version === meta.version ).hash

      if ( !versionHash ) {
        spinner.fail( `Version not published yet` )
        const versionError = new Error( ansi.red( `The app version seems to be unpublished yet.` ) )
        versionError.showStack = false
        throw versionError
      }

      // TODO: if current app + version already exists, bail
      // TODO: if app not exists in store add it

      storeVersion.categories.forEach( categorie => {
        categorie.apps.forEach( app => {
          if ( identifier === app.id ) app.version = `${meta.version}-${versionHash}`
        } )
      } )

      await setStoreVersion( storeVersion )
      await publishStore( store )

      spinner.succeed( `Store updated` )

      console.log( `Preview your App/Store via ${ansi.yellow( `https://widgets.metrological.com/metrological/${hash}?direct=true` )}.` )
    }

    done()
  } catch( e ) {
    spinner.fail( `Could not update Store` )
    const storeError = new Error( ansi.red( e ) )
    storeError.showStack = false
    throw storeError
  } finally {
    await unlockStore( store )
  }
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

      storeVersion = ( await res.json() ).environments[ 0 ]
    } catch( e ) {
      spinner.fail( `Could not get Store version info` )
      return reject( e.message )
    }

    spinner.text = `Store Version retrieved`
    resolve( true )
  } )
}

function getAppVersions( store, identifier ) {
  return new Promise( async ( resolve, reject ) => {
    try {
      const res = await fetch( `https://api.metrological.com/api/developer/app-store/available-apps?operator=${store[ 0 ]}&country=${store[ 1 ]}&environment=${store[ 2 ]}&forceProdApps=0`, {
        headers: {
          'x-api-token': process.env.METROLOGICAL_API_KEY
        , 'content-type': `application/json;charset=utf-8`
        }
      } )

      appVersions = ( await res.json() ).apps[ identifier ]
    } catch( e ) {
      spinner.fail( `Could not get App versions` )
      return reject( e.message )
    }

    spinner.text = `App versions retrieved`
    resolve( true )
  } )
}

function setStoreVersion( store ) {
  return new Promise( async ( resolve, reject ) => {
    try {
      const res = await fetch( `https://api.metrological.com/api/developer/app-store/create-new-version`, {
        method: `POST`
      , headers: {
          'x-api-token': process.env.METROLOGICAL_API_KEY
        , 'content-type': `application/json;charset=utf-8`
        }
      , body: `{"store":${JSON.stringify( store )},"unlockId":"${lock.unlockId}"}`
      } )

      const message = await res.json()
      if ( message.error && message.error.length ) return reject( message.error )
      else if ( message.success ) hash = message.versionHash
    } catch( e ) {
      spinner.fail( `Could not create Store version` )
      return reject( e.message )
    }

    spinner.text = `Store Version created`
    resolve( true )
  } )
}

function publishStore( store ) {
  return new Promise( async ( resolve, reject ) => {
    try {
      const res = await fetch( `https://api.metrological.com/api/developer/app-store/publish`, {
        method: `POST`
      , headers: {
          'x-api-token': process.env.METROLOGICAL_API_KEY
        , 'content-type': `application/json;charset=utf-8`
        }
      , body: `{"unlockId":"${lock.unlockId}","operator":"${store[ 0 ]}","country":"${store[ 1 ]}","environment":"${store[ 2 ]}","versionHash":"${hash}","now":false,"reload":false,"hiddenForClients":false,"publishAsync":true}`
      } )

      const message = await res.json()
      if ( message.error && message.error.length ) return reject( message.error )
    } catch( e ) {
      spinner.fail( `Could not publish Store version` )
      return reject( e.message )
    }

    spinner.text = `Store Version published`
    resolve( true )
  } )
}

function unlockStore( store ) {
  return new Promise( async ( resolve, reject ) => {
    try {
      const res = await fetch( `https://api.metrological.com/api/developer/app-store/unlock`, {
        method: `POST`
      , headers: {
          'x-api-token': process.env.METROLOGICAL_API_KEY
        , 'content-type': `application/json;charset=utf-8`
        }
      , body: `{"operator":"${store[ 0 ]}","country":"${store[ 1 ]}","environment":"${store[ 2 ]}","id":"${lock.unlockId}"}`
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
