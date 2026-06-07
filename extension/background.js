chrome.runtime.onInstalled.addListener((details) => {
  console.info('PRISM New Tab extension installed.', details.reason);
});
