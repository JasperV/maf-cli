'use strict'

const fs = require( 'fs' )

const stdout = require( 'mute-stdout' )

const ansi = require( './ansi' )
const exit = require( './exit' )
const tildify = require( './tildify' )

const logTasks = require( './log/tasks')
const logEvents = require( './log/events')
const logSyncTask = require( './log/sync-task')
const registerExports = require( './register-exports')

const getTask = require( './log/get-task' )

function execute( opts, env ) {

  const tasks = opts._
  const toRun = tasks.length ? tasks : [ `run` ]

  if ( opts.tasks ) stdout.mute()

  const maf = require( env.modulePath )

  logEvents( maf )
  logSyncTask( maf )

  const exported = require( env.configPath )

  console.log( exported )

  registerExports( maf, exported )

  stdout.unmute()

  process.nextTick( function() {
    if ( opts.tasks ) {
      const tree = maf.tree( { deep: true } )

      if ( config.description && typeof config.description === 'string' ) {
        tree.label = config.description
      } else {
        tree.label = `Tasks for ${ansi.magenta( tildify( env.configPath ) )}`
      }

      return logTasks( tree, opts, getTask( maf ) )
    }

    try {
      console.info( `Using maffile ${ansi.magenta( tildify( env.configPath ) )}` )

      var runMethod = 'series'

      maf.series( toRun )( function( err ) {
        if ( err ) exit( 1 )
      } )

    } catch ( err ) {
      console.error( ansi.red( err.message ) )
      console.error( `To list available tasks, try running: maf --tasks` )
      exit( 1 )
    }
  } )
}

module.exports = execute
