const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// pnpm stores packages in workspace root — Metro needs to watch it
config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Required for pnpm symlinks: use real paths so Metro can find files in .pnpm store
config.resolver.unstable_enableSymlinks = true

module.exports = config
