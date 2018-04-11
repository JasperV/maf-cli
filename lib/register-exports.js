'use strict'

function registerExports( maf, tasks ) {
  const taskNames = Object.keys( tasks )

  if ( taskNames.length ) taskNames.forEach( register )

  function register( taskName ) {
    const task = tasks[ taskName ]

    if ( typeof task !== `function` ) return

    maf.task( taskName, task )
  }
}

module.exports = registerExports
