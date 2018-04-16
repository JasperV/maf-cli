'use strict'

const maf = require( '../maf.js' )

maf.task( `publish`, maf.series( `package`, `upload`, `release` ) )
