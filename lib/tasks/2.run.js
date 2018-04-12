'use strict'

const maf = require( '../maf.js' )

// TODO: detect not run before and do maf init

maf.task( 'run', function( done ) {
  console.log( 'hello from run' )
  done()
} )
