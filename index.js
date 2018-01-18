#!/usr/bin/env node

process.env.LANG = `en_US.utf8`
process.env.TERM = `xterm-256color`

// TODO: refactor; import lib/app -> app.run()

import blessed from 'blessed'
import contrib from 'blessed-contrib'
import exec from 'child_process'

const screen = blessed.screen()

const grid = new contrib.grid( {
  rows: 12
, cols: 12
, screen
} )

// grid.set(row, col, rowSpan, colSpan, obj, opts)
// var map = grid.set(0, 0, 4, 4, contrib.map, {label: 'World Map'})
// const box = grid.set(8, 8, 4, 4, blessed.box, {content: 'My Box'})

const log = grid.set( 0, 6, 12, 6, contrib.log, {
  fg: `green`
, selectedFg: `green`
, label: ` MAF SDK Log `
} )

log.log( `new log line` )
log.log( `new log line 1` )
log.log( `new log line 2` )
log.log( `new log line 3` )
log.log( `new log line 4` )
log.log( `new log line 5` )

screen.key( [ `escape`, `q`, `C-c` ], ( ch, key ) => process.exit( 0 ) )

screen.render()
