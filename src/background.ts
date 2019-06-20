import {loadBookmarks} from './bookmarks.js';
import {loadHistory} from './history.js';

const urlRegex = /^(?:https?\:\/\/)?(?:www\.)?([a-z]+)/i;
const goLinkRegex = /^(?:https?:\/\/)?go\/([a-z]+)$/i;

(async function init() {
  // construct map of urlKey -> url
  // e.g. {gogadget: "https://www.gogadget.com", ...}
  const urls: {string: string} = Object.assign(
    {},
    ...[
      ...await loadBookmarks(),
      ...await loadHistory({maxResults: 1000}),
    ]
    .map(url => [(url.match(urlRegex) || [])[1], url])
    .filter(([urlKey]) => urlKey)
    .map(([urlKey, url]) => ({[urlKey]: url})),
  );

  // redirect https://go/urlKey -> url
  // e.g. https://go/gogadget -> https://www.gogadget.com
  chrome.webRequest.onBeforeRequest.addListener(
    function (details: {url: string}) {
      return <chrome.webRequest.BlockingResponse> {
        redirectUrl: urls[(details.url.match(goLinkRegex) || [])[1]],
      };
    },
    {
      urls: [`*://go/*`],
      types: [`main_frame`]
    },
    [`blocking`],
  );

  // display list of matching urls under omnibox as you type
  chrome.omnibox.onInputChanged.addListener(
    function(text: string, suggest: Function) {
      chrome.omnibox.setDefaultSuggestion({
        description: `Select a matching url:`,
      });
      suggest(Object.entries(urls)
        .filter(([urlKey, url]) => urlKey.includes(text) || url.includes(text))
        .map(([urlKey, url]) => ({
          content: urlKey,
          description: `${urlKey} -> ${encodeURIComponent(url)}`,
        }))
      );
    },
  );

  // handle omnibox submission and redirect user to chosen go link
  chrome.omnibox.onInputEntered.addListener(
    function(text: string) {
      chrome.tabs.update({url: `https://go/${text}`});
    },
  );
})();
