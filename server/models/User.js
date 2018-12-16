const _ = require('lodash');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const TokenSchema = new Schema({
    access: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    }
});

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '${VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [TokenSchema]
});

UserSchema.methods.generateAuthToken = function() {
    let user = this;
    let access = 'auth';
    let token = jwt.sign({ _id: user._id.toHexString(), access: access }, process.env.JWT_SECRET).toString();
    let foundPreviousAuthToken = false;

    for(let userToken of user.tokens){
        if (userToken.access === access){
            userToken.token = token;
            foundPreviousAuthToken = true;
        }
    }

    if(!foundPreviousAuthToken){
        user.tokens.push({ access, token });
    }

    return user.save().then(() => {
        return token;
    });
};

UserSchema.methods.toJSON = function(){
    let user = this;
    let userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.removeToken = function(token){
    let user = this;
    
    return user.updateOne({
        $pull: {
            tokens: {
                token: token
            }
        }
    });
}

UserSchema.statics.findByToken = function(token) {
    let User = this;
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

UserSchema.statics.findByCredentials = function(email, password) {
    let User = this;
    
    return User.findOne({ email }).then((user) => {
        if(!user){
            return Promise.reject({});
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, valid) => {
                if(valid){
                    resolve(user);
                }else{
                    reject();
                }
            });
        });
    }).catch((err) => {
        return Promise.reject({});
    });
}

UserSchema.pre('save', function(next) {
    let user = this;
    
    if(user.isModified('password')){
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    }else{
        next();
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = { User };