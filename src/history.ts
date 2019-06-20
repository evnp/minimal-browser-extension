export async function loadHistory({maxResults}: {maxResults: number}) {
  const nodes = <chrome.history.HistoryItem[]> await new Promise(resolve =>
    chrome.history.search(
      {text: ``, maxResults},
      historyItems => resolve(historyItems),
    ),
  );
  return nodes.map(({url}) => url);
}
