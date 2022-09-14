const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
    name: String,
    price: Number,
});

MenuSchema.virtual('id').get(function() {
    return this._id;
});

const Menu = mongoose.model("Menu", MenuSchema);

module.exports = Menu;