+++
title = "Windows"
weight = 10
+++

# Working with windows

Building Firefox Forks are nowhere near as easy on Windows as it is on Linux or Macos. This guide will walk you through the basics of setting up on Windows.

There are some important notes for before you get started. Firstly, it is recommenced that you have at least 4GB of ram, preferably more than 8GB. You will need more than 40GB of space on your storage device and Windows 10 and 11 are the only two [tier-1](https://firefox-source-docs.mozilla.org/build/buildsystem/supported-configurations.html#build-hosts) windows hosts.

## Installing Dependencies

The first thing you will need to do is install Microsoft's c++ build tools. You will need to download [Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022). The following will need to be need installed:

- **In the _Workloads_ tab**
  - Desktop development with C++
- **In the _Individual components_ tab**
  - Windows 10 SDK (at least 10.0.19041.0).
  - C++ ATL for v143 build tools (x86 and x64).

You will need to install [MozillaBuild](https://ftp.mozilla.org/pub/mozilla.org/mozilla/libraries/win32/MozillaBuildSetup-Latest.exe). This provides a number of unix tools including a terminal similar to bash which can be initialized by `C:\mozilla-build\start-shell.bat`.

Next, [install Git](https://git-scm.com/download/win). You will need to set the following specific options on install to ensure high performance:

- Configuring the line ending conversions must be: Checkout as-is, commit as-is
- Enable experimental built-in file system monitor

Install [NodeJS](https://nodejs.org/en/download/current/) on your system. This should also install chocolatey. If it does not, install it manually. To install the final two dependancies, run:

```sh
npm install --global yarn
choco install make
```

## Setting up an existing repo

Next, you should clone down your repo. From here, install all of the necessary dependencies with yarn.

```sh
yarn
```

Next, download the firefox source code for Firefox to engine. Note that on windows this can take between 20 - 30 minutes, most of the time being spent with initialize.

```sh
gluon download
```

From here, you will need to use mach to bootstrap your system.

```batch
cd engine
.\mach boostrap
```

Now you are ready to import, build and run your browser.

```batch
gluon import
gluon build
gluon run
```

Exporting changes will work as per usual.

## Additional packages required for releasing

If you are creating binaries to target windows, you will need nsis (which mach calls `makensisu` for some reason, even though the binary is `makensis`):

```powershell
choco install nsis
```

Note that you will also have to provide a path to nsis on your system. For mine it is:

```sh
export MAKENSISU="C:\\Program Files (x86)\\NSIS\\Bin\\makensis.exe"
```
