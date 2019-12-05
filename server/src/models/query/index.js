'use strict'

const Pair = require('crocks/Pair')
const List = require('list/curried')
const { addIndex, pipe, prop, reduce } = require('ramda')
const converge = require('crocks/combinators/converge')
const merge = require('crocks/pointfree/merge')
const identity = require('crocks/combinators/identity')
const bimap = require('crocks/pointfree/bimap')
const wordToId = require('../wordToId')
const { words } = require('../../utils')

/** documentLocation :: List Number -> Page -> Number */
const locationScore = queryIds => ({ words }) =>
  reduce(
    (score, q) => {
      const index = List.indexOf(q, words)
      const increment = index >= 0 ? index + 1 : 1000000
      return score + increment
    },
    0,
    queryIds
  )

/** frequencyScore :: (List Number) -> Page -> Number */
const frequencyScore = queryIds =>
  pipe(
    prop('words'),
    reduce(
      (score, word) => (List.includes(word, queryIds) ? score + 1 : score),
      0
    )
  )

/** minimum :: Foldable f => f Number -> Number */
const minimum = reduce(Math.min, Infinity)

/** maximum :: Foldable f => f Number -> Number */
const maximum = reduce(Math.max, -Infinity)

/** normalizeInverted :: List Number -> List Number */
const normalizeInverted = converge(
  (min, scores) => List.map(score => min / Math.max(score, 0.00001), scores),
  minimum,
  identity
)

/** normalize :: List Number -> List Number */
const normalize = converge(
  (max, scores) => List.map(score => score / max, scores),
  scores => Math.max(maximum(scores), 0.00001),
  identity
)

const sequenceList = merge((l1, l2) =>
  addIndex(reduce)(
    (list, n, i) => List.append(Pair(n, List.nth(i, l2)), list),
    List.empty(),
    l1
  )
)

/** getScores :: (List Number) -> (List Page) -> Pair (List Number) (List Number) */
const getScores = queryIds =>
  reduce(
    (scores, page) =>
      scores.bimap(
        List.append(frequencyScore(queryIds)(page)),
        List.append(locationScore(queryIds)(page))
      ),
    Pair(List.empty(), List.empty())
  )

const getNormalizedScores = queryIds =>
  pipe(
    getScores(queryIds),
    bimap(normalize, normalizeInverted),
    sequenceList
  )

const results = pages =>
  pipe(
    addIndex(reduce)(
      (results, scores, i) =>
        scores.fst() > 0
          ? List.append(
            Pair(List.nth(i, pages), scores.fst() + 0.8 * scores.snd()),
            results
          )
          : results,
      List.empty()
    ),
    List.sortWith((a, b) => b.snd() - a.snd()),
    List.take(5),
    List.map(p => ({ url: p.fst().url, score: p.snd() }))
  )

const query = pages => query => {
  const queryIds = List.map(wordToId, words(query))
  const scores = getNormalizedScores(queryIds)(pages)
  return results(pages)(scores)
}

module.exports = query