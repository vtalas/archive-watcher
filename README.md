# archive-watcher
watches for changes of all zip files in folder. Extract specified xml file from the zip and saves it on the disk when the archive is changed.


### cmd
```
# watches for all changes in the `./archive` folder
# extract the `document.xml` from the changed archive
archive-watcher --path=./archives --file=document.xml
```
