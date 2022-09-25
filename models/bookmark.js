const Model = require('./model');
module.exports =
    class Bookmark extends Model {
        constructor(Name, url, category) {
            super();
            this.Name = Name !== undefined ? Name : "";
            this.Url = url !== undefined ? url : "";
            this.Category = category !== undefined ? category : "";

            this.setKey("Url");
            this.addValidator('Name', 'string');
            this.addValidator('Url', 'url');
            this.addValidator('Category', 'string');
        }
    }