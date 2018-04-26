'use strict'

const terminus = require( '@godaddy/terminus' )

let app

function onSignal() {
  console.log( 'server is starting cleanup' )
  // start cleanup of resource, like databases or file descriptors
  return Promise.all( [
    // your clean logic, like closing database connections
  ] )
}

async function onHealthCheck() {
  // checks if the system is healthy, like the db connection is live
  // resolves, if health, rejects if not
  // return promise
}

module.exports = function( server ) {
  app = server

  terminus( server, {
    signal: `SIGINT`
  , healthChecks: { '/healthcheck': onHealthCheck }
  , onSignal
  } )
}
