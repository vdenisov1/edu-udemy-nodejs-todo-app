require('./config/config');
require('./db/mongoose');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

const { Todo } = require('./models/Todo');
const { User } = require('./models/User');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
    let todoItem = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });

    todoItem.save().then((doc) => {
        res.status(200);
        res.send(doc);
    }, (err) => { 
        res.status(400);
        res.send(err);
    });

});

app.get('/todos', authenticate, (req, res) => {
    Todo.find({ _creator: req.user._id })
        .then((items) => {
            res.status(200);
            res.send({ items });
        }, (err) => {
            res.status(400);
            res.send(err);
        });

});

app.get('/todos/:id', authenticate, (req, res) => {

    if (!ObjectID.isValid(req.params.id)) {
        return res.status(404).send();
    }

    Todo.findOne({ _id: req.params.id, _creator: req.user._id}).then((todo) => {
        if(!todo) {
            return res.status(404).send();
        }

        res.status(200).send(todo);
    }).catch((err) => {
        res.status(400).send();
    });
});

app.delete('/todos/:id', authenticate, (req, res) => {

    if (!ObjectID.isValid(req.params.id)){
        return res.status(404).send();
    }

    Todo.findOneAndDelete({ _id: req.params.id, _creator: req.user._id }).then((doc) => {
        if(!doc) {
            return res.status(404).send();
        }

        res.status(204).send();
    }).catch((err) => {
        res.status(400).send();
    });
});

app.patch('/todos/:id', authenticate, (req, res) => {
    let todo = _.pick(req.body, ['text','completed']);

    if(!ObjectID.isValid(req.params.id)){
        return res.status(404).send();
    }

    Todo.findOneAndUpdate({ _id: req.params.id, _creator: req.user._id }, todo).then((doc) => {
        if(!doc) {
            return res.status(404).send();
        }

        res.status(204).send();
    }).catch((err) => {
        res.status(400).send();
    });
});

app.post('/users', (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);
    let user = new User(body);
    
    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);
    
    User.findByCredentials(body.email, body.password).then((user) => {
        user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        });
    }).catch((err) => {
        res.status(401).send();
    });    
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }).catch((err) => {
        res.status(400).send();
    });
});

app.listen(port, () => {
    console.log('Started on port', port);
});

module.exports = { app };