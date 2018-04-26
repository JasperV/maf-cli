'use strict'

const router = require( 'express' ).Router()

router.get( `/proxy`, /*rawParser,*/ handleProxyRequest )
router.post( `/proxy`, /*rawParser,*/ ( req, res ) => handleProxyRequest( req, res, true ) )

module.exports = router

function handleProxyRequest( req, res, post, redirectUri ) {

  const params = req.query || {}
  post = req.body || post || false
  const uri = params.url

  if (!uri || uri.indexOf('http:///') === 0)
    return handle404(res);

  if (uri.indexOf('//') === 0) {
    uri = 'http:' + uri;
  } else if (uri.indexOf('http') !== 0 && uri.indexOf('ftp') !== 0) {
    uri = 'http://' + uri;
  }

  var options = url.parse(uri),
    ssl = false;

  switch(options.protocol) {
    case 'ftp:':
      return handle500(res);
    case 'https:':
      ssl = true;
    case 'http:':
      var rh = req.headers || {},
        json = (params.json === 'true') || (rh['x-proxy-json'] === 'true'),
        cookies = params.cookie || rh['x-proxy-cookie'] || false,
        callback = params.callback || rh['x-proxy-callback'] || false,
        nocache = (params.nocache === 'true') || (req.headers['x-proxy-nocache'] === 'true'),
        cache = params.cache || rh['x-proxy-cache'] || false,
        headers = JSON.parse(params.headers || rh['x-proxy-headers'] || null) || false,
        oauth = JSON.parse(params.oauth || rh['x-proxy-oauth'] || null) || false,
        metrological = (params.metrological === 'true') || (rh['x-proxy-metrological'] === 'true'),
        ip = (req.headers['x-forwarded-for'] ||  req.connection.remoteAddress || req.remoteAddress || '127.0.0.1').split(',').shift();

      options.headers = rh;
      options.headers['X-Forwarded-For'] = ip;

      delete options.headers.Via;
      delete options.headers.via;

      if (params.useragent || rh['x-proxy-useragent']) {
        options.headers['user-agent'] = params.useragent || rh['x-proxy-useragent'];
      }

      if (oauth) {
        var oa = null,
          conf = null;

        for (var site in oauthApps) {
          if (options.host.indexOf(site) != -1) {
            conf = oauthApps[site];
          }
        }

        if (conf === null) {
          handle500(res);
          return;
        }

        if (post) {
          oa = qs.parse(post) || {};
        } else {
          oa = qs.parse(options.query) || {};
        }

        for (var key1 in oauth) {
          oa['oauth_' + key1] = oauth[key1];
        }

        if (!oa.oauth_version) {
          oa.oauth_version = '1.0';
        }

        if (!oa.oauth_timestamp) {
          oa.oauth_timestamp = Math.floor(Date.now() / 1000).toString();
        }

        if (!oa.oauth_nonce) {
          oa.oauth_nonce = Math.ceil(Date.now() / Math.random());
        }

        oa.oauth_consumer_key = conf.key;
        oa.oauth_signature_method = 'HMAC-SHA1';

        var token_secret = oa.oauth_token_secret;

        delete oa.oauth_consumer_secret;
        delete oa.oauth_token_secret;

        var baseurl = options.protocol + '//' + options.host + options.pathname;
        var signature = hmacsign(req.method, baseurl, oa, conf.secret, token_secret);

        options.headers.Authorization = 'OAuth ' + Object.keys(oa).sort().map(function(key) {
          return key + '="' + rfc3986(oa[key]) + '"';
        }).join(',');
        options.headers.Authorization += ',oauth_signature="' + rfc3986(signature) + '"';
      }

      if (headers) {
        for (var key2 in headers) {
          options.headers[key2] = headers[key2];
        }
      }

      if (cookies === false) {
        delete options.headers.cookie;
      } else if (cookies !== 'true') {
        options.headers.cookie = cookies;
      }

      delete options.headers.host;
      if (metrological) {
        delete options.hostname;
        delete options.pathname;
        options.headers.host = options.host;
        if (options.port) {
          options.headers.port = options.port;
        }
        options.headers['Proxy-Authorization'] = 'Basic bWV0cm9sb2dpY2FsOm0zdHIwIzA4';
        options['host'] = '10.1.6.1';
        options.port = 3128;
        options.path = uri;
      } else if (params.unescape === 'true') {
        options.path = unescape(options.path);
      }

      options.method = req.method;

      delete options.headers['x-requested-with'];
      delete options.headers['x-request'];
      delete options.headers.referer;
      delete options.headers.origin;
      delete options.headers.accept;

      var httpproxy = null;
      var handleproxy = function(pres) {
        switch(pres.statusCode) {
          case 301:
          case 302:
            var redirect = pres.headers.location;
            if (httpproxy !== null) {
              httpproxy.abort();
              httpproxy.destroy();
              httpproxy = null;
            }
            if (redirect !== uri) {
              return handleProxyRequest(req, res, post,redirect);
            } else {
              return handle404(res);
            }
            break;
          case 304:
            if (httpproxy !== null) {
              httpproxy.abort();
              httpproxy.destroy();
              httpproxy = null;
            }
            res.writeHead(pres.statusCode, pres.headers);
            return res.end();
          default:
            break;
        }


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

      httpproxy = ssl ? https.request(options, handleproxy) : http.request(options, handleproxy);

      httpproxy.on('error', function(e) {
        if (httpproxy) {
          httpproxy.abort();
          httpproxy.destroy();
          httpproxy = null;
        }
        handle500(res);
      });

      if (post) {
          httpproxy.write(req.rawBody);
      }

      httpproxy.end();
      break;
    default:
      handle500(res);
      break;
  }
}
