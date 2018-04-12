'use strict'

const archy = require( 'archy' )

const sortBy = require( 'array-sort' )
const isObject = require( 'isobject' )

const ansi = require( '../util/ansi' )
const copyTree = require( './copy-tree' )

function logTasks( tree, opts, getTask ) {
  const lineInfos = []
  const entryObserver = getLineInfoCollector( lineInfos )
  const nodeFactory = getNodeFactory( getTask, entryObserver )

  tree = copyTree( tree, opts, nodeFactory )

  const spacer = getSpacerForLineIndents( tree, lineInfos )
  const lines = getLinesContainingOnlyBranches( tree )

  console.info( tree.label )

  printTreeList( lines, spacer, lineInfos )
}

function getLineInfoCollector( lineInfos ) {
  return {
    topTask( node ) {
      lineInfos.push( {
        name: node.label
      , desc: node.desc
      , type: `top`
      } )
    }
  , option( opt ) {
      lineInfos.push( {
        name: opt.label
      , desc: opt.desc
      , type: `option`
      } )
    }
  , childTask( node ) {
      lineInfos.push( {
        name: node.label
      , type: `child`
      } )
    }
  }
}

function getNodeFactory( getTask, entryObserver ) {
  return {
    topNode( node ) { return { label: node.label } }

  , taskNode( node ) {
      const task = getTask( node.label ) || {}

      const newNode = {
        label: node.label
      , desc: typeof task.description === `string` ? task.description : ``
      , opts: []
      }

      entryObserver.topTask( newNode )

      if ( isObject( task.flags ) ) {
        Object.keys( task.flags ).sort().forEach( function( flag ) {
          if ( flag.length === 0 ) return

          const opt = {
            label: flag
          , desc: typeof task.flags[ flag ] === `string` ? task.flags[ flag ] : ``
          }

          entryObserver.option( opt )
          newNode.opts.push( opt )
          newNode.label += `\n` + opt.label
        } )
      }

      return newNode
    }

  , childNode( node ) {
      const newChild = { label: node.label }

      entryObserver.childTask( newChild )

      newChild.label = ``

      return newChild
    }
  }
}

function getSpacerForLineIndents(tree, lineInfos) {
  let maxSize = 0
  const sizes = []

  archy( tree )
    .split( `\n` )
    .slice( 1, -1 )
    .forEach( ( line, index ) => {
      const info = lineInfos[ index ]

      if ( info.type === `top` || info.type === `option` ) {
        maxSize = Math.max( maxSize, line.length )
        sizes.push( line.length )
      } else sizes.push( 0 )
    } )

  maxSize += 3

  return index => Array( maxSize - sizes[ index ] ).join( ` ` )
}

function getLinesContainingOnlyBranches( tree ) {
  tree.nodes.forEach( node => {
    node.label = ``

    node.opts.forEach( _ => node.label += `\n` )
  } )

  return archy( tree )
    .split( `\n` )
    .slice( 1, -1 )
}

function printTreeList( lines, spacer, lineInfos ) {
  lines.forEach( ( branch, index ) => {
    const info = lineInfos[ index ]

    let line = ansi.white( branch )

    if ( info.type === `top` ) {
      line += ansi.cyan( info.name )

      if (info.desc.length > 0 )
        line += spacer( index ) + ansi.white( info.desc )

    } else if ( info.type === `option` ) {
      line += ansi.magenta( info.name )

      if ( info.desc.length > 0 ) {
        line += spacer( index ) + ansi.white( `…${info.desc}` )
      }
    } else line += ansi.white( info.name )

    console.info( line )
  } )
}

module.exports = logTasks
