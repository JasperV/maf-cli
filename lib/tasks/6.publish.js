'use strict'

const fs = require( 'fs' )
const { promisify } = require( 'util' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

function remove() {
  return promisify( fs.unlink )( `${process.cwd().split( `/` ).pop()}.zip` )
}

const publish = maf.series( `package`, `upload`, `release`, remove )

publish.description = `Run ${ansi.yellow( `package` )}${ansi.white( `,` )} ${ansi.yellow( `upload` )} ${ansi.white( `and` )} ${ansi.yellow( `release` )} ${ansi.white( `in series.` )}`
publish.displayName = `publish`

maf.task( publish )
