const request = require('supertest');
const expect = require('expect.js');
const { ObjectID } = require("mongodb");

const { app } = require('../server');
const { Todo } = require('../models/Todo');
const { User } = require('../models/User');
const { createdTodos, populateTodos, createdUsers, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

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

describe('DELETE /todos/:id', () => {

    it('should delete a todo item', (done) => {
        let id = createdTodos[0]._id;

        request(app)
            .delete(`/todos/${id}`)
            .expect(204)
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                done();
            });
    });

    it('should return 404 when todo not found', (done) => {
        let id = new ObjectID();

        request(app)
            .delete(`/todos/${id}`)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                done();
            });
    });

    it("should return 404 when todo id is invalid", done => {
      let id = "abc";

      request(app)
        .delete(`/todos/${id}`)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          done();
        });
    });

});

describe('DELETE /todos/:id', () => {

    it('should update a todo item', (done) => {
        let id = createdTodos[0]._id;
        let text = 'New todo text';

        request(app)
            .patch(`/todos/${id}`)
            .send({ text })
            .expect(204)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(id).then(doc => {
                    expect(doc.text).to.be(text);
                    done();
                  }).catch((err) => done(err));
            });
    });

    it('should return 404 when todo not found', (done) => {
        let id = new ObjectID();
        let body = { text: 'test me' };

        request(app)
            .patch(`/todos/${id}`)
            .send(body)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                done();
            });
    });

    it("should return 404 when todo id is invalid", done => {
        let id = "abc";
        let body = { text: "test me" };

        request(app)
          .patch(`/todos/${id}`, body)
          .expect(404)
          .end((err, res) => {
            if (err) {
              return done(err);
            }

            done();
          });
    });

});

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        let user = createdUsers[0];
        let token = user.tokens[0];

        request(app)
            .get('/users/me')
            .set('x-auth', token.token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).to.be(user._id.toHexString());
                expect(res.body.email).to.be(user.email);
            }).end(done);
    });

    it('should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', 'abc123')
            .expect(401)
            .expect((res) => {
                expect(res.body).to.eql({});
            })
            .end(done);
    });
});

describe('POST /users', () => {

    it('should create a user', (done) => {
        let email = 'example@example.com';
        let password = '123abcd';

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(200)
            .expect((res) => {
                expect(res.headers).to.have.property('x-auth');
                expect(res.body).to.have.property('_id');
                expect(res.body.email).to.be(email);
            })
            .end((err) => {
                if(err) {
                    return done(err);
                }

                User.findOne({email}).then((user) => {
                    expect(user).to.not.be(null);
                    expect(user.password).to.not.be(password);
                    expect(user.email).to.be(email);
                    done();
                }, (err) => done(err));
            });
    });

    it('should return validation errors if request invalid', (done) => {
        let email = 'invalid@invalid.com';
        let password = 'abc';

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(400)
            .end(done);
    });

    it('should not create user if email in use', (done) => {
        let user = createdUsers[0];
        
        request(app)
          .post("/users")
          .send({ email: user.email, password: user.password })
          .expect(400)
          .end(done);
    });

});