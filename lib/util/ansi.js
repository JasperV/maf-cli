'use strict'

const colors = require( 'ansi-colors' )
const supportsColor = require( 'color-support' )

const hasColors = colorize()

module.exports = {
  red: hasColors ? colors.red : noColor
, green: hasColors ? colors.green : noColor
, blue: hasColors ? colors.blue : noColor
, magenta: hasColors ? colors.magenta : noColor
, cyan: hasColors ? colors.cyan : noColor
, white: hasColors ? colors.white : noColor
, gray: hasColors ? colors.gray : noColor
, grey: hasColors ? colors.grey : noColor
, bold: hasColors ? colors.bold : noColor
, yellow: hasColors ? colors.yellow : noColor
, symbols: colors.symbols
, dim: colors.dim
, underline: colors.underline
}

function noColor( message ) { return message }

function hasFlag( flag ) {
  return ( process.argv.indexOf( `--${flag}` ) !== -1 )
}

function colorize() {
  if ( hasFlag( `no-color` ) ) return false
  if ( hasFlag( `color` ) ) return true
  return supportsColor()
}
