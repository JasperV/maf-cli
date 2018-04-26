'use strict'

const os = require( 'os' )
const https = require( 'https' )
const router = require( 'express' ).Router()

const port = process.env.NODE_PORT || 8080
const securePort = process.env.NODE_SECURE_PORT || 8443

let cached;

function local() {
  const newIfaces = os.networkInterfaces()

  // TODO: return IP that was used to make request

  for ( let dev in newIfaces ) {
    const iface = newIfaces[ dev ].filter( details => details.family === 'IPv4' && details.internal === false )
    if ( iface.length > 0 ) return iface[ 0 ].address
  }
}

function getIp( cb, secure ) {
  if ( cached && cached.secure === secure ) {
    cached.lan = local()
    return cb( null, cached )
  }

  // TODO: fetch
  https.get( 'https://jsonip.metrological.com/?maf=true', res => {
    var data = '';
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('end', function () {
      var result;
      try {
        result = JSON.parse(data);
      } catch (err) {
        return cb(err);
      }
      result.wan = result.ip;
      result.lan = local();
      result.port = secure ? securePort : port;
      result.secure = secure;
      cached = result;
      cb(null, result);
    })
  })
}

module.exports = function() {
  router.get( `/ip`, ( req, res ) => {
    getIp( ( err, jsonip ) => {
      if ( err ) return res.send( 500 )
      res.jsonp( jsonip )
    }, req.secure )
  } )

  return router
}
