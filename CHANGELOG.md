# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Improved error handling and logging for the download command

## [1.0.0-rc.2]

### Fixed
- `license-check`: Correct definition of `--fix`

## [1.0.0-rc.1]

### Added
- CLI Related:
    - `config`: Allow you to specify environment-specific config
    - `package`: Generate update manifests
    - `config`: Different build modes using `buildMode` key
    - `ci`: A command for configuring everything on CI with one command
    - ``

### Changed

- `Docs`: Vastly improved docs
- `mozconfig`: Update the update-signing to match mozilla's new system
- `perf`: Reduced dependencies somewhat
- CLI:
    - `setup-project`: Asks for binary name
- Config
    - `firefox version`: Remove `ESR_NEXT`. Mozilla no longer provides this information via their API
    - `addons`: Addons now can be specified by provider. This allows for [bot update notifications](https://github.com/pulse-browser/update-bot). For migration example, see [this commit](https://github.com/pulse-browser/browser/commit/2ca3b2606299ef03e2adbcf43974bbe6ec8c2eea)

### Fixed
- `.gluon` is included in generated gitignore

### Removed
- `setup-project`: HTML template has been removed. Use [motherhen](https://github.com/ajvincent/motherhen) or [Quark Runtime (wip)](https://github.com/quark-platform/runtime)

## [1.0.0-a.2]

### Added

- Initial beta release

[1.0.0-rc.2]: https://github.com/pulse-browser/gluon/compare/v1.0.0-rc.1...v1.0.0-rc.2
[1.0.0-rc.1]: https://github.com/pulse-browser/gluon/compare/v1.0.0-a.2...v1.0.0-rc.1
[1.0.0-a.2]: https://github.com/pulse-browser/gluon/compare/v1.0.0-a.1...v1.0.0-a.2
