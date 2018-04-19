'use strict'

const fs = require( 'fs' )
const { promisify } = require( 'util' )

const maf = require( '../maf' )
const ansi = require( '../util/ansi' )

const { stat, writeFile } = {
  stat: promisify( fs.stat )
, writeFile: promisify( fs.writeFile )
}

function sync( done ) { syncWrapper( done ) }

sync.description = `Sync App metadata.json with package.json and vice versa.`

maf.task( sync )

async function syncWrapper( done ) {
  const identifier = process.cwd().split( `/` ).pop()

  const pkgFile = `${process.cwd()}/package.json`
  const metaFile = `${process.cwd()}/contents/metadata.json`

  let pkgMeta
  let pkg
  let metaMeta
  let meta

  try {
    pkgMeta = await stat( pkgFile )
    pkg = require( pkgFile )
  } catch( e ) {
    throw new Error( ansi.red( `Could not read package.json.` ) )
  }

  try {
    metaMeta = await stat( metaFile )
    meta = require( metaFile )
  } catch( e ) {
    throw new Error( ansi.red( `Could not read ./contents/metadata.json.` ) )
  }

  if ( identifier !== meta.identifier && identifier !== pkg.name )
    throw new Error( ansi.red( `Your App identifier does not match the folder name.` ) )

  const pkgTime = new Date( pkgMeta.mtime ).getTime()
  const metaTime = new Date( metaMeta.mtime ).getTime()

  if ( metaTime >= pkgTime ) {
    pkg.name = meta.identifier
    pkg.version = meta.version
    pkg.description = meta.description
    pkg.keywords = meta.categories
    pkg.author = meta.author

    try {
      await writeFile( pkgFile, JSON.stringify( pkg, null, 2 ), `utf8` )
    } catch( e ) {
      throw new Error( ansi.red( `Could not write package.json.` ) )
    }
  } else {
    meta.identifier = pkg.name
    meta.version = pkg.version
    meta.description = pkg.description
    meta.categories = pkg.keywords
    meta.author = pkg.author

    try {
      await writeFile( metaFile, JSON.stringify( meta, null, 2 ), `utf8` )
    } catch( e ) {
      throw new Error( ansi.red( `Could not write ./contents/metadata.json.` ) )
    }
  }

  done()
}
