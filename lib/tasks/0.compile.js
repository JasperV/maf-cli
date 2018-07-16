'use strict'

const fs = require( 'fs' )
const path = require( 'path' )
const SourceMap = require( 'source-map' )
const SourceNode = SourceMap.SourceNode
const compiler = require( 'google-closure-compiler-js' ).compile
const formatter = require( '../util/closure-formatter-pretty' )
const storage = require( 'node-persist' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )
const getSpinner = require( '../util/spinner' )

function compile( done ) { compileWrapper( done ) }

compile.description = `Compile your MAF App with the Closure Compiler. ${ansi.gray( `Runs automatically while using other tasks.` )}`

maf.task( compile )

function include( src, folder, sourceMap ) {
  const code = `${fs.readFileSync( src, `utf8` )}\n`

  return code.split( `\n` ).forEach( ( line, lineNr ) => {
    console.log( lineNr, line )
    console.log( /include\s*\(\s*["'`]([^`'"\s]+)["'`]\s*\)/g.test( line ) )
    if ( /include\s*\(\s*["'`]([^`'"\s]+)["'`]\s*\)/g.test( line ) ) {
      console.log( 'do include' )
      include( `${folder}/${/include\s*\(\s*["'`]([^`'"\s]+)["'`]\s*\)/g.exec( line )[ 1 ]}`, folder, sourceMap )
    }
    else
      sourceMap.add( new SourceNode( ++lineNr, 0, src, `${line}\n` ) )
  } )
}

async function compileWrapper( done ) {
  await storage.init( { dir: path.resolve( process.cwd(), `./.maf` ) } )

  const config = maf.config
  const files = [].concat( require( path.resolve( process.cwd(), `./contents/metadata.json` ) ).scripts )
  const contentsPath = path.resolve( process.cwd(), `./contents/` )
  const scriptPath = path.resolve( contentsPath, files[ 0 ] )

  const sourceNode = new SourceNode()
  files.forEach( file => include( path.resolve( contentsPath, file ), contentsPath, sourceNode ) )

  let sourceMap = sourceNode.toStringWithSourceMap( { file: files[ 0 ], sourceRoot: process.cwd() } )

  const spinner = getSpinner( `Compiling` ).start()

  const out = compiler( {
    jsCode: [ {
      src: sourceMap.code
    , sourceMap: sourceMap.map.toJSON()
    , path: scriptPath
    } ]
  , createSourceMap: true
  , rewritePolyfills: false
  , languageIn: config && config.es6 ? `ES6` : `ES5`
  } )

  const messages = await formatter( out, sourceMap.map.toJSON() )

  sourceMap = ( out.sourceMap.file && out.sourceMap.sources.length ) ? out.sourceMap : sourceMap.map.toJSON()

  let code
  if ( out.compiledCode ) {
    code = out.compiledCode // + `\n//# sourceMappingURL=${files[ 0 ].split( `/` ).pop()}.map`
  } else code = `// Your App code did not compile without errors.`

  spinner.succeed( `Compiling done` )

  if ( messages ) console.log( messages )

  await storage.setItem( `compiledcode`, code )
  await storage.setItem( `sourcemap`, sourceMap )

  done()
}
