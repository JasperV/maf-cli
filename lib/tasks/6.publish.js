'use strict'

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

const publish = maf.series( `package`, `upload`, `release` )

publish.description = `Run ${ansi.yellow( `package` )}${ansi.white( `,` )} ${ansi.yellow( `upload` )} ${ansi.white( `and` )} ${ansi.yellow( `release` )} ${ansi.white( `in series.` )}`

maf.task( `publish`, publish )
