'use strict'

// TODO: refactor

const url = require( 'url' )
const zlib = require( 'zlib' )
const isUrl = require( 'is-url' )
const xml2json = require( 'xml2json' )
const router = require( 'express' ).Router()
const proxy = require( 'http-proxy' ).createProxyServer( {
  secure: true
, ignorePath: true
, changeOrigin: true
, preserveHeaderKeyCase: true
, hostRewrite: true
, autoRewrite: true
, followRedirects: true
} )

// TODO: fix all proxy directions http(s) http->https https->http

// TODO: catch errors to handle gracefully or informatively

router.all( `/proxy`, ( req, res ) => {
  const target = req.query.url

  if ( !target || !isUrl( target ) ) throw new Error( `No valid Url was given` )

  proxy.web( req, res, { target } )
} )

module.exports = router

let proxyOptions = {}

function parseHeaders( headers = {}, params = {}, remoteAddress = `127.0.0.1` ) { // replace 127 with any of local hosts or one that initiated request
  // TODO: nagaan of allemaal gebruikt!
  ( {
    json: proxyOptions.json
  , cookies: proxyOptions.cookies
  , callback: proxyOptions.callback
  , nocache: proxyOptions.nocache
  , cache: proxyOptions.cache
  , oauth: proxyOptions.oauth
  , ip: proxyOptions.ip
  } = {
    json: params.json === `true` || headers[ `x-proxy-json` ] === `true`
  , cookies: params.cookie || headers[ `x-proxy-cookie` ] || false
  , callback: params.callback || headers[ `x-proxy-callback` ] || false
  , nocache: params.nocache === `true` || headers[ `x-proxy-nocache` ] === `true`
  , cache: params.cache || headers[ `x-proxy-cache` ] || false
  , oauth: JSON.parse( params.oauth || headers[ `x-proxy-oauth` ] || null ) || false
  , ip: ( headers[ `x-forwarded-for` ] || remoteAddress ).split( `,` ).shift()
  } )
}

proxy.on( `error`, ( err, req, res ) => {
  res.status( 500 )
  res.set( `Content-Type`, `text/plain` )
  res.end( err )
} )

proxy.on( 'proxyReq', ( proxyReq, req, res, options ) => {
  const reqOptions = url.parse( req.query.url )

  if ( reqOptions.protocol === `ftp:` || reqOptions.protocol === `file:` )
    throw new Error( `FTP and File Url's are not supported` )
  else if ( reqOptions.protocol !== `http:` && reqOptions.protocol !== `https:` )
    throw new Error( `Url has unsupported protocol: ${reqOptions.protocol}` )

  proxyOptions = { post: req.body || req.method === 'POST' || false }

  parseHeaders(
    req.headers
  , req.query
  , req.connection.remoteAddress || req.remoteAddress
  )

  options.selfHandleResponse = proxyOptions.json

  proxyReq.headers = JSON.parse( req.params.headers || req.headers[ `x-proxy-headers` ] || null ) || {}
  proxyReq.headers[ `X-Forwarded-For` ] = proxyOptions.ip

  if ( req.params.useragent || req.headers[ `x-proxy-useragent` ] )
    proxyReq.headers[ `user-agent` ] = params.useragent || req.headers[ `x-proxy-useragent` ]

  if ( proxyOptions.cookies === false ) delete proxyReq.headers.cookie
  else if ( proxyOptions.cookies !== `true` ) proxyReq.headers.cookie = proxyOptions.cookies

  delete proxyReq.headers[ `x-requested-with` ]
  delete proxyReq.headers[ `x-request` ]
  delete proxyReq.headers.referer
  delete proxyReq.headers.origin
  delete proxyReq.headers.accept
  delete proxyReq.headers.Via
  delete proxyReq.headers.via
} )

proxy.on( `proxyRes`, ( proxyRes, req, res ) => {
  if ( proxyRes.headers && ( proxyOptions.nocache || ( !proxyOptions.json && proxyOptions.post ) ) )
    res.headers[ `Cache-Control` ] = `private, max-age=0, no-cache`
  // TODO: merge
  if ( proxyRes.headers && proxyOptions.cache )
    res.headers[ `Cache-Control` ] = `max-age=${parseInt( proxyOptions.cache, 10 )}`

  res.setHeader( `Access-Control-Allow-Origin`, `*` )

  if ( !proxyOptions.json )
    res.writeHead( proxyRes.statusCode, proxyRes.headers )
  else if ( !proxyOptions.post ) {
    if ( proxyOptions.cookies && proxyRes.headers && proxyRes.headers[ `set-cookie` ] ) {
      res.set( {
        'Access-Control-Expose-Headers': `X-Proxy-Cookie`
      , 'X-Proxy-Cookie': proxyRes.headers[ `set-cookie` ]
      } )
    }

    // TODO: potential issue
    if ( proxyRes.headers && proxyRes.headers[ `last-modified` ] )
      res.set( `Last-Modified`, proxyRes.headers[ `last-modified` ] )

    if ( proxyRes.headers && proxyRes.headers.expires )
      res.setHeader( `Expires`, proxyRes.headers.expires )

    if ( proxyRes.headers && proxyRes.headers[ `cache-control` ] )
      res.setHeader( `Cache-Control`, proxyRes.headers[ `cache-control` ] )
  }

  const size = parseInt( proxyRes.headers[ 'content-length' ], 10 ) || false
  let buf = size ? Buffer.alloc( size ) : []

  const options = proxyOptions

  proxyRes.on( `data`, chunk => {
    if ( size === false ) buf.push( chunk )
    else buf = Buffer.concat( [ buf, chunk ] )
  } )

  proxyRes.on( `end`, _ => {
    if ( size === false ) buf = Buffer.from( buf )

    const encoding = proxyRes.headers[ `content-encoding` ]

    if ( encoding == `gzip` )
      zlib.gunzip( buf, ( err, data ) => {
        if ( !options.json ) res.end( data )
        else convert( data/*, proxyRes*/ )
      } )
    else if ( encoding === `deflate` )
      zlib.inflate( buf, ( err, data ) => {
        if ( !options.json ) res.end( data )
        else convert( data/*, proxyRes*/ )
      } )
    else if ( !options.json ) return res.end( buf )
    else return convert( buf/*, proxyRes*/ )
  } )

  function convert( data ) {
    data = data.toString( `utf8` )

    try {
      const json = xml2json.toJson( data, {
        object: false
      , reversible: false
      , coerce: false
      , sanitize: false
      , trim: false
      } )

      toJson( json )

    } catch ( e ) {
      JSON.parse( data )
      toJson( data )
    }
  }

  function toJson( data ) {
    if ( proxyOptions.callback ) {
      data = `${callback} && ${callback}(${data});`
      res.set( `Content-Type`, `text/javascript` )
    } else
      res.set( `Content-Type`, `application/json` )

    res.end( data )
    proxyOptions = null
  }
} )
