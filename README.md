# 📺 MAF CLI

## TODO: put in maf.sh for curl command

## Installation

npm i -g maf-cli

touch .mafrc.js

maf init (runs: npm init, git init, git add remote and scaffolds maf project)

## MAF key combinations:

RC - Stop       = Shift + Down.

RC - Play/Pause = Shift + Up.

RC - Rewind     = Shift + Left.

RC - Forward    = Shift + Right.

RC - Back       = Backspace.

Red             = F1.

Green           = F2.

Yellow          = F3.

Blue            = F4.

Channel Up      = PageUp.

Channel Down    = PageDown.



## Completion for maf

To enable tasks auto-completion in shell you should add `eval "$(maf --completion=shell)"` in your `.shellrc` file.

### Bash

Add `eval "$(maf --completion=bash)"` to `~/.bashrc`.

### Zsh

Add `eval "$(maf --completion=zsh)"` to `~/.zshrc`.
