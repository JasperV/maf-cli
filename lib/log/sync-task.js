'use strict'

var ansi = require( '../util/ansi' )

const tasks = {}

function warn() {
  const taskKeys = Object.keys( tasks )

  if ( !taskKeys.length ) return

  const taskNames = taskKeys.map( key => tasks[ key ] ).join( `, ` )

  process.exitCode = 1

  console.warn(
    ansi.red( `The following tasks did not complete:` )
  , ansi.cyan( taskNames )
  )

  console.warn( ansi.red( `Did you forget to signal async completion?` ) )
}

function start( e ) { tasks[ e.uid ] = e.name }

function clear( e ) { delete tasks[ e.uid ] }

function logSyncTask( maf ) {
  process.once( `exit`, warn )

  maf.on( `start`, start )
  maf.on( `stop`, clear )
  maf.on( `error`, clear )
}

module.exports = logSyncTask
