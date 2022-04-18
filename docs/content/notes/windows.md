+++
title = "Forcing windows to work"
weight = 10
+++

## Steps followed to get installing on windows to work

1. Install build tools for Visual Studio
   - Desktop development with c++
   - Windows 10 sdk (at least 10.0.19041.0).
   - C++ ATL for v143 build tools (your architecture)
2. Install git for windows: https://git-scm.com/download/win
   - Configuring the line ending conversions **must be**: Checkout as-is, commit as-is
   - Enable experimental built-in file system monitor
3. Install mozilla build. See mozillas documentation
4. Install Nodejs and yarn - This should install chocoalaty
5. Clone pulse recursivly (cmd)
6. Install dependancies `yarn`
7. Create link `yarn setupLink:win`
8. Disabled anti-malware on 'C:\mozilla-build' and working directory to reduce system load
9. download and init
10. import patches
11. ./mach boostrap in engine
12. choco install make
13. yarn build
14. ./mach build

## Fixing UI bugs

TODO: flesh this out
Without a correct manifest file, windows will report on windows 8 on windows 10 / 11, leading to a variety of UI bugs.

## Notes to future self

- Try running commands in MozillaBuild shell rather than windows cmd
- Tests need to be disabled by default, they take up too much build time

## Bootstrap freezes in a CI environment

We use mach bootstrap within our CI environments without initing it as a git repo. Under normal circumstances bootstrap will error (on windows boostrap freezes without using the CI )

## TODO:

### UI

- [ ] Fix titlebar buttons - Caused by firefox thinking I am on windows 8

### Build

- [ ] Test to see if git in git-bash / mozilla's terminal is faster
- [ ] Use git-bash / mozilla terminal for git
- [ ] Make sure yarn build works
