'use strict'

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

function sync( done ) {
  const identifier = process.cwd().split( `/` ).pop()

  console.log( `/package.json`, `/contents/metadata.json` )



  done()
}

sync.description = `Sync App metadata.json with package.json and vice versa.`

maf.task( sync )
