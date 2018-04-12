'use strict'

const maf = require( '../maf.js' )

function packageApp( env, cb ) {
  const identifier = env.configBase.split( `/` ).pop()
  const zipFile = fs.createWriteStream( `${identifier}.zip` )
  const archive = archiver( `zip`, { zlib: { level: 9 } } )

  archive.on( `error`, err => { throw err } )
  zipFile.on( 'close', function() { if ( cb ) cb( env ) } )

  archive.append( null, { name: `${identifier}/` } )
  archive.append( null, { name: `${identifier}/Contents/` } )
  archive.directory( `./contents`, `${identifier}/Contents/` )
  archive.pipe( zipFile )
  archive.finalize()

  return true
}

maf.task( 'package', function( done ) {
  console.log( 'hello from package' )
  done()
} )

