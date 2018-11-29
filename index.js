require('dotenv').config();
const fs = require('fs');
const JSZip = require('jszip');
const format = require('xml-formatter');
const watch = require('node-watch');

const PATH_TO_WATCH = process.env.ZIP_WATCHER_PATH || '../public';
const FILE = process.env.ZIP_WATCHER_FILE || 'Document.xml';

console.log(`Path to watch: ${PATH_TO_WATCH} \nFile to export: ${FILE}`);

watch(PATH_TO_WATCH, { recursive: false }, function(evt, name) {
    read('./' + name);
});

const read = function(file) {

    if (!fs.existsSync(file)) {
        return;
    }

    fs.readFile(file, function(err, data) {
        if (err) throw err;

        JSZip.loadAsync(data).then(function(zip) {

            const filesToExport = Object.keys(zip.files).filter(name => name === FILE);

            filesToExport.forEach(fileName => {

                zip.file(fileName).async('nodebuffer').then(function(content) {

                    const formatted = format(content.toString());
                    const path = `${file}_${FILE}.xml`;
                    console.log('WRITING ', path);
                    fs.writeFileSync(path, formatted);
                });
            });
        });
    });
};
