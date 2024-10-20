chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchWordList") {
        fetch('http://localhost:8000/word_list')
            .then(response => response.json())
            .then(data => {
                console.log('Received word list from server:', data);
                const wordList = data.word_list;
                console.log('Parsed word list:', wordList);
                chrome.storage.local.set({wordList: wordList});
                sendResponse({wordList: wordList});
            })
            .catch(error => {
                console.error('Error fetchiparng word list:', error);
                sendResponse({error: 'Failed to fetch word list'});
            });
        return true; // Indicates that the response is sent asynchronously
    } else if (request.action === "injectContentScript") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (chrome.runtime.lastError) {
                console.error('Error querying tabs:', chrome.runtime.lastError);
                sendResponse({error: 'Failed to query tabs'});
                return;
            }
            if (tabs.length === 0) {
                console.error('No active tab found');
                sendResponse({error: 'No active tab found'});
                return;
            }
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                files: ['content.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error injecting content script:', chrome.runtime.lastError);
                    sendResponse({error: 'Failed to inject content script'});
                } else {
                    sendResponse({success: true});
                }
            });
        });
        return true; // Indicates that the response is sent asynchronously
    } else {
        sendResponse({error: 'Unknown action'});
    }
});