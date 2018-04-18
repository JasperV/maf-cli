'use strict'

const ora = require( 'ora' )

function getSpinner( text ) {
  return ora( {
    text
  , spinner: `dots2`
  , color: `white`
  } ).start()
}

module.exports = getSpinner
