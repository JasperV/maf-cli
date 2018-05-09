'use strict'

const path = require( 'path' )
const plur = require( 'plur' )
const chalk = require( 'chalk' )
const logSymbols = require( 'log-symbols' )
const stringWidth = require( 'string-width' )
const ansiEscapes = require( 'ansi-escapes' )
const SourceMap = require( 'source-map' )
const SourceMapConsumer = SourceMap.SourceMapConsumer

function trace( items, severity, results, sourceMap ) {
  return Promise.all(
    items.map( async item => {
      const consumer = await new SourceMapConsumer( sourceMap )
      const original = consumer.originalPositionFor( {
        line: item.lineNo
      , column: item.charNo
      } )

      consumer.destroy()

      if ( !results[ original.source ] ) results[ original.source ] = []

      results[ original.source ].push( {
        line: original.line
      , column: original.column
      , description: item.description
      , kind: item.type
      , file: item.file
      , severity
      } )
    } )
  )
}

module.exports = async ( result, sourceMap ) => {
  const results = {}
  const lines = []
  const errors = result.errors
  const warnings = result.warnings
  const errorCount = errors.length
  const warningCount = warnings.length
  let maxLineWidth = 0
  let maxColumnWidth = 0
  let maxMessageWidth = 0
  let showLineNumbers = false

  if (
    ( !errors && !warnings ) ||
    ( !errorCount && !warningCount )
  ) return ``

  if ( result.sourceMap.file && result.sourceMap.sources.length )
    sourceMap = result.sourceMap

  if ( errorCount ) await trace( errors, `error`, results, sourceMap )
  if ( warningCount ) await trace( warnings, `warning`, results, sourceMap )

  for ( let [ file, messages ] of Object.entries( results ) ) {
    lines.push( {
      type: `header`
    , filePath: file
    , relativeFilePath: path.relative( '.', file )
    , firstLineCol: `${messages[ 0 ].line}:${messages[ 0 ].column}`
    } )

    lines.push( { type: `separator` } )

    messages.forEach( x => {
      const message = x.description.replace(
        /\B`(.*?)`\B|\B'(.*?)'\B/g
      , ( m, p1, p2 ) => chalk.bold( p1 || p2 )
      )

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
      , kind: x.kind
      , severity: x.severity
      , line
      , lineWidth
      , column
      , columnWidth
      , message
      , messageWidth
      } )
    } )
  }

  let output = `\n`

  if ( process.stdout.isTTY && !process.env.CI ) output += ansiEscapes.iTerm.setCwd()

  output += lines.map( x => {
    if ( x.type === `header` ) {
      const position = showLineNumbers ? chalk.hidden.dim.gray( `:${x.firstLineCol}` ) : ``
      return `  ${chalk.underline( x.relativeFilePath )}${position}`
    }

    if ( x.type === `message` ) {
      const line = [
        ``,
        x.severity === `warning` ? logSymbols.warning : logSymbols.error
      , ' '.repeat( maxLineWidth - x.lineWidth ) + chalk.dim( `${x.line}${chalk.gray( `:` )}${x.column}` )
      , ' '.repeat( maxColumnWidth - x.columnWidth ) + x.message
      , ' '.repeat( maxMessageWidth - x.messageWidth ) + chalk.gray.dim( x.kind )
      ]

      if ( !showLineNumbers ) line.splice( 2, 1 )

      return line.join( `  ` )
    }

    return ``
  } ).join( `\n` ) + `\n\n`

  if ( errorCount > 0 )
    output += `  ${chalk.red( `${errorCount} ${plur( `error`, errorCount )}` )}\n`

  if ( warningCount > 0 )
    output += `  ${chalk.yellow( `${warningCount} ${plur( `warning`, warningCount )}` )}\n`

  return output
}
