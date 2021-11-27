+++
title = "Including addons"
weight = 10
+++

# Including addons

Melon provides an automated system for including extensions in your project. The addons are downloaded and included during the `download` build step. Addons can be included in the project config (`melon.json`).

```json
{
  // Your options here
  "addons": {
    "ublock": {
      "id": "uBlock0@raymondhill.net",
      "url": "https://github.com/gorhill/uBlock/releases/download/1.39.0/uBlock0_1.39.0.firefox.xpi"
    }
  }
}
```
