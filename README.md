# Mod-Assistant

Light tool to manage mods from differents versions and update them easily.

## Dev installation
1. `git clone https://github.com/Mathieu2301/Mod-Assistant.git`
2. `npm i`
If you want to build : `npm i pkg && pkg .`

## Normal installation
1. Download [the last realase](https://github.com/Mathieu2301/Mod-Assistant/releases/)
2. Rename the file `moda`
3. Place it in your `mods` folder (On Windows, you can copy the file to `C:\Windows\System32`)

## Commands

| Command | Alias | Description |
|- | - | - |
| moda search <name> | - | Search a mod by his name |
| moda update | moda u | Update installed mods |
| moda version <version> | - | Change default version of mods |
| moda depend <id> | - | Get all dependencies of a mod |
| moda install <id> | moda i <id> | Update installed mods |
| moda delete <id> | moda remove <id> | Remove a mod |

## Tricks

### Change the version of ALL your mods
If you want to change the version of ALL your installed mods, you have to use the command `moda version` and `moda update`
1. Open a shell in your `mods` folder
2. Type `moda version <version>` replacing by the version you want to upgrade to.
3. Type `moda update` and all the mods will be re-downloaded if they are available in the version.

### Share your modpack
All installed mods are stored in the `.mods` file. Just share it or save it to make your friends can easily install them.
If you can't rename the `.mods` file, ZIP it.

### Update all your mods
To update all your mods :
1. Open a shell in your `mods` folder
2. Type `moda update`

## TO-DO
- If you call `moda depend all`, it will check all mods dependencies.
