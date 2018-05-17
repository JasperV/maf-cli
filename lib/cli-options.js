'use strict'

const ansi = require( './util/ansi' )

module.exports = {
  help: {
    alias: `h`
  , type: `boolean`
  , desc: ansi.gray( `Show this help.` )
  }
, version: {
    alias: `v`
  , type: `boolean`
  , desc: ansi.gray( `Print the global and local maf versions.` )
  }
, maffile: {
    alias: `f`
  , type: `string`
  , requiresArg: true
  , desc: ansi.gray( `Manually set path of maffile. Useful if you have multiple
                      maffiles. This will set the CWD to the maffile directory
                      as well.` )
  }
, cwd: {
    alias: `c`
  , type: `string`
  , requiresArg: true
  , desc: ansi.gray( `Manually set the CWD. The search for the maffile, as well
                      as the relativity of all requires will be from here.` )
  }
, tasks: {
    alias: `t`
  , type: `boolean`
  , desc: ansi.gray( `Print the task dependency tree for the loaded maffile.` )
  }
, 'tasks-simple': {
    type: `boolean`
  , desc: ansi.gray( `Print a plaintext list of tasks for the loaded maffile.` )
  }
, color: {
    type: `boolean`,
    desc: ansi.gray( `Will force maf and maf plugins to display colors, even
                      when no color support is detected.` )
  }
, 'no-color': {
    type: `boolean`,
    desc: ansi.gray( `Will force maf and maf plugins to not display colors,
                      even when color support is detected.` )
  }
, 'no-compile': {
    type: `boolean`
  , desc: ansi.gray( `Don't run the compile task before other tasks and don't
                      compile js files on updates.` )
  }
, 'no-sync': {
    type: `boolean`
  , desc: ansi.gray( `Don't run the sync task before other.` )
  }
}
