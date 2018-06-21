# 📺 MAF SDK Command Line Interface

> Development automation for your MAF3 App projects

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FJasperV%2Fmaf-cli.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FJasperV%2Fmaf-cli?ref=badge_shield)

[![NPM](https://nodei.co/npm/maf-cli.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/maf-cli/)

#### 📖 Contents

- [Install](#-install)
- [Configuration](#️-configuration)
- [Usage](#️-usage)
- [MAF key combinations](#️-maf-key-combinations)
- [About](#about)
- [MAF3-SDK](#-maf3-sdk)


## 💾 Install

```sh
$ npm i -g maf-cli
$ npm i -D maf-cli Metrological/maf3-sdk
$ touch .mafrc.js
$ maf init
$ maf --tasks
```

After running `maf init` all requirements will be created, installed and scaffolded based on the answers you provide. Some tasks have a dependency on a Metrological Dashboard API key. You can get one [here](https://dashboard.metrological.com/#/profile/api).

To use this module with an already existing app, simply move that app out of the MAF3 SDK folder into it's own and run `maf init` on it.

As a shorthand you could run `curl -L  git.io/maf-cli | bash` from within your project folder. And then run `maf init`.

### Moving from maf3-sdk to maf-cli

If you are accustomed to working with the maf3-sdk then working with the maf-cli should be transparent. A lot of things are now handled for you. You can now depend your project on the maf-cli vs. running your app within the maf3-sdk. 
All apps from the maf3-sdk are included. As well as any dependencies.
Your index.html file is no longer required. Any configuration you might have in there can be copied over to your maffile (.mafrc.js). Declaring your app, categories and ui is no longer required.


## ⚙️ Configuration

You can configure the MAF CLI via your .mafrc.js file. It has the following (default) options available:

```javascript
{
  language: `nl` // set the default language of the Store and App
, es6: true // when true all your code will be transpiled (via the Closure Compiler) to ES5 before running and publishing
, autostart: false // when true auto-starts your app when browsing to https://localhost:8443
, store: `YOUR/STORE/ID_HERE` // use this when running the store task for example: metrological/nl/external
}
```

Additionally, you are able to define your own tasks within your maffile.

```javascript
const maf = require( 'maf-cli' )

module.exports = {
  language: `nl`
, function hello() {
    console.log( `world` )
  }
}
```

This can be used to integrate any other tools you might use, or preprocess certain files.

You may also set some environment variables:

```sh
LANG=en_US.utf8 # for compatibility reasons, remove if this causes issues for you
TERM=xterm-256color # for compatibility reasons, remove if this causes issues for you
NODE_ENV=production # let's make sure we are equal to production as much as possible
NODE_PORT=8080 # change to your liking
NODE_SECURE_PORT=8443 # change to your liking
DOCS_PORT=9090 # change to your liking
METROLOGICAL_API_KEY="YOUR_API_KEY_HERE" # this is used for publishing your App
```


## ▶️ Usage

```sh
$ maf
```

The default task (run) will run and starts the [SDK Server](https://localhost:8443).

To run individual tasks, use `maf <task>`.

To display the list of build-in tasks, use `maf --tasks`

For an overview of available options and commands, use `maf --help`


## ⌨️ MAF key combinations:

| Command | Key |
| --- | --- |
| `stop` | Shift + Down |
| `play/pause` | Shift + Up |
| `rewind` | Shift + Left |
| `forward` | Shift + Right |
| `back` | Backspace |
| `red` | F1 |
| `green` | F2 |
| `yellow` | F3 |
| `blue` | F4 |
| `channel up` | PageUp |
| `channel down` | PageDown |


## ❌ Issue Submission

Please use GitHub Issues for issue submission.

### Known Issues

The build-in proxy service uses xml2json which uses node-expat. On Windows this requires some extra work setting up. Please refer to it's [documentation](https://www.npmjs.com/package/xml2json).


## ✅ Feature requests

Feature requests can be submitted via Issues as well.


## Contribute

Feel free to send in any pull requests.


## About

The idea for this module came from the desire to take the development of MAF3 apps into the 21st century. To allow for anyone to focus on building the app and less on managing releases and configuring the runtime environment. This module allows for your project to easily depend on the MAF3-SDK and make CI and CD more simple to handle. This is the first iteration of many more to come.


## 🛠 MAF3-SDK

You can learn more about the MAF3-SDK at it's [website](https://mafsdk.tv/), or on [GitHub](https://git.io/maf3-sdk).

For any questions regarding App developement please use the [Metrological Helpdesk](https://metrological.atlassian.net/servicedesk/customer/portal/).


## ©️ License

MIT


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FJasperV%2Fmaf-cli.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FJasperV%2Fmaf-cli?ref=badge_large)