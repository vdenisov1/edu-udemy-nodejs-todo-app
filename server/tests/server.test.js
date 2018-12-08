const request = require('supertest');
const expect = require('expect.js');

const { app } = require('../server');
const { Todo } = require('../models/Todo');

beforeEach((done) => {
    Todo.deleteMany({}).then(() => done());
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
                    expect(todos.length).to.be(1);
                    expect(todos[0].text).to.be(text);
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
                        expect(todos.length).to.be(0);
                        done();
                    }).catch((err) => done(err));
                });
            });
    });

});

describe('GET /todos', () => {

    it('should get a list of todos', (done) => {
        let text = 'Make this test pass';
        let todoItem = new Todo({ text });
        
        todoItem.save().then((doc) => {
            request(app)
                .get('/todos')
                .expect(200)
                .end((err, res) => {
                    if(err) {
                        return done(err);
                    }

                    expect(res.body.todos.length).to.be(1);
                    expect(res.body.todos[0].text).to.be(text);
                    done();
                });
        }).catch((err) => done(err));
    });

});