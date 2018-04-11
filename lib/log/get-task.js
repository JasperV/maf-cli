'use strict'

const isObject = require( 'isobject' )

function getTask( maf ) {
  return function( name ) {
    const task = maf.task( name )
    return {
      description: getDescription( task )
    , flags: getFlags( task )
    }
  }
}

function getDescription( task ) {
  if ( typeof task.description === `string` ) return task.description

  if ( typeof task.unwrap === `function` ) {
    const origFn = task.unwrap()

    if ( typeof origFn.description === 'string' ) return origFn.description
  }

  return undefined
}

function getFlags( task ) {
  if ( isObject( task.flags ) ) return task.flags

  if ( typeof task.unwrap === `function` ) {
    const origFn = task.unwrap()

    if ( isObject( origFn.flags ) ) return origFn.flags
  }

  return undefined
}

module.exports = getTask
