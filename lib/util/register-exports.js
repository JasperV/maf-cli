'use strict'

function registerExports( maf, props ) {
  const propNames = Object.keys( props )

  if ( propNames.length ) {
    maf.config = {}
    propNames.forEach( register )
  }

  function register( propName ) {
    const prop = props[ propName ]

    if ( typeof prop !== `function` ) {
      maf.config[ propName ] = prop
      return
    }

    maf.task( propName, prop )
  }
}

module.exports = registerExports
