#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const JSZip = require('jszip');
const format = require('xml-formatter');
const watch = require('node-watch');
const path = require('path');
const SUPPORTED_EXTENSIONS = ['.zip', '.mmap', '.mmas', '.mmat'];
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
const FORMAT = params['format'] !== 'false' && params['format'] !== undefined;

console.log(`Path to watch: ${PATH_TO_WATCH} \nFile to export: ${FILE}`);

watch(PATH_TO_WATCH, { recursive: false }, function(evt, name) {

    if (SUPPORTED_EXTENSIONS.includes(path.extname(name))) {
        console.log('READING ', name);
        read('./' + name);
    } else {
        console.log('SKIPPING ', name);
    }
});

const read = function(file) {

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

                    const output = FORMAT ? format(content.toString()) : content;
                    const path = `${file}_${FILE}.xml`;
                    console.log('WRITING ', path);
                    fs.writeFileSync(path, output);
                });
            });
        }, function(err) {
            console.error(file, err);
        });
    });
};
