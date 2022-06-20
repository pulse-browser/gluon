+++
title = "Overview"
weight = 5
+++

## Getting started with melon

### What is melon

Melon is a build tool and documentation for creating firefox-based browsers. Its goal is to simplify the process of creating web browsers to encourage competition and development within the space.

### Getting help

If you are having problems with following these instructions, or with melon in general, please contact us. You can [create a discussion on github](https://github.com/pulse-browser/gluon/discussions/new), ping @trickypr on the [Dot HQ discord](https://dothq.link/dsc), or [join our Matrix chat](https://dothq.link/matrix).

### System requirements

- **OS**: Linux and MacOS (If you are using windows, take a look at the [Windows Guide](../windows/))
- **Melon dependencies**: NodeJS and npm
- **Browser dependencies**: TODO: find out what firefox's build dependencies are

### Getting started

The first thing you are going to need to do is to install melon. As it is a nodejs program it can be installed through npm or yarn.

```sh
npm install -g melon-build
# or
yarn global add melon-build

# Note: Linux and mac users may have to run the above command with sudo
```

Now create a git repo and clone it to your local machine. Then run `melon setup-project` inside of that repo. This will ask you a variety of questions in relation to your project setup. Firstly, the release of the browser you want to bind to.

- `Firefox nightly`: Updates every 12 hours, making it almost impossible to keep up to date **(not recommended)**
- `Firefox beta`: Updates every 4 weeks. It will have unresolved bugs **(not recommended)**
- `Firefox developer edition`: Tracks firefox beta **(not recommended)**
- `Firefox stable`: Releases around every 4 weeks, however has most of the bugs from beta fixed
- `Firefox extended support release (newer)`: The latest extended support release. Releases around once every 8 stable cycles (mozilla isn't clear on this). Receives regular small security patches and bug fixes, but no large breaking changes (e.g. [proton](https://www.omgubuntu.co.uk/2021/02/try-firefox-proton-redesign-ubuntu)) between releases.
- `Firefox extended support release (newer)`: The oldest supported extended support release. Maximum security and stability, but will lose support sooner than the newer extended support release.

Dot browser currently uses the stable releases, and keeping up to date can be a struggle with a small development team.

Then next is the version of the browser you want to use. By default melon will populate this with the latest version available, which we recommend using.

Next it will ask for the name of your browser. Avoid references to firefox or other mozilla brands if you can.

Vendor is the company (or solo developer) who is creating the browser.

The appid follows reverse dns naming conventions. For example, DotHQ owns the domain `dothq.co`, so our browser is `co.dothq.browser`. If you do not have a domain, you can use your username / psudomim as the appid, e.g. `trickypr.watermelon`.

Next you need to chose a starting template for your browser. You can go with userchrome, where you apply css changes to firefox or custom html, where you have to write everything (tabs, navigation, search boxes) yourself. We generally recommend userchrome for new users, as it has the lowest learning curve. Additionally, you can chose to use no template.

Now you have created the directory structure for your project, you can build it for the first time. First, ask melon to download the firefox source.

```sh
melon download
```

After the source code has been downloaded, the changes to firefox described in the source code must be applied.

```sh
melon import
```

Finally, you can start building the firefox source code. This takes around an hour and a half on my computer, but the binary output will be cached, making later builds faster

```sh
melon build
```

Now you can finally start the browser!

```sh
melon run
```
