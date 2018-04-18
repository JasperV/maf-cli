'use strict'

const fs = require( 'fs' )
const { promisify } = require( 'util' )

const stdout = require( 'mute-stdout' )

const ansi = require( './util/ansi' )
const exit = require( './util/exit' )
const tildify = require( './util/tildify' )

const getTask = require( './log/get-task' )
const logTasks = require( './log/tasks' )
const logEvents = require( './log/events' )
const logSyncTask = require( './log/sync-task' )
const logTasksSimple = require( './log/tasks-simple' )
const registerExports = require( './util/register-exports' )

const { readdir } = { readdir: promisify( fs.readdir ) }

async function execute( opts, env ) {

  const tasks = opts._
  const toRun = tasks.length ? tasks.unshift( `sync` ) : [ `sync`, `run` ]

  if ( opts.tasks ) stdout.mute()

  const maf = require( env.modulePath )

  const tasksDir = `${env.configBase}/node_modules/maf-cli/lib/tasks`
  const defaultTasks = await readdir( tasksDir )
  defaultTasks.forEach( task => require( `${tasksDir}/${task}` ) )

  logEvents( maf )
  logSyncTask( maf )

  const exported = require( env.configPath )

  registerExports( maf, exported )

  stdout.unmute()

  process.nextTick( _ => {

    if ( opts.tasksSimple ) return logTasksSimple( maf.tree().nodes )

    if ( opts.tasks ) {
      const tree = maf.tree( { deep: true } )

      tree.label = `📺 Tasks for ${ansi.magenta( tildify( env.configPath ) )}`

      return logTasks( tree, opts, getTask( maf ) )
    }

    try {
      console.info( `📺 Using maffile ${ansi.magenta( tildify( env.configPath ) )}` )

      maf.series( toRun )( err => { if ( err ) exit( 1 ) } )

    } catch ( err ) {
      console.error( ansi.red( err.message ) )
      console.error( `To list available tasks, try running: maf --tasks` )
      exit( 1 )
    }
  } )
}

module.exports = execute
