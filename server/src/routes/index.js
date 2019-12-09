'use strict'
const { routes, methods, json } = require ('paperplane')
const query = require('../models/query')
const { allPages } = require('../repositories/pages')
const { time } = require('../utils')
const L = require('list/curried')
const { path, pipe } = require('ramda')

module.exports = pages => routes ({
  '/search' : methods ({
    GET: pipe (
      path (['query', 'q']),
      time(query(pages)),
      ([executionTime, results]) => ({
        topResults: L.toArray(L.take(5, results)),
        executionTime: executionTime / 1000,
        numResults: L.length(results)
      }),
      json
    )
    
  })
})