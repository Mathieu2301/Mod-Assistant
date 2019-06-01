# Mod-Assistant

Light tool to manage mods from differents versions and update them easily.

## Dev installation
1. `git clone https://github.com/Mathieu2301/Mod-Assistant.git`
2. `npm i`
If you want to build : `npm i pkg && pkg .`

## Normal installation
1. Download [the last realase](https://github.com/Mathieu2301/Mod-Assistant/releases/)
2. Rename the file `moda`
3. On windows, you can copy the file to `C:\Windows\System32`

## Commands

### Search a mod by his name
```
moda search <name>
```

### Update installed mods
```
moda update
(or 'moda u')
```
### Change default version of mods
```
moda version <version>
```
### Get all dependencies of a mod
```
moda depend <id>
```
### Update installed mods
```
moda install <id>
(or 'moda i <id>')
```
### Remove a mod
```
moda delete <id>
moda remove <id>
moda uninstall <id>
```
