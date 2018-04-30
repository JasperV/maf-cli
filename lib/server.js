#!/usr/bin/env node

'use strict'

// TODO: refactor

const os = require( `os` )
const http = require( 'http' )
const https = require( 'https' )
const express = require( 'express' )
const morgan = require( 'morgan' )
const compression = require( 'compression' )

const ansi = require( './util/ansi' )

const port = process.env.NODE_PORT || 8080
const securePort = process.env.NODE_SECURE_PORT || 8443

const app = express()

// http.globalAgent.maxSockets = Infinity
// https.globalAgent.maxSockets = Infinity

function startServer( storeConfig, appMeta ) {
  app.disable( `x-powered-by` )

  app.use( morgan( `dev` ) )
  app.use( compression() )

  app.use( require( './routes/index' )( storeConfig, appMeta ) )
  app.use( require( './routes/ip' ) )
  app.use( require( './routes/proxy' ) )

  app.use( ( req, res ) => res.status( 404 ).send( `404 - Not Found` ) )

  app.use( ( err, req, res ) => {
    console.error( err.stack )
    res.status( 500 ).send( `500 - Internal Server Error` )
  } )

  const server = http.createServer( app )

  require( './util/terminus' )( server )

  // TODO: refactor for http + https
  server.listen( port, _ => {
    const hosts = []
    const ifaces = os.networkInterfaces()

    Object.keys( ifaces ).forEach( dev => {
      ifaces[ dev ].forEach( details => {
        if ( details.family === `IPv4` ) hosts.push( details.address )
      } )
    } )

    hosts.push( `localhost` )

    hosts.push( os.hostname() )

    // process.send( { hosts, port, secure: false } )
  } )
}

process.on( `message`, m => {
  if ( m.start ) startServer( m.storeConfig, m.meta )
} )








/*
  crypto = require('crypto'),
  zlib = require('zlib'),
  bodyParser = require('body-parser'),
  qs = require('querystring'),
  xml2json = require('xml2json'),

var logger = {
  info: console.log,
  request: function (req, res, error) {
    var date = utc ? new Date().toUTCString() : new Date();
    if (error) {
      logger.info(
        '[%s] "%s %s" Error (%s): "%s"',
        date, colors.red(req.method), colors.red(req.url),
        colors.red(error.status.toString()), colors.red(error.message)
      );
    } else {
      logger.info(
        '[%s] "%s %s" "%s"',
        date, colors.cyan(req.method), colors.cyan(req.url),
        req.headers['user-agent']
      );
    }
  }
};

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

app.get( '/lint/:identifier', urlParser, function( req, res ) {
  function stripComments( str ) {
    return str.replace( /(?:\/\*(?:[\s\S]*?)\*\/)|(?:[\s]+\/\/(?:.*)$)/gm, '' );
  }

  function include( src, folder, sourceMap ) {
    var code = fs.readFileSync( src, 'utf8' ) + '\n';

    return code.split( '\n' ).forEach( function( line, lineNr ) {
      if ( /include\s*\(\s*["']([^'"\s]+)["']\s*\)/g.test( line ) )
        include( folder + /include\s*\(\s*["']([^'"\s]+)["']\s*\)/g.exec( line )[ 1 ], folder, sourceMap );
      else
        sourceMap.add( new SourceNode( ++lineNr, 0, src, line + '\n' ) );
    } );
  }

  function writeToConsole( type, message ) {
    return 'console.' + type + '("' + message + '");';
  }

  var shortLinks = { 'no-cond-assign': 'vPonv', 'no-console': 'vPonf', 'no-constant-condition': 'vPonJ', 'no-control-regex': 'vPonU', 'no-debugger': 'vPonT', 'no-dupe-args': 'vPonk', 'no-dupe-keys': 'vPonI', 'no-duplicate-case': 'vPoC2', 'no-empty': 'vPoCa', 'no-empty-character-class': 'vPoCV', 'no-ex-assign': 'vPoCw', 'no-extra-boolean-cast': 'vPoCr', 'no-extra-parens': 'vPoCo', 'no-extra-semi': 'vPoCK', 'no-func-assign': 'vPoC6', 'no-inner-declarations': 'vPoCi', 'no-invalid-regexp': 'vPoCP', 'no-irregular-whitespace': 'vPoCX', 'no-negated-in-lhs': 'vPoC1', 'no-obj-calls': 'vPoCM', 'no-prototype-builtins': 'vPoCD', 'no-regex-spaces': 'vPoCS', 'no-sparse-arrays': 'vPoC9', 'no-unexpected-multiline': 'vPoCH', 'no-unreachable': 'vPoCQ', 'no-unsafe-finally': 'vPoC7', 'use-isnan': 'vPoC5', 'valid-jsdoc': 'vPoCd', 'valid-typeof': 'vPoCF', 'accessor-pairs': 'vPoCb', 'array-callback-return': 'vPoCA', 'block-scoped-var': 'vPoCx', 'complexity': 'vPoCp', 'consistent-return': 'vPoCh', 'curly': 'vPoCj', 'default-case': 'vPoWe', 'dot-location': 'vPoWv', 'dot-notation': 'vPoWf', 'eqeqeq': 'vPoWJ', 'guard-for-in': 'vPoWU', 'no-alert': 'vPoWT', 'no-caller': 'vPoWk', 'no-case-declarations': 'vPoWI', 'no-div-regex': 'vPoWL', 'no-else-return': 'vPoWt', 'no-empty-function': 'vPoWq', 'no-empty-pattern': 'vPoWm', 'no-eq-null': 'vPoWY', 'no-eval': 'vPoWO', 'no-extend-native': 'vPoW3', 'no-extra-bind': 'vPoWs', 'no-extra-label': 'vPoWG', 'no-fallthrough': 'vPoWZ', 'no-floating-decimal': 'vPoWn', 'no-implicit-coercion': 'vPoWc', 'no-implicit-globals': 'vPoWC', 'no-implied-eval': 'vPoWW', 'no-invalid-this': 'vPoWl', 'no-iterator': 'vPoW8', 'no-labels': 'vPoW4', 'no-lone-blocks': 'vPoWB', 'no-loop-func': 'vPoWR', 'no-magic-numbers': 'vPoW0', 'no-multi-spaces': 'vPoWE', 'no-multi-str': 'vPoWu', 'no-native-reassign': 'vPoWz', 'no-new': 'vPoWg', 'no-new-func': 'vPoW2', 'no-new-wrappers': 'vPoWa', 'no-octal': 'vPoWV', 'no-octal-escape': 'vPoWw', 'no-param-reassign': 'vPoWr', 'no-proto': 'vPoWo', 'no-redeclare': 'vPoWK', 'no-return-assign': 'vPoW6', 'no-script-url': 'vPoWi', 'no-self-assign': 'vPoWP', 'no-self-compare': 'vPoWX', 'no-sequences': 'vPoW1', 'no-throw-literal': 'vPoWM', 'no-unmodified-loop-condition': 'vPoWD', 'no-unused-expressions': 'vPoWy', 'no-unused-labels': 'vPoWS', 'no-useless-call': 'vPoW9', 'no-useless-concat': 'vPoWH', 'no-useless-escape': 'vPoWQ', 'no-void': 'vPoW7', 'no-warning-comments': 'vPoW5', 'no-with': 'vPoWd', 'radix': 'vPoWF', 'vars-on-top': 'vPoWb', 'wrap-iife': 'vPoWN', 'yoda': 'vPoWA', 'strict': 'vPoWx', 'init-declarations': 'vPoWp', 'no-catch-shadow': 'vPoWh', 'no-delete-var': 'vPoWj', 'no-label-var': 'vPole', 'no-restricted-globals': 'vPolf', 'no-shadow': 'vPolJ', 'no-shadow-restricted-names': 'vPolU', 'no-undef': 'vPolT', 'no-undef-init': 'vPolk', 'no-undefined': 'vPolI', 'no-unused-vars': 'vPolt', 'no-use-before-define': 'vPolq', 'callback-return': 'vPolm', 'global-require': 'vPolY', 'handle-callback-err': 'vPolO', 'no-mixed-requires': 'vPol3', 'no-new-require': 'vPols', 'no-path-concat': 'vPolG', 'no-process-env': 'vPolZ', 'no-process-exit': 'vPoln', 'no-restricted-modules': 'vPolc', 'no-sync': 'vPolC', 'array-bracket-spacing': 'vPolW', 'block-spacing': 'vPoll', 'brace-style': 'vPol8', 'camelcase': 'vPol4', 'comma-dangle': 'vPolB', 'comma-spacing': 'vPolR', 'comma-style': 'vPolE', 'computed-property-spacing': 'vPolu', 'consistent-this': 'vPolz', 'eol-last': 'vPolg', 'func-names': 'vPol2', 'func-style': 'vPola', 'id-blacklist': 'vPolV', 'id-length': 'vPolw', 'id-match': 'vPolr', 'indent': 'vPolK', 'jsx-quotes': 'vPol6', 'key-spacing': 'vPoli', 'keyword-spacing': 'vPolP', 'linebreak-style': 'vPolX', 'lines-around-comment': 'vPol1', 'max-depth': 'vPolM', 'max-len': 'vPolD', 'max-lines': 'vPoly', 'max-nested-callbacks': 'vPolS', 'max-params': 'vPol9', 'max-statements': 'vPolH', 'max-statements-per-line': 'vPolQ', 'multiline-ternary': 'vPol7', 'new-cap': 'vPol5', 'new-parens': 'vPold', 'newline-after-var': 'vPolF', 'newline-before-return': 'vPolb', 'newline-per-chained-call': 'vPolN', 'no-array-constructor': 'vPolA', 'no-bitwise': 'vPolx', 'no-continue': 'vPolp', 'no-inline-comments': 'vPolh', 'no-lonely-if': 'vPolj', 'no-mixed-operators': 'vPo8e', 'no-mixed-spaces-and-tabs': 'vPo8v', 'no-multiple-empty-lines': 'vPo8f', 'no-negated-condition': 'vPo8J', 'no-nested-ternary': 'vPo8U', 'no-new-object': 'vPo8k', 'no-plusplus': 'vPo8I', 'no-restricted-syntax': 'vPo8L', 'no-spaced-func': 'vPo8t', 'no-ternary': 'vPo8q', 'no-trailing-spaces': 'vPo8m', 'no-underscore-dangle': 'vPo8Y', 'no-unneeded-ternary': 'vPo8O', 'no-whitespace-before-property': 'vPo83', 'object-curly-newline': 'vPo8s', 'object-curly-spacing': 'vPo8G', 'object-property-newline': 'vPo8Z', 'one-var': 'vPo8n', 'one-var-declaration-per-line': 'vPo8c', 'operator-assignment': 'vPo8C', 'operator-linebreak': 'vPo8W', 'padded-blocks': 'vPo8l', 'quote-props': 'vPo88', 'quotes': 'vPo84', 'require-jsdoc': 'vPo8B', 'semi': 'vPo8R', 'semi-spacing': 'vPo80', 'sort-vars': 'vPo8E', 'space-before-blocks': 'vPo8u', 'space-before-function-paren': 'vPo8z', 'space-in-parens': 'vPo8g', 'space-infix-ops': 'vPo82', 'space-unary-ops': 'vPo8a', 'spaced-comment': 'vPo8V', 'unicode-bom': 'vPo8w', 'wrap-regex': 'vPo8r', 'arrow-body-style': 'vPo8o', 'arrow-parens': 'vPo8K', 'arrow-spacing': 'vPo86', 'constructor-super': 'vPo8i', 'generator-star-spacing': 'vPo8P', 'no-class-assign': 'vPo8X', 'no-confusing-arrow': 'vPo81', 'no-const-assign': 'vPo8M', 'no-dupe-class-members': 'vPo8D', 'no-duplicate-imports': 'vPo8y', 'no-new-symbol': 'vPo89', 'no-restricted-imports': 'vPo8H', 'no-this-before-super': 'vPo8Q', 'no-useless-computed-key': 'vPo87', 'no-useless-constructor': 'vPo85', 'no-useless-rename': 'vPo8d', 'no-var': 'vPo8F', 'object-shorthand': 'vPo8b', 'prefer-arrow-callback': 'vPo8N', 'prefer-const': 'vPo8A', 'prefer-reflect': 'vPo8x', 'prefer-rest-params': 'vPo8p', 'prefer-spread': 'vPo8h', 'prefer-template': 'vPo8j', 'require-yield': 'vPo4e', 'rest-spread-spacing': 'vPo4v', 'sort-imports': 'vPo4f', 'template-curly-spacing': 'vPo4J', 'yield-star-spacing': 'vPo4U' };

  var cli               = new ( require( 'eslint' ).CLIEngine );
  var SourceMap         = require( 'source-map' );
  var SourceNode        = SourceMap.SourceNode;
  var SourceMapConsumer = SourceMap.SourceMapConsumer;
  var messages          = [];
  var identifier        = req.params.identifier;
  var appPath           = path.join( __dirname, './apps/' + identifier );
  var contentsPath      = appPath + '/Contents/';
  var metadataPath      = contentsPath + 'metadata.json';
  var severities        = [ 'log', 'warn', 'error' ];

  if (
    !req.params.identifier ||
    !fs.existsSync( appPath ) ||
    !fs.existsSync( contentsPath ) ||
    !fs.existsSync( metadataPath )
  ) return res.end();

  var metadata   = require( metadataPath );
  var scriptPath = contentsPath + metadata.scripts;

  if (
    !fs.existsSync( scriptPath ) ||
    metadata.identifier !== identifier
  ) return res.end();

  var sourceNode = new SourceNode();
  include( scriptPath, contentsPath, sourceNode );

  var sourceMap = sourceNode.toStringWithSourceMap( {
    file: metadata.scripts,
    sourceRoot: contentsPath.replace( './', '/' ) + '/'
  } );

  var lintResults      = cli.executeOnText( sourceMap.code, scriptPath );
  sourceMap            = sourceMap.map.toJSON();
  sourceMap.sourceRoot = '';
  var smc              = new SourceMapConsumer( sourceMap );

  messages.push(
    writeToConsole(
      'group'
    , '%cMAF SDK - Lint results for: ' + identifier + ' ", "font-weight:bold;font-size:larger;'
    )
  );

  messages.push(
    writeToConsole(
      'info'
    , '%c' + lintResults.errorCount + ' Errors %cand ' +
      '%c' + lintResults.warningCount + ' Warnings. %cErrors need to be fixed for your App to be accepted."' +
      ', "color:red; font-weight:bold;", "color:grey; font-weight:normal;",' +
      '"font-weight:bold;color:orange;", "color:grey;'
    )
  );

  lintResults = lintResults && lintResults.results && lintResults.results[ 0 ];

  if (
    !lintResults ||
    !lintResults.messages ||
    !lintResults.messages.length
  ) return res.end();

  lintResults.messages.forEach( function( message ) {
    var originalSource = smc.originalPositionFor( {
      line: message.line,
      column: message.column
    } );

    message.line   = originalSource.line;
    message.column = originalSource.column;
    message.source = originalSource.source.replace( contentsPath, '' );
    message.link   = 'https://git.io/' + shortLinks[ message.ruleId ];
  } );

  sourceMap.sources = sourceMap.sources.map( function( source ) {
    return source.replace( contentsPath, '' );
  } );

  lintResults.messages.forEach( function( message ) {
    messages.push(
      writeToConsole(
        severities[ message.severity ]
      , message.source + ' %c[' + message.line + ':' + message.column + '] %c' +
        message.message.replace( /"/g, '\\"' ).replace( /\\\\"/g, '\\"' ) +
        ' %c' + message.link + '", "color:black;", "font-weight:bold;color:red;", "color:black;'
      )
    );
  } );

  messages.push( 'console.groupEnd();' );

  return res.type( 'text/javascript' ).send( messages.join( '' ) );
} );

https.createServer({
  key: fs.readFileSync('MAF3SDK.key', 'utf8'),
  cert: fs.readFileSync('MAF3SDK.crt', 'utf8')
}, app).listen(securePort);
*/
