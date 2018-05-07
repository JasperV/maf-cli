'use strict'

const os = require( 'os' )
const isIp = require( 'is-ip' )
const https = require( 'https' )
const fetch = require( 'node-fetch' )
const router = require( 'express' ).Router()

const ansi = require( '../util/ansi' )
const hosts = require( '../util/hosts' )

let cache

function localIp( hostname ) {
  const filteredHosts = hosts( { family: `IPv4`, internal: false } )

  if ( isIp( hostname ) && filteredHosts.indexOf( hostname ) !== -1 )
    return hostname
  else
    return filteredHosts[ 0 ]
}

router.get( `/ip`, async ( req, res ) => {
  if ( cache && cache.secure === req.secure ) {
    console.log( ansi.yellow( `CACHE HIT for` ), req.method, req.path )
    cache.lan = localIp( req.hostname )
    return res.jsonp( cache )
  }

  const result = await ( await fetch( 'https://jsonip.metrological.com/?maf=true' ) ).json()

  result.wan = result.ip
  result.lan = localIp( req.hostname )
  result.port = req.headers.host.split( `:` ).pop()
  result.secure = req.secure

  cache = result

  res.jsonp( result )
} )

module.exports = router
