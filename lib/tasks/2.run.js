'use strict'

const maf = require( '../maf.js' )

// TODO: detect not run before and do maf init

function run( done ) {
  console.log( 'hello from run' )
  done()
}

maf.task( 'run', run )

run.flags = { '--external': `Share your development environment.` }
