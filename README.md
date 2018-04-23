# 📺 MAF SDK Command Line Interface

> Development automation for your MAF3 App projects

[![NPM](https://nodei.co/npm/maf-cli.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/maf-cli/)

#### Contents

- [Install](#install)
- [Usage](#usage)
- [MAF key combinations](#maf-key-combinations)
- [About](#about)
- [MAF3-SDK](#maf3-sdk)


## Install

```sh
$ npm i -g maf-cli
$ npm i -D maf-cli
$ touch .mafrc.js
$ maf init
$ maf --tasks
```

After running `maf init` all requirements will be created, installed and scaffolded based on the answers you provide. Some tasks have a dependency on a Metrological Dashboard API key. You can get one [here](https://dashboard.metrological.com/#/profile/api).

To use this module with an already existing app, simply move that app out of the MAF3 SDK folder into it's own and run `maf init` on it.

As as shorthand you could run `curl -L  git.io/maf-cli | bash` from within your project folder. And then run `maf init`.

## Usage

```sh
$ maf
```

The default task (run) will run and starts the [SDK Server](http://localhost:8080).

To run individual tasks, use `maf <task>`.

To display the list of build-in tasks, use `maf --tasks`

For an overview of available options and commands, use `maf --help`

## MAF key combinations:

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

## Issue Submission

Please use GitHub Issues for issue submission.

## Feature requests

Feature requests can be submitted via Issues as well.

## Contribute

Feel free to send in any pull requests.

## About

The idea for this module came from the desire to take the development of MAF3 apps into the 21st century. To allow for anyone to focus on building the app and less on managing releases and configuring the runtime environment. This module allows for your project to easily depend on the MAF3-SDK and make CI and CD more simple to handle. This is the first iteration of hopefully many more to come.

This module borrows heavily from [Gulp](https://gulpjs.com/).

## MAF3-SDK

You can learn more about the MAF3-SDK at it's [website](https://mafsdk.tv/), or on [GitHub](https://git.io/maf3-sdk).

For any questions regarding App developement please use the [Metrological Helpdesk](https://metrological.atlassian.net/servicedesk/customer/portal/).

## License

MIT
