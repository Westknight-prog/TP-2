///////////////////////////////////////////////////////////////////////////
// This class provide CRUD operations on JSON objects collection text file
// with the assumption that each object have an Id member.
// If the objectsFile does not exist it will be created on demand.
/////////////////////////////////////////////////////////////////////
// Author : Nicolas Chourot
// Lionel-Groulx College
// Modifier Par Samuel Houle dans le cadre du TP2
/////////////////////////////////////////////////////////////////////

const fs = require('fs');
const utilities = require('../utilities.js');


class Repository {
    constructor(model) {
        this.objectsList = null;
        this.model = model;
        this.objectsName = model.getClassName() + 's';
        this.objectsFile = `./data/${this.objectsName}.json`;
        this.bindExtraDataMethod = null;
        this.updateResult = {
            ok: 0,
            conflict: 1,
            notFound: 2,
            invalid: 3
        }
    }
    setBindExtraDataMethod(bindExtraDataMethod) {
        this.bindExtraDataMethod = bindExtraDataMethod;
    }
    objects() {
        if (this.objectsList == null)
            this.read();
        return this.objectsList;
    }
    read() {
        try {
            let rawdata = fs.readFileSync(this.objectsFile);
            // we assume here that the json data is formatted correctly
            this.objectsList = JSON.parse(rawdata);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // file does not exist, it will be created on demand
                log(FgYellow, `Warning ${this.objectsName} repository does not exist. It will be created on demand`);
                this.objectsList = [];
            } else {
                log(Bright, FgRed, `Error while reading ${this.objectsName} repository`);
                log(Bright, FgRed, '--------------------------------------------------');
                log(Bright, FgRed, error);
            }
        }
    }
    write() {
        fs.writeFileSync(this.objectsFile, JSON.stringify(this.objectsList));
    }
    nextId() {
        let maxId = 0;
        for (let object of this.objects()) {
            if (object.Id > maxId) {
                maxId = object.Id;
            }
        }
        return maxId + 1;
    }
    add(object) {
        try {
            if (this.model.valid(object)) {
                let conflict = false;
                if (this.model.key) {
                    conflict = this.findByField(this.model.key, object[this.model.key]) != null;
                }
                if (!conflict) {
                    object.Id = this.nextId();
                    this.objectsList.push(object);
                    this.write();
                } else {
                    object.conflict = true;
                }
                return object;
            }
            return null;
        } catch (error) {
            console.log(FgRed, `Error adding new item in ${this.objectsName} repository`);
            console.log(FgRed, '-------------------------------------------------------');
            console.log(Bright, FgRed, error);
            return null;
        }
    }
    update(objectToModify) {
        if (this.model.valid(objectToModify)) {
            let conflict = false;
            if (this.model.key) {
                conflict = this.findByField(this.model.key, objectToModify[this.model.key], objectToModify.Id) != null;
            }
            if (!conflict) {
                let index = 0;
                for (let object of this.objects()) {
                    if (object.Id === objectToModify.Id) {
                        this.objectsList[index] = objectToModify;
                        this.write();
                        return this.updateResult.ok;
                    }
                    index++;
                }
                return this.updateResult.notFound;
            } else {
                return this.updateResult.conflict;
            }
        }
        return this.updateResult.invalid;
    }
    remove(id) {
        let index = 0;
        for (let object of this.objects()) {
            if (object.Id === id) {
                this.objectsList.splice(index, 1);
                this.write();
                return true;
            }
            index++;
        }
        return false;
    }
    getAll(params = null) {
        let objectsList = this.objects();
        if (this.bindExtraDataMethod != null) {
            objectsList = this.bindExtraData(objectsList);
        }
        if (params) {
            let model = this.model;
            let filteredAndSortedObjects = [];
            let sortKeys = [];
            let searchKeys = [];
            Object.keys(params).forEach(function (paramName) {
                if (paramName == "sort") {
                    let keyValues = params[paramName];
                    if (Array.isArray(keyValues)) {
                        for (let key of keyValues) {
                            let values = key.split(',');
                            let descendant = (values.length > 1) && (values[1] == "desc");
                            sortKeys.push({ key: values[0], asc: !descendant });
                        }
                    } else {
                        let value = keyValues.split(',');
                        let descendant = (value.length > 1) && (value[1] == "desc");
                        sortKeys.push({ key: value[0], asc: !descendant });
                    }
                } else {
                    if (paramName in model)
                        searchKeys.push({ key: paramName, value: params[paramName] });
                }
            });
            if(sortKeys.length<=0)
                sortKeys.push({ key: "Id", asc: true });

            filteredAndSortedObjects = objectsList.filter((item)=>{
                let match = true;
                searchKeys.forEach(element=>{
                    if(!this.valueMatch(item[element['key']],element['value']))
                        match = false;
                });
                return match;
            });
            filteredAndSortedObjects.sort((a,b)=>{
                let orderByKey = sortKeys[0]['key'];
                  if ((typeof a[orderByKey]) === 'string')
                      return a[orderByKey].localeCompare(b[orderByKey]);
                  else
                      return this.compareNum(a[orderByKey],b[orderByKey]);
              });
            
           filteredAndSortedObjects = sortKeys[0]['asc']? filteredAndSortedObjects : filteredAndSortedObjects.reverse(); 

            return filteredAndSortedObjects;
        }
        return objectsList;
    }
    get(id) {
        for (let object of this.objects()) {
            if (object.Id === id) {
                if (this.bindExtraDataMethod != null)
                    return this.bindExtraDataMethod(object);
                else
                    return object;
            }
        }
        return null;
    }
    removeByIndex(indexToDelete) {
        if (indexToDelete.length > 0) {
            utilities.deleteByIndex(this.objects(), indexToDelete);
            this.write();
        }
    }
    findByField(fieldName, value, excludedId = 0) {
        if (fieldName) {
            let index = 0;
            for (let object of this.objects()) {
                try {
                    if (object[fieldName] === value) {
                        if (object.Id != excludedId)
                            return this.objectsList[index];
                    }
                    index++;
                } catch (error) {
                    break;
                }
            }
        }
        return null;
    }
    valueMatch(value, searchValue) {
        try {
            let exp = '^' + searchValue.toLowerCase().replace(/\*/g, '.*') + '$';
            return new RegExp(exp).test(value.toString().toLowerCase());
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    compareNum(x, y) {
        if (x === y) return 0;
        else if (x < y) return -1;
        return 1;
    }
    
}

module.exports = Repository;