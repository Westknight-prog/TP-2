const Model = require('./model');
module.exports =
    class Bookmark extends Model {
        constructor(Title, url, category) {
            super();
            this.Title = Title !== undefined ? Title : "";
            this.Url = url !== undefined ? url : "";
            this.Category = category !== undefined ? category : "";

            this.setKey("Url");
            this.addValidator('Title', 'string');
            this.addValidator('Url', 'url');
            this.addValidator('Category', 'string');
        }
    }