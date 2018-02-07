const { inspect } = require( 'util' )
const methods = [ `log`, `info`, `warn`, `error`, `debug` ]

function colorize( arg ) {
  return inspect( arg, { colors: true } )
}

methods.forEach( method => {
  const original = console[ method ]

  console[ method ] = ( ...args ) => original.call(
    console
  , ...args.map( colorize )
  )
} )
