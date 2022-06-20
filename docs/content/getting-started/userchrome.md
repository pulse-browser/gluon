+++
title = "Userchrome"
weight = 15
+++

This page will explain the process for applying custom css (or userchrome) to your new browser. I expect you to have already setup gluon as described in the overview and have something that looks like the following on your screen.

![Firefox build without branding](https://cdn.statically.io/img/dothq.github.io/f=auto/melon/images/userchrome/css-basic.png)

The firefox window shown above is constructed from (x)html, styled with css and made dynamic with javascript. This means that the entire browser can be styled with custom css, called userchrome.

If you selected the userchrome option when setting up the project, gluon will have already created the theme files for you. `src/browser/themes/custom/shared/shared.inc.css` will be included on all platforms, whilst platform specific styles will be included from similar files in `src/browser/themes/custom`.

Additionally, firefox has an equivalent to "inspect element", but for the browser. Click on the hamburger menu, select "More tools", then "Browser toolbox" to open it.

![Browser toolbox](https://cdn.statically.io/img/dothq.github.io/f=auto/melon/images/userchrome/browser-toolbox.png)

## A touch of design

This tutorial will attempt to replicate the design of [SimpleFox by Miguel R. Ávila](https://github.com/migueravila/SimpleFox), without copying its code. I would recommend creating your own visual identity for your browser.

## Squaring the tabs

Firefox's proton made the tabs hover, with mixed reception. Let's reverse that.

Using the select tool (top left of the browser toolbox) select the active tab and look for what element provides the background. In this case it is the `.tab-background` element.

You can scroll down to find the code where the border radius is set. In firefox 91, this is:

```css
.tab-background {
  border-radius: var(--tab-border-radius);
  margin-block: var(--tab-block-margin);
}
```

Firefox uses css variables for a lot of its properties, meaning we can make the tabs square by setting the border radius to 0. Here, the margin, which makes the tabs "float is set", so setting it to zero will cause them to stop floating. This can be done by adding the following line to `src/browser/themes/custom/shared/shared.inc.css`:

```css
:root {
  --tab-border-radius: 0 !important;
  --tab-block-margin: 0 !important;
}
```

Rebuilding the browser, the tabs are now slightly closer to how we want them.

![Squared tabs](https://cdn.statically.io/img/dothq.github.io/f=auto/melon/images/userchrome/css-square-tabs.png)

There is this weird padding to the left of the active tab. This is caused by the following css:

```css
.tabbrowser-tab {
  min-height: var(--tab-min-height);
  padding-inline: 2px !important;
}
```

As mozilla are using `!important` here, we have to use [css priority](https://marksheet.io/css-priority.html) to override it, rather than simply creating our own style with `!important`.

```css
#tabbrowser-arrowscrollbox .tabbrowser-tab {
  padding-inline: 0 !important;
}
```

Now, I want to remove the "Nightly" pill in the search bar, along with the background of it. Using the browser toolbox, we can figure out that we have to hide `#identity-icon-box`, remove the border on `#urlbar-background` and set `--toolbar-field-background-color` to the value of `--toolbar-bgcolor`.

![Final browser](https://cdn.statically.io/img/dothq.github.io/f=auto/melon/images/userchrome/css-final.png)

I encourage you to experiment and customize your browser to fit what you want your browser to be.

The source code for this tutorial can be found [here](https://github.com/trickypr/watermelon)
