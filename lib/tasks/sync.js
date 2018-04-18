'use strict'

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

function sync( done ) {
  const identifier = process.cwd().split( `/` ).pop()

  console.log( `/package.json`, `/contents/metadata.json` )

  /*
    maf.watch( [ `${env.configBase}/package.json`, `${env.configBase}/contents/metadata.json` ], function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    } )
  */

  done()
}

sync.description = `Sync App metadata.json with package.json and vice versa.`

maf.task( `sync`, sync )
