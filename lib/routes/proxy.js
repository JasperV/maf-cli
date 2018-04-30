'use strict'

const url = require( 'url' )
const zlib = require( 'zlib' )
const isUrl = require( 'is-url' )
const router = require( 'express' ).Router()
const proxy = require( 'http-proxy' ).createProxyServer( {
  ignorePath: true
, changeOrigin: true
, preserveHeaderKeyCase: true
, hostRewrite: true
, autoRewrite: true
, followRedirects: true
} )

// TODO: fix all directions http(s) http->https https->http

router.all( `/proxy`, ( req, res ) => {
  const target = req.query.url

  if ( !target || !isUrl( target ) ) throw new Error( `No valid Url was given` )

  proxy.web( req, res, { target } )
} )

module.exports = router

function parseHeaders( headers = {}, params = {}, remoteAddress = `127.0.0.1` ) { // replace 127 with any of local hosts
  const json = params.json === `true` || headers[ `x-proxy-json` ] === `true`
  const cookies = params.cookie || headers[ `x-proxy-cookie` ] || false
  const callback = params.callback || headers[ `x-proxy-callback` ] || false
  const nocache = params.nocache === `true` || headers[ `x-proxy-nocache` ] === `true`
  const cache = params.cache || headers[ `x-proxy-cache` ] || false
  const oauth = JSON.parse( params.oauth || headers[ `x-proxy-oauth` ] || null ) || false
  const ip = ( headers[ `x-forwarded-for` ] || remoteAddress ).split( `,` ).shift()

  // TODO: nagaan of allemaal gebruikt!
  return { json, cookies, callback, nocache, cache, oauth, ip }
}

proxy.on( 'proxyReq', ( proxyReq, req, res, options ) => {
  const post = req.body || req.method === 'POST' || false
  const reqOptions = url.parse( req.query.url )

  // TODO: else if ( options.protocol === `https` ) ssl = true
  if ( reqOptions.protocol === `ftp:` || reqOptions.protocol === `file:` )
    throw new Error( `FTP and File Url's are not supported` )
  else if ( reqOptions.protocol !== `http:` && reqOptions.protocol !== `https:` )
    throw new Error( `Url has no supported protocol` )

  const { json, cookies, callback, nocache, cache, oauth, ip } = parseHeaders(
    req.headers
  , req.query
  , req.connection.remoteAddress || req.remoteAddress
  )

  options.selfHandleResponse = json

  proxyReq.headers = JSON.parse( req.params.headers || req.headers[ `x-proxy-headers` ] || null ) || {}
  proxyReq.headers[ `X-Forwarded-For` ] = ip

  delete proxyReq.headers.Via
  delete proxyReq.headers.via

  if ( req.params.useragent || req.headers[ `x-proxy-useragent` ] )
    proxyReq.headers[ `user-agent` ] = params.useragent || req.headers[ `x-proxy-useragent` ]

  if ( cookies === false ) delete proxyReq.headers.cookie
  else if ( cookies !== `true` ) proxyReq.headers.cookie = cookies

  delete proxyReq.headers[ `x-requested-with` ]
  delete proxyReq.headers[ `x-request` ]
  delete proxyReq.headers.referer
  delete proxyReq.headers.origin
  delete proxyReq.headers.accept
} )

proxy.on( 'proxyRes', ( proxyRes, req, res ) => {
  var body = new Buffer('');
  proxyRes.on('data', function (data) {
      body = Buffer.concat([body, data]);
  });
  proxyRes.on('end', function () {
    body = body.toString();
    // console.log("res from proxied server:", body);
    res.end("my response to original req - meaning json is true");
  });
} )

// proxy.on('error', function (err, req, res) {
//   res.writeHead(500, {
//     'Content-Type': 'text/plain'
//   });

//   res.end('Something went wrong. And we are reporting a custom error message.');
// });

function handleProxyRequest( req, res, post, redirectUri ) {

  var httpproxy = null;

  var handleproxy = function(pres) {
    if (pres.headers['access-control-allow-origin']) {
      delete pres.headers['access-control-allow-origin'];
    }

    if (pres.headers && (nocache || (!json && post))) {
      delete pres.headers.Age;
      delete pres.headers.age;
      delete pres.headers.etag;
      delete pres.headers.expires;
      delete pres.headers['last-modified'];
      delete pres.headers['cache-control'];
      pres.headers['Cache-Control'] = 'private, max-age=0, no-cache';
    }

    delete pres.headers.Via;
    delete pres.headers.via;
    delete pres.headers['Accept-Ranges'];
    delete pres.headers['accept-ranges'];
    delete pres.headers['x-cache'];
    delete pres.headers['x-amz-cf-id'];

    if (pres.headers && cache) {
      try {
        delete pres.headers.age;
        delete pres.headers.etag;
        delete pres.headers.expires;
        delete pres.headers['last-modified'];
        delete pres.headers['cache-control'];
        pres.headers['Cache-Control'] = 'max-age=' + parseInt(cache, 10);
      } catch (e) {
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    if(!json)
      res.writeHead(pres.statusCode, pres.headers);

    else if (!post) {
      if (cookies && pres.headers && pres.headers['set-cookie']) {
        pres.headers['Access-Control-Expose-Headers'] = 'X-Proxy-Cookie';
        pres.headers['X-Proxy-Cookie'] = pres.headers['set-cookie'];
      }
      if (pres.headers && pres.headers['last-modified']) {
        res.setHeader('Last-Modified', pres.headers['last-modified']);
        delete pres.headers['last-modified'];
      }
      if (pres.headers && pres.headers.expires) {
        res.setHeader('Expires', pres.headers.expires);
        delete pres.headers.expires;
      }
      if (pres.headers && pres.headers['cache-control']) {
        res.setHeader('Cache-Control', pres.headers['cache-control']);
        delete pres.headers['cache-control'];
      }
    }

    var size = parseInt(pres.headers['content-length'], 10) || false,
      buf = size ? new Buffer(size) : [],
      i = 0;

    pres.on('data', function (chunk) {
      if(!json)
        return res.write(chunk);

      if (size !== false)
        chunk.copy(buf, i, 0, chunk.length);
      else
        buf.push(chunk);

      i += chunk.length;
    });


    pres.on('end', function () {
      if(!json)
        return res.end();

      if (size === false) {
        buf = Buffer.concat(buf);
      }
      if (pres.headers['content-encoding'] === 'gzip') {
        zlib.gunzip(buf, function (err, data) {
          validateData(data, json);
        });
      } else {
        validateData(buf, json);
      }

      if (httpproxy) {
        httpproxy.abort();
        httpproxy.destroy();
        httpproxy = null;
      }
    });

    function validateData(data, toJson) {
      var regXml = new RegExp(/xml|octet-stream/);
      var regHtml = new RegExp(/text\/html/);
      if (regXml.test(pres.headers['content-type']) || (regHtml.test(pres.headers['content-type']) && toJson))
        validateXml(data, toJson);
      else
        validateJson(data);
    }

    function validateXml(data, toJson) {
      if (toJson) {
          try{
            var json = xml2json.toJson(data.toString('utf8'), {
              object: false,
              reversible: false,
              coerce: false,
              sanitize: false,
              trim: false
            });
            return returnJson(json);
          } catch (e){
            //try to fall back to json. Some servers say it is xml, but than it isnt :(
            try{
              var data = data.toString('utf8');
              JSON.parse(data)
              return returnJson(data);
            } catch(e){
            }
            return handle500(res);
          }
      }

      //return xml
      res.setHeader('Content-Type', 'application/xml');
      return res.end(data);
    }

    function validateJson(buf) {
      try {
        var data = buf.toString('utf-8');
        //try to parse
        JSON.parse(data);
        returnJson(data);
      } catch (e) {
        return handle403(res, params.url);
      }
    }

    function returnJson(data){
      if (callback) {
        data = callback + ' && ' + callback + '(' + data + ');';
        res.setHeader('Content-Type', 'text/javascript');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }
      return res.end(data);
    }
  };

}
