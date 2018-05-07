'use strict'

const os = require( 'os' )
const isObject = require( 'isobject' )

module.exports = function( options ) {
  const hosts = Object.values( os.networkInterfaces() )
    .reduce( ( acc, curr ) => acc.concat( curr ), [] )
    .filter( details => {
      if ( !isObject( options ) ) return true

      const shouldHave = Object.keys( options ).length
      let has = 0

      for ( let [ option, value ] of Object.entries( options ) ) {
        if ( details.hasOwnProperty( option ) && details[ option ] === value )
          has++
      }

      if ( shouldHave === has ) return true

      return false
    } )
    .map( details => details.address )

  if ( isObject( options ) && options.internal !== false )
    hosts.unshift( `localhost`, os.hostname() )

  return hosts
}
