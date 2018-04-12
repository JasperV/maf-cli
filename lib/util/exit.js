'use strict'

function exit( code ) {
  if ( process.platform === 'win32' && process.stdout.bufferSize ) {
    process.stdout.once( 'drain', function() { process.exit( code ) } )
    return
  }

  process.exit( code )
}

module.exports = exit

/*

TODO

const SIGINT = `SIGINT`

process.once( SIGINT, stop )
process.once( `SIGTERM`, stop )
process.once( `SIGUSR2`, _ => process.kill( process.pid, `SIGUSR2` ) )

if ( process.platform === `win32` ) {
  createInterface( {
    input: process.stdin
  , output: process.stdout
  } ).on( SIGINT, _ => process.emit( SIGINT ) )
}

*/
