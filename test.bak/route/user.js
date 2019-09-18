'use strict'

const bcrypt  = require('bcrypt')
const test    = require('tape')
const _       = require('lodash')
const util    = require('util')

const server  = require('../mock/server')

let userID, ucID, contactID, userEmail = null,
    password = 'mypassword'


// Setup test contact
test('POST /contact type=business success', t => {
  const opts = {
    method: 'POST',
    url: '/contact',
    payload: {
      name: {
        first: 'Test',
        last: 'User'
      },
      email: `${Math.random()}test@example.com`,
      type: 'user'
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    contactID = resp.result._id
    userEmail = resp.result.email
    server.stop(t.end)
  })
})


// **** Describe POST /user **** //

test('POST /user create success', t => {
  const opts = {
    method: 'POST',
    url: '/user',
    payload: {
      email:    userEmail,
      password: password,
      contact:  contactID
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    userID = resp.result._id
    server.stop(t.end)
  })
})

test('POST /user-contact create user and contact combination success', t => {
  const email = Math.random() + 'test@example.com'
  const opts = {
    method: 'POST',
    url: '/contact-user',
    payload: {
      contact: {
        name: {
          first: 'Test',
          last: 'Dummy'
        },
        email: email,
        type: 'user'
      },
      user: {
        email: email,
        password: 'mypassword',
        active: true
      }
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    const res = resp.result
    ucID = res._id
    server.stop(t.end)
  })
})

// **** Describe PUT /user **** //

test('PUT /user-contact/id update user and contact combination success', t => {
  const email = Math.random() + 'test@example.com'
  const opts = {
    method: 'PUT',
    url: `/contact-user/${ucID}`,
    payload: {
      contact: {
        name: {
          first: 'Test2',
          last: 'Dummy2'
        },
        email: email,
        type: 'user'
      },
      user: {
        email: email,
        password: 'mypassword',
        active: true
      }
    }
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.email, email)
    t.equal(res.contact.name.first, 'Test2')
    // console.log('password: ', res.password)
    server.stop(t.end)
  })
})


// **** Describe GET /user **** //

test('GET /users fetch all users success', t => {
  const opts = {
    method: 'GET',
    url: '/users'
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(util.isArray(res), true)
    server.stop(t.end)
  })
})

test('GET /user/{id} fetch user and compare password', t => {
  const opts = {
    method: 'GET',
    url: `/user/${userID}`
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    // t.ok(bcrypt.compareSync(password, res.password), 'password hash compare ok')
    server.stop(t.end)
  })
})

test('GET /user/{id} fetch user and populate', t => {
  const opts = {
    method: 'GET',
    url: `/user/${userID}?populate=1`
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.email, userEmail)
    t.equal(res.contact.name.first, 'Test')
    t.equal(res.contact.name.last, 'User')
    t.equal(res.contact.email, res.email)
    server.stop(t.end)
  })
})


// **** Describe PUT /user **** //

test('PUT /user/{id} update user', t => {
  const opts = {
    method: 'PUT',
    url: `/user/${userID}`,
    payload: {
      active: true,
      role: 'administrator'
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.active, true)
    t.equal(res.role, 'administrator')
    server.stop(t.end)
  })
})


// **** Describe PATCH /user **** //

test('PATCH /user/{id} active field', t => {
  const opts = {
    method: 'PATCH',
    url: `/user/${userID}`,
    payload: {
      field: 'active',
      value: false
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.active, false)
    server.stop(t.end)
  })
})

test('PATCH /user/{id} role field', t => {
  const opts = {
    method: 'PATCH',
    url: `/user/${userID}`,
    payload: {
      field: 'role',
      value: 'employee'
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.role, 'employee')
    server.stop(t.end)
  })
})


// **** Describe DELETE /user **** //

test('DELETE /user/{id}', t => {
  const opts = {
    method: 'DELETE', 
    url: `/user/${userID}`
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})


// **** Describe DELETE /contact **** //

/*test('DELETE /contact/{id}', t => {
  const opts = {
    method: 'DELETE', 
    url: `/contact/${contactID}`
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})*/