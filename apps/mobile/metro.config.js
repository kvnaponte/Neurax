const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// On Windows, Metro's NodeWatcher crashes on Expo's temp dirs (.expo-font-*, .expo-*)
// Limit watchFolders to project source only (node_modules resolved separately)
config.watchFolders = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'app'),
  path.resolve(__dirname, 'assets'),
]

config.resolver.blockList = [
  /node_modules[/\\]\.expo-.*/,
  /node_modules[/\\]\.cache.*/,
]

module.exports = config
