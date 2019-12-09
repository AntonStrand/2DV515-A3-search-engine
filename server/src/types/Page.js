const L = require('list/curried')

/**
 * Page ::
 *   { url   :: String
 *   , words :: List Number
 *   , links :: Set String
 *   }
 * @param {String} url
 * @param {List<Number>} words
 * @param {Set<String>} links
 */

const Page = (url, words, links, pageRank = 1) => ({ url, words, links, pageRank })

const hasLinkTo = to => from => from.links.has(`/wiki/${to.url.split('/').pop()}`)

module.exports = {
  of: Page,
  hasLinkTo
}
