const rp = require('request-promise');
const cheerio = require('cheerio');
var request = require('request');
var progress = require('request-progress');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const program = require('commander');
program.version('0.0.1');
const fs = require('fs');

const saveConfig = ()=> fs.writeFileSync("./.mods", JSON.stringify(config));
var config = {};
if (fs.existsSync("./.mods")){
    try{ config = JSON.parse(fs.readFileSync("./.mods"));
    }catch(e){
        console.log(chalk.red('Recreating .mods file'));
        saveConfig();
    }
}else{
    console.log(chalk.green('Creating .mods file'));
    saveConfig();
}

const downloadLink = (project,file)=> "https://minecraft.curseforge.com/projects/"+project+"/files/"+file+"/download";
const versions = {
    "1.13":     "1738749986:55023",
    "1.12":     "1738749986:628",
    "1.11":     "1738749986:599",
    "1.10":     "1738749986:572",
    "1.9":      "1738749986:552",
    "1.8":      "1738749986:4",
    "1.7.10":   "2020709689:4449"
}
var cacheFiles = {null:false}
var cacheDependencies = {null:false};

function search(name, callback, version=false, page=1){
    rp('https://minecraft.curseforge.com/search?search='+name+'&projects-page='+page).then(function(html){
        var $ = cheerio.load(html);

        var results = {};
        $('.results').each(function(i,e){
            var id = $(e).children('td').children('.results-name').children('a').attr("href").split('?')[0].replace('/projects/','');
            results[id] = {
                id,
                name: $(e).children('td').children('.results-name').children('a').html(),
                image: $(e).children('td').children('.results-image').children('img').attr("src"),
                description: $(e).children('td').children('.results-summary').val(),
                author: $(e).children('.results-owner').children('a').text(),
                date: $(e).children('.results-date').children('abbr').text(),
            }
            if (version) get(id, version, d=> results[id].download = d);
        });
        callback(results);
    }).catch(()=>callback(false));
}

function get(id, version, callback){

    var mod = {
        downloadLink: '',
        dependencies:[]
    }

    getFile(id, version, file=> {
        if (file){
            mod.downloadLink = downloadLink(id, file);
            getDependencies(id, d=> {
                mod.dependencies=d;
                callback(mod);
            }, version);
        }else console.log(chalk.redBright("No version for")+' '+chalk.cyanBright(id));
    });
}

function getFile(project, version, callback){
    if (!cacheFiles[project+version]){
        rp('https://minecraft.curseforge.com/projects/'+project+'/files/?filter-game-version='+version).then(function(html){
            var file = cheerio.load(html)(".project-file-list-item:first-child .project-file-name-container>a").attr("href");
            if (file){
                file = file.split("/");
                cacheFiles[project+version] = file[file.length-1];
            }else cacheFiles[project+version] = false;
            callback(cacheFiles[project+version]);
        }).catch(()=>callback(false));
    }else callback(cacheFiles[project+version]);
}

function getDependencies(project, callback, version=false){
    if (!cacheDependencies[project+version]){
        rp('https://minecraft.curseforge.com/projects/'+project+'/relations/dependencies?filter-related-dependencies=3').then(function(html){
            var dependencies = [];
            var $ = cheerio.load(html);
            $('.project-list-item .name-wrapper.overflow-tip a').each(function(i,e){
                var depend = $(e).attr('href').split("/");
                depend = depend[depend.length-1];
                if (version) getFile(depend, version, file=> (file) ? dependencies.push(downloadLink(depend, file)) : console.log(chalk.redBright("No version for")+' '+chalk.cyanBright(depend)));
                else dependencies.push(depend);
            });
            cacheDependencies[project+version] = dependencies;
            callback(cacheDependencies[project+version]);
        }).catch(()=>callback(false));
    }else callback(cacheDependencies[project+version]);
}

function download(project){
    var version = config.version;
    if (versions[version]){
        console.log(chalk.bold.yellow("Downloading ") + chalk.bold.cyanBright(project) + chalk.bold.yellow(" version ") +  chalk.bold.magenta(version));
        getFile(project, version, file=>{
            if (file){
                var bar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);
                var max = Math.round(Math.random()*1000)+500;
                bar.start(max, 0);

                var req = request(downloadLink(project, file));
                
                progress(req, {}).on('progress', function (state) {
                    bar.update(Math.round(state.percent*max));
                }).on('error', err=>{
                    bar.stop()
                    console.log(chalk.redBright("Can't download the mod"));
                }).on('end', ()=>{
                    bar.update(max);
                    bar.stop()
                    console.log(chalk.green("Mod successfully downloaded"));
                    config.version = version;
                    if (!config.mods) config.mods = {};
                    config.mods[project] = file;
                    saveConfig();
                }).pipe(fs.createWriteStream(project+'.jar'));
                
            }else console.log(chalk.redBright("Project not found"));
        })
    }else console.log(chalk.red("Please set the version with the command ")+chalk.yellow("version")+chalk.red(" before doing that"));
}

function update(){
    if (config.mods && Object.keys(config.mods).length>0){
        Object.entries(config.mods).forEach(a => {
            var local = a[0];
            var online = a[1];

            getFile(local, config.version, file=>{
                if (file != online || !fs.existsSync('./'+local+'.jar')){
                    if (file != online) console.log(chalk.yellow("Upgrading ")
                        +chalk.blueBright(local)
                        +chalk.yellow(" from ")
                        +chalk.magenta(online)
                        +chalk.yellow(" to ")
                        +chalk.magenta(file));
                    download(local);
                }else{
                    console.log(chalk.blueBright(local)+chalk.yellow(" : up to date !"));
                }
            });
            
        });
    }else{
        console.log(chalk.redBright("No mods in .mods file"));
    }
}

function remove(id){
    if (config.mods && config.mods[id]){
        delete config.mods[id];
        saveConfig();
    }
    if (fs.existsSync("./"+id+".jar")) fs.unlinkSync("./"+id+".jar");
    console.log(chalk.green("Mod ")+chalk.red(id)+chalk.green(" removed"));
}

program.command('search <name>').description('Search a mod').action(search=>{
    search(search, rs=>
        Object.keys(rs).length>0 ?
        Object.entries(rs).forEach(e=> console.log(chalk.bold.cyanBright(e[1].id) + " => " + chalk.yellowBright(e[1].name))) :
        console.log(chalk.redBright("No result"))
    );
});

program.command('u').description('Update installed mods').action(update);
program.command('update').description('Update installed mods').action(update);

program.command('i <id>').description('Install a mod').action(download);
program.command('install <id>').description('Install a mod').action(download);

program.command('remove <id>').description('Remove a mod').action(remove);
program.command('delete <id>').description('Remove a mod').action(remove);
program.command('uninstall <id>').description('Remove a mod').action(remove);

program.command('version <version>').description('Change the default version of mods').action(version=>{
    if (versions[version]){
        console.log(
            chalk.green("Version upgraded from ")
            +chalk.magenta(config.version)
            +chalk.green(" to ")
            +chalk.magenta(version)
        );
        config.version = version;
        saveConfig();
        console.log(
            chalk.green("Command ")
            +chalk.yellow("update")
            +chalk.green(" to update all the mods to the new version")
        );
    }else{
        console.log(chalk.red("Version ")+chalk.redBright(version)+chalk.red(" is invalid !"));
        console.log(chalk.yellow("Please pick a version from the following list : ") + chalk.blue(Object.keys(versions)));
    }
});

program.command('depend <id>').description('Remove a mod').action(id=>{
    console.log(chalk.magenta("Dependencies:"));
    getDependencies(id, dps=>
        dps.length>0 ?
        dps.forEach(dp=> console.log(chalk.underline.blueBright(dp))) :
        console.log(chalk.green("No dependencies"))
    );
});

program.parse(process.argv);
