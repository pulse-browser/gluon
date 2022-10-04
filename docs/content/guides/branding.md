+++
title = "Branding your browser"
weight = 15
+++

# Branding your browser

Before you ship your browser, you will want to include your own branding, rather than just using Mozilla's template branding. Gluon will automatically generate branding once you configure it correctly.

## Creating a brand

You will first need to add a `brands` key within your `gluon.json`. For example:

```json
{
  ...
  "brands": {
    "stable": {
      "backgroundColor": "#2B2A33",
      "brandShorterName": "Pulse",
      "brandShortName": "Pulse Browser",
      "brandFullName": "Pulse Browser",
      "release": {
        "displayVersion": "1.0.0",
        "github": {
          "repo": "pulse-browser/browser"
        },
        "x86": {
          "windowsMar": "windows.mar",
          "macosMar": "macosIntel.mar",
          "linuxMar": "linux.mar"
        }
      }
    }
  },
  ...
}
```

More information regarding the available keys for this config object can be found in the [reference section](/reference/config/#brands). When you add or change a brand, you will need to reimport your changes and specify the brand to target using `gluon set brand`.

## Specifying which brand to target

You can specify the brand that you want to build for using the `gluon set brand <brand_name>` command. For example:

```sh
gluon set brand stable
```

Note that once you have set a new brand, you will need to rebuild your browser for changes to take effect:

```sh
gluon build
```
