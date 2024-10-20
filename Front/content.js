let wordList = [];

function highlightWords() {
    console.log('Highlighting words:', wordList);
    const textNodes = document.evaluate(
        "//div[@id='mw-content-text']//text()[not(ancestor::script) and not(ancestor::style)]",
        document,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
    );

    console.log('Number of text nodes found:', textNodes.snapshotLength);

    let foundWords = new Set(); // Use a Set to store unique words

    for (let i = 0; i < textNodes.snapshotLength; i++) {
        const node = textNodes.snapshotItem(i);
        const text = node.textContent;

        wordList.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(text)) {
                console.log('Found word in text node:', word);
                foundWords.add(word); // Add the word to the Set
                const span = document.createElement('span');
                span.innerHTML = text.replace(regex, match => `<mark class="highlighted-word">${match}</mark>`);
                span.className = 'word-highlight-wrapper';
                node.parentNode.replaceChild(span, node);
            }
        });
    }

    // Convert the Set to an array and store it in Chrome storage
    const uniqueFoundWords = Array.from(foundWords);
    chrome.storage.local.set({ found_words: uniqueFoundWords }, function() {
        if (chrome.runtime.lastError) {
            console.error('Error storing found words:', chrome.runtime.lastError);
        } else {
            console.log('Stored found words:', uniqueFoundWords);
        }
    });

    addEventListeners();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message in content script:', request);
    if (request.action === "analyze") {
        wordList = request.wordList;
        console.log('Updated word list:', wordList);

        // Use the main content div for Wikipedia
        const pageContent = document.getElementById('mw-content-text')?.innerText || document.body.innerText;
        console.log('Page content (truncated):', pageContent.substring(0, 200) + '...');

        const foundWords = wordList.filter(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const found = regex.test(pageContent);
            console.log(`Searching for word "${word}": ${found ? 'found' : 'not found'}`);
            return found;
        });
        console.log('Found words on page:', foundWords);
        highlightWords();
        sendResponse({words: foundWords});
    }
    return true; // Indicates that the response is sent asynchronously
});