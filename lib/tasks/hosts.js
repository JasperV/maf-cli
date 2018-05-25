'use strict'

const hostile = require( 'hostile' )
const argv = require( 'yargs' ).argv

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

const off = process.argv.indexOf( `--off` ) !== -1
const on = process.argv.indexOf( `--on` ) !== -1
const list = process.argv.indexOf( `--list` ) !== -1

const hosts = function( done ) {
  if ( on )
    hostile.set( `127.0.0.1`, `maf`, err => {
      if ( err ) throw new Error( ansi.red( err ) )
    } )

  if ( off )
    hostile.remove( `127.0.0.1`, `maf`, err => {
      if ( err ) throw new Error( ansi.red( err ) )
    } )

  if ( list )
    hostile.get( false, ( err, lines ) => {
      if ( err ) throw new Error( ansi.red( err ) )
      lines.forEach( line => console.log( `${line[ 1 ]} -> ${line[ 0 ]}` ) )
    } )

  done()
}

hosts.description = `Update your hosts file to use https://maf.`
hosts.displayName = `hosts`

hosts.flags = {
  '--on': `Enable, ${ansi.yellow( `requires to be run as root.` )}`
, '--off': `Disable, ${ansi.yellow( `requires to be run as root.` )}`
, '--list': `List all entries.`
}

maf.task( hosts )
