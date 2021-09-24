const launcher = ChromeUtils.import(
    "resource://devtools/client/framework/browser-toolbox/Launcher.jsm"
).BrowserToolboxLauncher

export function launchDevTools() {
    launcher.init()
}
