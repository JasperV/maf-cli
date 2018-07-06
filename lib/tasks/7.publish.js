'use strict'

const fs = require( 'fs' )
const notifier = require( 'node-notifier' )
const { promisify } = require( 'util' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

function remove() {
  return promisify( fs.unlink )( `${process.cwd().split( `/` ).pop()}.zip` )
}

function helpdesk( done ) {
  console.log( ansi.white( `Thank you for uploading your App version.` ) )
  console.log( ansi.yellow( `Go to http://bit.ly/stb-remote-access for requesting Settopbox Remote Acces.` ) )
  console.log( ansi.yellow( `Go to http://bit.ly/qa-request for creating a QA Request.` ) )

  notifier.notify( {
    title: `MAF🥉SDK`
  , message: `Publishing completed`
  , icon: path.resolve( __dirname, `../resources/logo.png` )
  } )

  done()
}

const publish = maf.series( `package`, `upload`, `release`, done => setTimeout( done, 2000 ), `store`, remove, helpdesk )

publish.description = `Run ${ansi.yellow( `package` )}${ansi.white( `,` )} ${ansi.yellow( `upload` )}${ansi.white( `,` )} ${ansi.yellow( `release` )} ${ansi.white( `and` )} ${ansi.yellow( `store` )} ${ansi.white( `in series.` )}`
publish.displayName = `publish`

maf.task( publish )
