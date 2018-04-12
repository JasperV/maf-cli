'use strict'

const maf = require( '../maf.js' )

maf.task( 'run', function( done ) {
  console.log( 'hello from run' )
  done()
} )
