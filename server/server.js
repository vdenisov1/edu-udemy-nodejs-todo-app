const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/Todo');
const { User } = require('./models/User');

const app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    let todoItem = new Todo(req.body);

    todoItem.save().then((doc) => {
        res.status(200);
        res.send(doc);
    }, (err) => { 
        res.status(400);
        res.send(err);
    });
});

// app.get('/todos', (req, res) => {

// });

// app.get('/todos/:id', (req, res) => {

// });

app.listen(3000, () => {
    console.log('Started on port', 3000);
});

module.exports = { app };