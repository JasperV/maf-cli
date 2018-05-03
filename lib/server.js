#!/usr/bin/env node

'use strict'

// TODO: refactor

const os = require( `os` )
const fs = require( `fs` )
const path = require( 'path' )
const http = require( 'http' )
const https = require( 'https' )
const ngrok = require( 'ngrok' )
const morgan = require( 'morgan' )
const qs = require( 'querystring' )
const express = require( 'express' )
const compression = require( 'compression' )

const ansi = require( './util/ansi' )

const port = process.env.NODE_PORT || 8080
const securePort = process.env.NODE_SECURE_PORT || 8443

const app = express()
const counterApp = express()

http.globalAgent.maxSockets = Infinity
https.globalAgent.maxSockets = Infinity

function startServer( config ) {
  let url
  const secure = config.secure

  app.disable( `x-powered-by` )

  app.use( morgan( `dev` ) )
  app.use( compression() )

  app.use( require( './routes/index' )( config.store, config.meta ) )
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

  counterApp.get( `*`, ( req, res ) => {
    res.redirect(
      302
    , `${req.protcol === protocol ? counterProtocol : protocol}://${req.headers.host.split( `:` ).shift()}:${serverPort}${req.path}?${qs.stringify( req.query )}`
    )
  } )

  const server = secure ? https.createServer( {
    key: fs.readFileSync( path.resolve( process.cwd(), `MAF3SDK.key` ), `utf8` )
  , cert: fs.readFileSync( path.resolve( process.cwd(), `MAF3SDK.crt` ), `utf8` )
  }, app ) : http.createServer( app )

  const counterServer = secure ? http.createServer( counterApp ) : https.createServer( {
    key: fs.readFileSync( path.resolve( process.cwd(), `MAF3SDK.key` ), `utf8` )
  , cert: fs.readFileSync( path.resolve( process.cwd(), `MAF3SDK.crt` ), `utf8` )
  }, counterApp )

  require( './util/terminus' )( server )

  server.listen( serverPort, async _ => {
    const hosts = [ `localhost`, os.hostname() ]
    const ifaces = os.networkInterfaces()

    Object.keys( ifaces ).forEach( dev => {
      ifaces[ dev ].forEach( details => {
        if ( details.family === `IPv4` ) hosts.push( details.address )
      } )
    } )

    if ( config.external ) {
      url = await ngrok.connect( {
        addr: serverPort
      , region: `eu`
      } )
    }

    process.send( {
      serverStart: {
        hosts
      , secure
      , port: serverPort
      , external: url
      }
    } )
  } )

  counterServer.listen( counterPort )
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
