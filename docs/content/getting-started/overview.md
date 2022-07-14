+++
title = "Overview"
weight = 5
+++

## Getting started with gluon

### What is gluon

Gluon is a build tool and documentation for creating firefox-based browsers. Its goal is to simplify the process of creating web browsers to encourage competition and development within the space.

### Getting help

If you are having problems with following these instructions, or with gluon in general, please contact us. You can [create a discussion on github](https://github.com/pulse-browser/gluon/discussions/new), ping @trickypr on the [Fushra Discord](https://discord.gg/xNkretH7sD).

### System requirements

- **OS**: Linux and MacOS (If you are using windows, take a look at the [Windows Guide](../windows/))
- **Gluon dependencies**: NodeJS and npm
- **Browser dependencies**: Will be handled by bootstrapping

### Getting started

The first thing you are going to need to do is to install Gluon. As it is a nodejs program it can be installed through npm or yarn.

```sh
npm install -g gluon-build@next
# or
yarn global add gluon-build@next

# Note: Linux and mac users may have to run the above command with sudo
```

Now create a git repo and clone it to your local machine. Then run the following:

```sh
gluon setup-project
```

This will ask you a variety of questions in relation to your project setup. Firstly, the release of the browser you want to bind to.

Pulse Browser currently uses the stable releases, and keeping up to date can be a struggle with a small development team.

Then next is the version of the browser you want to use. By default melon will populate this with the latest version available, which we recommend using.

Next it will ask for the name of your browser. Avoid references to Firefox or other Mozilla brands if you can.

Vendor is the company (or solo developer) who is creating the browser.

The appid follows reverse dns naming conventions. For example, Fushra owns the domain `fushra.com`, so our browser is `com.fushra.browser.desktop`. If you do not have a domain, you can use your username / psudomim as the appid, e.g. `trickypr.watermelon`.

Next you need to chose a starting template for your browser. You can go with userchrome, where you apply css changes to firefox or custom html, where you have to write everything (tabs, navigation, search boxes) yourself. We generally recommend userchrome for new users, as it has the lowest learning curve. Additionally, you can chose to use no template.

Now you have created the directory structure for your project, you can build it for the first time. First, ask melon to download the firefox source.

```sh
gluon download
```

If you are running this for the first time, you will need to install the firefox dependencies. You can do this via boostrapping:

```sh
gluon bootstrap
```

After the source code has been downloaded, the changes to firefox described in the source code must be applied.

```sh
gluon import
```

Finally, you can start building the firefox source code. This takes around an hour and a half on my computer, but the binary output will be cached, making later builds faster

```sh
gluon build
```

Now you can finally start the browser!

```sh
gluon run
```
