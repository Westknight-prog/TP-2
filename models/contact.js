const Model = require('./model');
module.exports =
    class Contact extends Model {
        constructor(title, phone, email) {
            super();
            this.Title = title !== undefined ? title : "";
            this.Phone = phone !== undefined ? phone : "";
            this.Email = email !== undefined ? email : "";

            this.setKey("Title");
            this.addValidator('Title', 'string');
            this.addValidator('Phone', 'phone');
            this.addValidator('Email', 'email');
        }
    }