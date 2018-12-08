const request = require('supertest');
const expect = require('expect.js');
const { ObjectID } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/Todo');

const createdTodos = [
  {
    _id: new ObjectID(),
    text: "First test todo"
  },
  {
    _id: new ObjectID(),
    text: "Second test todo"
  }
];

beforeEach((done) => {
    Todo.deleteMany({}).then(() => {
        return Todo.insertMany(createdTodos);
    }).then(() => done());
});

describe('POST /todos', () => {

    it('should create a new todo', (done) => {
        let text = 'Hello world';

        request(app)
            .post('/todos')
            .send({text})
            .expect(200)
            .expect((res) => {
                expect(res.body.text).to.be(text);
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).to.be(createdTodos.length + 1);
                    expect(todos[createdTodos.length].text).to.be(text);
                    done();
                }).catch((err) => done(err));
            });
    });

    it('should NOT create a new todo', (done) => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    if(err) {
                        return done(err);
                    }

                    Todo.find().then((todos) => {
                        expect(todos.length).to.be(createdTodos.length);
                        done();
                    }).catch((err) => done(err));
                });
            });
    });

});

describe('GET /todos', () => {

    it('should get a list of todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                expect(res.body.items.length).to.be(createdTodos.length);
                expect(res.body.items[0].text).to.be(createdTodos[0].text);
                done();
            });
    });

});

describe('GET /todos/:id', () => {

    it('should get back a todo item', (done) => {
        let item = createdTodos[0];
        request(app)
            .get(`/todos/${createdTodos[0]._id}`)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                expect(res.body).to.have.property("_id");
                expect(res.body._id).to.be(item._id.toString());
                expect(res.body.text).to.be(item.text);
                expect(res.body.completed).to.be(false);
                done();
            });
    });

    it('should return 404 for non-object ids', (done) => {
        request(app)
            .get(`/todos/abcd`)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                
                done();
            });
    });

    it('should return 404 if object not found ids', (done) => {
        let newId = new ObjectID();

        request(app)
            .get(`/todos/${newId}`)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                done();
            });
    });

});