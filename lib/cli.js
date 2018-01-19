#!/usr/bin/env node

import { config } from 'dotenv'

config()

import path from 'path'
import util from 'util'
import { fork } from 'child_process'

import blessed from 'blessed'
import contrib from 'blessed-contrib'

import * as metadata from '../package.json'

const oldLog = console.log

console.log = function() {
  oldLog( util.inspect( ...arguments, { depth: 5, colors: true } ) )
}



import appMeta from 'maf-metadata'
console.log( appMeta )



const screen = blessed.screen( { smartCSR: true } )

screen.title = metadata.description

const grid = new contrib.grid( {
  rows: 12
, cols: 12
, screen
} )

// var table = grid.set( 0, 0, 6, 6, contrib.table, {
//   keys: true
// , fg: 'white'
// , selectedFg: 'white'
// , selectedBg: 'blue'
// , interactive: true
// , label: 'Active Processes'
// , width: '30%'
// , height: '30%'
// , border: {type: "line", fg: "cyan"}
// , columnSpacing: 10 //in chars
// , columnWidth: [16, 12, 12] // in chars
// } )

// table.setData( { headers: ['col1', 'col2', 'col3'] , data: [ [1, 2, 3] , [4, 5, 6] ]})

// grid.set(row, col, rowSpan, colSpan, obj, opts)
const log = grid.set( 6, 0, 6, 12, contrib.log, {
  fg: `grey`
, selectedFg: `white`
, label: `Server Log`
, mouse: true
, bufferLength: 300
// TODO: keys, search
} )

log.interactive = true

log.focus()

log.log( path.resolve( __dirname, `../node_modules/maf3-sdk/index.html` ) )

// https://medium.freecodecamp.org/node-js-child-processes-everything-you-need-to-know-e69498fe970a
const maf = fork( require.resolve( 'maf3-sdk' ), [], {
  cwd: `./`
, silent: true
} )

maf.stdout.on( `data`, data => {
  // console.log( data.toString() )
  log.log( data.toString() )
} )
maf.stderr.on( `data`, data => {
  // console.log( data.toString() )
  log.log( data.toString() )
} )
maf.on( `close`, code => {
  // console.log( code.toString() )
  log.log( code.toString() )
} )

screen.key( [ `escape`, `q`, `C-c` ], ( ch, key ) => {
  maf.kill()
  process.exit( 0 )
} )

screen.render()

process.once( `SIGUSR2`, _ =>
  gracefulShutdown( _ =>
    process.kill( process.pid, `SIGUSR2` )
  )
)

