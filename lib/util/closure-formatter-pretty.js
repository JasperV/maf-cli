'use strict'

const path = require( 'path' )
const plur = require( 'plur' )
const chalk = require( 'chalk' )
const logSymbols = require( 'log-symbols' )
const stringWidth = require( 'string-width' )
const ansiEscapes = require( 'ansi-escapes' )

module.exports = results => {
  const lines = []

  console.log( results )

  let errorCount = 0
  let warningCount = 0
  let totalCount = 0
  let maxLineWidth = 0
  let maxColumnWidth = 0
  let maxMessageWidth = 0
  let showLineNumbers = false

  // results
  //   .sort( ( a, b ) => a.messages - b.messages )
  //   .forEach( result => {
  //     const messages = result.messages

      if ( results.errors.length === 0 ) return

  //     // errorCount += result.errorCount
  //     // warningCount += result.warningCount
  //     totalCount += messages.length

  //     if ( lines.length !== 0 ) lines.push( { type: `separator` } )

  //     const filePath = result.filePath

  //     lines.push( {
  //       type: `header`
  //     , filePath
  //     , relativeFilePath: path.relative( '.', filePath )
  //     , firstLineCol: `${messages[ 0 ].line}:${messages[ 0 ].column}`
  //     } )

  results.errors.forEach( x => {
    let message = x.description

    // Stylize inline code blocks
    message = message.replace(/\B`(.*?)`\B|\B'(.*?)'\B/g, ( m, p1, p2 ) => chalk.bold( p1 || p2 ) )

    const line = String( x.line || 0 )
    const column = String( x.column || 0 )
    const lineWidth = stringWidth( line )
    const columnWidth = stringWidth( column )
    const messageWidth = stringWidth( message )

    maxLineWidth = Math.max( lineWidth, maxLineWidth )
    maxColumnWidth = Math.max( columnWidth, maxColumnWidth )
    maxMessageWidth = Math.max( messageWidth, maxMessageWidth )
    showLineNumbers = showLineNumbers || x.line || x.column

    lines.push( {
      type: `message`
    , severity: 'error' // 'warning'
    , line
    , lineWidth
    , column
    , columnWidth
    , message
    , messageWidth
    } )
  } )

  let output = `\n`

  if ( process.stdout.isTTY && !process.env.CI ) output += ansiEscapes.iTerm.setCwd()

  output += lines.map( x => {
    if ( x.type === 'header' ) {
      const position = showLineNumbers ? chalk.hidden.dim.gray(`:${x.firstLineCol}`) : ``
      return `  ${chalk.underline(x.relativeFilePath)}${position}`
    }

    if ( x.type === `message` ) {
      const line = [
        ``,
        x.severity === `warning` ? logSymbols.warning : logSymbols.error
      , ' '.repeat( maxLineWidth - x.lineWidth ) + chalk.dim(x.line + chalk.gray(':') + x.column)
      , ' '.repeat( maxColumnWidth - x.columnWidth ) + x.message
      , ' '.repeat( maxMessageWidth - x.messageWidth ) + chalk.gray.dim(x.ruleId)
      ]

      if ( !showLineNumbers ) line.splice( 2, 1 )

      return line.join( `  ` )
    }

    return ``
  } ).join( `\n` ) + `\n\n`

  if ( results.warnings.length > 0 )
    output += `  ` + chalk.yellow(`${warningCount} ${plur('warning', warningCount)}`) + '\n'

  if ( results.errors.length > 0 )
    output += '  ' + chalk.red(`${errorCount} ${plur('error', errorCount)}`) + '\n'

console.log( output )

  return ( errorCount + warningCount ) > 0 ? output : ''
}
