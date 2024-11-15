const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: {type: String},
    password: { type: String },
    googleId: {type: String},
    resetPasswordToken: { type: String },  
    resetPasswordExpires: { type: Date } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
