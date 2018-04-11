'use strict'

function formatError( e ) {
  if ( !e.error ) return e.message

  if ( typeof e.error.showStack === `boolean` ) return e.error.toString()

  if ( e.error.stack ) return e.error.stack

  return new Error( String( e.error ) ).stack
}

module.exports = formatError
