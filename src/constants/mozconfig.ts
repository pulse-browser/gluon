import { config } from '..'

const otherBuildModes = `# You can change to other build modes by running:
#   $ gluon set buildMode [dev|debug|release]`

const platformOptimize =
  process.platform == 'darwin'
    ? 'ac_add_options --enable-optimize="-O3 -march=nehalem -mtune=haswell -w"'
    : process.platform == 'linux'
    ? 'ac_add_options --enable-optimize="-O3 -march=x86-64-v2 -mtune=haswell -w"'
    : process.platform == 'win32'
    ? 'ac_add_options --enable-optimize="-O2 -Qvec -w -clang:-ftree-vectorize -clang:-msse3 -clang:-mssse3 -clang:-msse4.1 -clang:-mtune=haswell"'
    : `# Unknown platform ${process.platform}`

export const internalMozconfg = (
  brand: string,
  buildMode: 'dev' | 'debug' | 'release' | string
) => {
  let buildOptions = `# Unknown build mode ${buildMode}`

  // Get the specific build options for the current build mode
  switch (buildMode) {
    case 'dev':
      buildOptions = `# Development build settings
${otherBuildModes}
ac_add_options --disable-debug
ac_add_options --disable-optimize`
      break
    case 'debug':
      buildOptions = `# Debug build settings
${otherBuildModes}
ac_add_options --enable-debug
ac_add_options --disable-optimize`
      break

    case 'release':
      buildOptions = `# Release build settings
ac_add_options --disable-debug
ac_add_options --enable-optimize
${platformOptimize} # Taken from waterfox`
      break
  }

  return `
# =====================
# Internal gluon config
# =====================

${buildOptions}
ac_add_options --disable-geckodriver
ac_add_options --disable-profiling
ac_add_options --disable-tests

# Custom branding
ac_add_options --with-branding=browser/branding/${brand}

# Config for updates
ac_add_options --disable-verify-mar
ac_add_options --enable-update-channel=${brand}
export MOZ_APPUPDATE_HOST=${
    config.updateHostname || 'localhost:7648 # This should not resolve'
  }
`
}
