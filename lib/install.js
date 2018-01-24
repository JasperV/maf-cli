#!/usr/bin/env node

import copydir from 'copy-dir'
import { promisify } from 'util'

const copy = promisify( copydir )

async function copyAppSkeleton() {
  await copy( `app/`, process.cwd()  )
}

copyAppSkeleton()
