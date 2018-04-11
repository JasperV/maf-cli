'use strict'

const prettyTime = require( 'pretty-hrtime' )

const ansi = require( '../ansi' )
const formatError = require( '../format-error' )

function logEvents( maf ) {

  const loggedErrors = []

  maf.on( `start`, evt => {
    const level = evt.branch ? `debug` : `info`
    console[ level ]( `Starting`, `\'${ansi.cyan( evt.name )}\'...` )
  } )

  maf.on( `stop`, evt => {
    const time = prettyTime( evt.duration )
    const level = evt.branch ? `debug` : `info`

    console[ level ](
      `Finished`
    , `\'${ansi.cyan( evt.name )}\'`
    , `after`
    , ansi.magenta( time )
    )
  } )

  maf.on( `error`, evt => {
    const msg = formatError( evt )
    const time = prettyTime( evt.duration )
    const level = evt.branch ? `debug` : `error`;

    console[ level ](
      `\'${ansi.cyan( evt.name )}\'`
    , ansi.red( `errored after` )
    , ansi.magenta( time )
    )

    if ( loggedErrors.indexOf( evt.error ) === -1 ) {
      console.error( msg )
      loggedErrors.push( evt.error )
    }
  } )
}

module.exports = logEvents
