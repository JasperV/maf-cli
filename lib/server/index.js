#!/usr/bin/env node

'use strict'

const os = require( `os` )
const fs = require( `fs` )
const path = require( 'path' )
const http = require( 'http' )
const https = require( 'https' )
const ngrok = require( 'ngrok' )
const clear = require( 'clear' )
const morgan = require( 'morgan' )
const qs = require( 'querystring' )
const express = require( 'express' )
const router = express.Router()
const compression = require( 'compression' )
const requestStats = require( 'request-stats' )
const minifyHTML = require( 'express-minify-html' )

const ansi = require( '../util/ansi' )
const hosts = require( '../util/hosts' )( { family: `IPv4` } )

const port = process.env.NODE_PORT || 8080
const securePort = process.env.NODE_SECURE_PORT || 8443
const docsPort = process.env.DOCS_PORT || 9090

const app = express()
const counterApp = express()
const docsApp = express()

let firstRequest = false

http.globalAgent.maxSockets = Infinity
https.globalAgent.maxSockets = Infinity

function getRemoteHost( port ) {
  return ngrok.connect( {
    addr: port
  , region: `eu`
  } )
}

function startServer( config ) {
  let url
  const secure = config.secure

  app.disable( `x-powered-by` )

  app.use( morgan( `dev` ) )
  app.use( compression() )

  app.use( minifyHTML( {
    override: true
  , exception_url: false
  , htmlMinifier: {
      removeComments: true
    , collapseWhitespace: true
    , collapseBooleanAttributes: true
    , removeAttributeQuotes: true
    , removeEmptyAttributes: true
    , minifyJS: true
    }
  } ) )

  app.use( require( './routes/index' )( config.store, config.meta, config.maf ) )
  app.use( require( './routes/ip' ) )
  app.use( require( './routes/proxy' ) )

  app.use( ( req, res ) => res.status( 404 ).send( `404 - Not Found` ) )

  app.use( ( err, req, res ) => {
    console.error( err.stack )
    res.status( 500 ).send( `500 - Internal Server Error` )
  } )

  const serverPort = secure ? securePort : port
  const counterPort = secure ? port : securePort
  const protocol = secure ? `https` : `http`
  const counterProtocol = secure ? `http` : `https`
  const httpsOptions = {
    key: fs.readFileSync( path.resolve( process.cwd(), `MAF3SDK.key` ), `utf8` )
  , cert: fs.readFileSync( path.resolve( process.cwd(), `MAF3SDK.crt` ), `utf8` )
  }

  counterApp.get( `*`, ( req, res ) => res.redirect( `${req.protocol === protocol ? counterProtocol : protocol}://${req.headers.host.split( `:` ).shift()}:${serverPort}${req.path}?${qs.stringify( req.query )}` ) )
  docsApp.use( express.static( path.resolve( process.cwd(), `./node_modules/maf3-sdk/docs/` ) ) )

  const server = secure ? https.createServer( httpsOptions, app ) : http.createServer( app )
  const counterServer = secure ? http.createServer( counterApp ) : https.createServer( httpsOptions, counterApp )
  const docsServer = https.createServer( httpsOptions, docsApp )

  require( '../util/terminus' )( server )

  requestStats( server, stats => {
    if ( firstRequest ) return
    firstRequest = true
    clear()
  } )

  counterServer.on( `error`, err => {
    if ( err.code === `EADDRINUSE` ) throw new Error( ansi.red( `Port ${counterPort} is already in use.` ) )
  } )

  docsServer.on( `error`, err => {
    if ( err.code === `EADDRINUSE` ) throw new Error( ansi.red( `Port ${docsPort} is already in use.` ) )
  } )

  server.on( `error`, err => {
    if ( err.code === `EADDRINUSE` ) throw new Error( ansi.red( `Port ${serverPort} is already in use.` ) )
  } )

  counterServer.listen( counterPort )
  docsServer.listen( docsPort )

  server.listen( serverPort, async _ =>
    process.send( {
      serverStart: {
        secure
      , hosts
      , docsPort
      , port: serverPort
      , external: config.external ? await getRemoteHost( serverPort ) : false
      }
    } )
  )
}

process.on( `message`, m => {
  if ( m.start ) startServer( m )
} )



/*

  Was used on sending json via post to api server

  bodyParser = require('body-parser'),

  var urlParser = bodyParser.urlencoded({extended: false, limit: '5mb'});
  var rawParser = function(req, res, next) {
    req.rawBody = '';
    req.on('data', function(chunk) {
      req.rawBody += chunk;
    });

    req.on('end', function() {
      try{
        if(req.headers['content-type'] === 'application/json')
          req.body = JSON.parse(req.rawBody);
      }catch(e){}
      return next();
    });
  };
*/
