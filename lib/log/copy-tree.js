'use strict'

function copyNode( node ) {
  const newNode = {}

  Object.keys( node ).forEach( key => newNode[ key ] = node[ key ] )

  return newNode
}

const defaultNodeFactory = {
  topNode: copyNode
, taskNode: copyNode
, childNode: copyNode
}

function copyTree( tree, opts = {}, nodeFactory = defaultNodeFactory ) {
  let depth = opts.tasksDepth

  depth = typeof depth === `number` ? ( ( depth < 1 ) ? 1 : depth ) : null

  const newTree = nodeFactory.topNode( tree )
  newTree.nodes = []

  if ( Array.isArray( tree.nodes ) ) tree.nodes.forEach( visit )

  function visit( node ) {
    const newNode = nodeFactory.taskNode( node )
    newNode.nodes = []
    newTree.nodes.push( newNode )

    if ( !depth || depth > 1 )
      forEach( node.nodes, copyRecursively, depth, 2, newNode )
  }

  function copyNotRecursively( child, newParent ) {
    const newChild = nodeFactory.childNode( child )
    newChild.nodes = []
    newParent.nodes.push( newChild )

    if ( child.branch ) forEach( child.nodes, copyNotRecursively, newChild )
  }

  function copyRecursively( child, maxDepth, nowDepth, newParent ) {
    const newChild = nodeFactory.childNode( child )
    newChild.nodes = []
    newParent.nodes.push( newChild )

    if ( !maxDepth || maxDepth > nowDepth )
      forEach( child.nodes, copyRecursively, maxDepth, nowDepth + 1, newChild )
  }

  return newTree
}

function forEach( nodes, fn, ...args ) {
  if ( !Array.isArray( nodes ) ) return

  for ( let i = 0, n = nodes.length; i < n; i++ ) {
    fn.apply( nodes[ i ], [ nodes[ i ] ].concat( args ) )
  }
}

module.exports = copyTree
