# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Renamed to `gluon`

## [1.0.0-a.11]

### Fixed

- Put the copy inputs around the right way

## [1.0.0-a.9]

### Fixed

- Work around windows users not having the permissions to create symbolic links

## [1.0.0-a.8]

### Fixed

- Windows tar compatibility
- Make the progress bar be less flickery
- `fs-extra` is being used for symlinks for cross-platform compatibility

### Changed

- Windows now uses the same init script as everyone else

## [1.0.0-a.7]

### Fixed

- Stop updates from crashing melon
- Correct the api backend for updates
- Stop crashes when symlinks don't exist
- Error outputs are cleaner
- Branding generators do not crash as much
- Partly inited engine folders will not trigger unusual errors
- Better error output when `bsdtar` causes errors

### Changed

- The status command is now mildly more helpful
- Removed unnecessary delays, improving performance
- `export` is now an alias for `export-file`
- Discard command now uses git instead of trying to download from firefox's source
- Add the possibility of multiple branding types
- Branding generator will regenerate locale files if the correct options are specified
- Branding generator creates custom color for about page

### Added

- Debian bootstrap
- Verbose logging mode
- Addons can be included

### Removed

- `fs-extra` is no longer a depenancy

## [1.0.0-a.6]

### Fixed

- Builds do not double count `#!/bin/node`
- Run branding generator as a patch

## [1.0.0-a.5]

### Added

- Userchrome docs
- Basic branding generator

## [1.0.0-a.4]

### Added

- Open devtools and reload button for custom UI

### Fixed

- Theming patches don't cause errors now
- Custom UI template compiles and runs

### Removed

- Remove the melon executable from the template

## [1.0.0-a.3]

### Fixed

- Include `template/src/`

## [1.0.0-a.2]

### Added

- Initial beta release

[unreleased]: https://github.com/dothq/melon/compare/v1.0.0-a.9...HEAD
[1.0.0-a.9]: https://github.com/dothq/melon/compare/v1.0.0-a.8...v1.0.0-a.9
[1.0.0-a.8]: https://github.com/dothq/melon/compare/v1.0.0-a.7...v1.0.0-a.8
[1.0.0-a.7]: https://github.com/dothq/melon/compare/v1.0.0-a.6...v1.0.0-a.7
[1.0.0-a.6]: https://github.com/dothq/melon/compare/v1.0.0-a.5...v1.0.0-a.6
[1.0.0-a.5]: https://github.com/dothq/melon/compare/v1.0.0-a.4...v1.0.0-a.5
[1.0.0-a.4]: https://github.com/dothq/melon/compare/v1.0.0-a.3...v1.0.0-a.4
[1.0.0-a.3]: https://github.com/dothq/melon/compare/v1.0.0-a.2...v1.0.0-a.3
[1.0.0-a.2]: https://github.com/dothq/melon/compare/v1.0.0-a.1...v1.0.0-a.2
