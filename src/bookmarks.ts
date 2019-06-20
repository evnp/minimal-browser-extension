export async function loadBookmarks() {
  const urls = [];

  let nodes = <chrome.bookmarks.BookmarkTreeNode[]> await new Promise(resolve =>
    chrome.bookmarks.getTree(
      bookmarkTreeNodes => resolve(bookmarkTreeNodes),
    ),
  );

  while (nodes.length) {
    let node = nodes.shift();
    if (node && node.children && node.children.length) {
      nodes = nodes.concat(node.children);
    }
    if (node && node.url) {
      urls.push(node.url);
    }
  }

  return urls;
}
