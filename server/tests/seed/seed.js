const { ObjectID } = require("mongodb");

const { Todo } = require("../../models/Todo");
const { User } = require('../../models/User');
const jwt = require('jsonwebtoken');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const createdTodos = [
    {
        _id: new ObjectID(),
        text: "First test todo",
        _creator: userOneId
    },
    {
        _id: new ObjectID(),
        text: "Second test todo",
        _creator: userTwoId
    }
];

const createdUsers = [
    {
        _id: userOneId,
        email: "first@test.com",
        password: "test111",
        tokens: [
            {
                access: 'auth',
                token: jwt.sign({ _id: userOneId, access: 'auth' }, process.env.JWT_SECRET).toString()
            }
        ]
    },
    {
        _id: userTwoId,
        email: 'second@test.com',
        password: 'test222',
        tokens: [
            {
                access: 'auth',
                token: jwt.sign({ _id: userTwoId, access: 'auth' }, process.env.JWT_SECRET).toString()
            }
        ]
    }
];

const populateTodos = done => {
  Todo.deleteMany({})
    .then(() => {
      return Todo.insertMany(createdTodos);
    })
      .then(() => done()).catch((err) => done(err));
};

const populateUsers = done => {
    User.deleteMany({}).then(() => {
        let promises = [];

        for(let user of createdUsers){
            promises.push(new User(user).save());
        }

        return Promise.all(promises);
    }).then(() => done()).catch((err) => done(err));
};

module.exports = { createdTodos, populateTodos, populateUsers, createdUsers };