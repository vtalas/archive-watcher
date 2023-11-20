#!/usr/bin/env node

console.log('archive watcher')

require('dotenv').config();
const fs = require('fs');
const JSZip = require('jszip');
// const format = require('xml-formatter');
const format = require('./xml-formatter-update');
const watch = require('node-watch');
const path = require('path');
const SUPPORTED_ARCHIVE_EXTENSIONS = ['.zip', '.mmap', '.mmas', '.mmat'];
const [, , ...args] = process.argv;

const params = args.reduce((res, item) => {
    const parts = item.split('=');
    res[parts[0].replace(/-/g, '')] = parts[1];
    return res;
}, {});

if (!process.env.ARCHIVE_WATCHER_PATH && !params['path']) {
    console.log('\n usage: archive-watcher --path=<path to watch> --file=<file from archive to be extracted> \n');
}

const PATH_TO_WATCH = params['path'] || process.env.ARCHIVE_WATCHER_PATH || '../public';
const FILE = params['file'] || process.env.ARCHIVE_WATCHER_FILE || 'Document.xml';

// default true
const FORMAT = (params['format'] !== 'false' && params['format'] !== undefined) ? false : true;

console.log(`Path to watch: ${PATH_TO_WATCH} \nFile to export: ${FILE}`);

const openWatcher = function() {

    return watch(PATH_TO_WATCH, { recursive: false }, function(evt, name) {

        if (SUPPORTED_ARCHIVE_EXTENSIONS.includes(path.extname(name))) {
            console.log('UNPACKING ', name);
            unpack('./' + name);
        } else {
            console.log('SKIPPING ', name);
        }
    });
};

let watcher = openWatcher();

const unpack = function(file) {

    if (!fs.existsSync(file)) {
        return;
    }

    fs.readFile(file, function(err, data) {

        if (err) {
            console.log('ERROR ', file);
            throw err;
        }

        JSZip.loadAsync(data).then(function(zip) {

            const filesToExport = Object.keys(zip.files).filter(name => name === FILE);

            filesToExport.forEach(fileName => {

                zip.file(fileName).async('nodebuffer').then(function(content) {

                    const path = `${file}_${FILE}.xml`;
                    console.log('WRITING ', path);
                    fs.writeFileSync(path, content);

                    if (FORMAT) {

                        const output = format(content.toString().replace('<?xml-client name="MindManager" version="21.1.186" platform="Windows"?>', ''), {
                            indentation: '  ',
                            collapseContent: true
                        })
                        const path = `${file}_${FILE}_formatted.xml`;
                        console.log('WRITING FORMATTED', path);
                        fs.writeFileSync(path, output);
                    }
                });
            });
        }, function(err) {
            console.error(file, err);
        });
    });
};

function updateArchive(file) {

    const parts = file.split('_');
    const archive = parts[0];
    const zip = new JSZip();

    fs.readFile(file, function(err, data) {

        if (err) {
            console.log('UPDATE ARCHIVE ERR ', file);
        }

        watcher.close();

        zip
            .file(FILE, data)
            .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
            .pipe(fs.createWriteStream(archive))
            .on('finish', function() {

                setTimeout(function() {
                    watcher = openWatcher();
                }, 500);

                // console.log('write zIP', archive);
            })
            .on('error', function(err) {
                console.log('error', err);
            });
    });


}
