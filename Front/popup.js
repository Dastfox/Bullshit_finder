document.addEventListener('DOMContentLoaded', function() {
    const analyzeButton = document.getElementById('analyzeButton');
    const resultsList = document.getElementById('resultsList');

    analyzeButton.addEventListener('click', function() {
        console.log('Analyze button clicked');
        resultsList.innerHTML = '<p>Analyzing...</p>';


        // First, inject the content script
        chrome.runtime.sendMessage({action: "injectContentScript"}, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Error injecting content script:', chrome.runtime.lastError);
                resultsList.innerHTML = `<p>Error: Failed to inject content script. Please try refreshing the page.</p>`;
                return;
            }

            if (!response) {
                console.error('No response received when injecting content script');
                resultsList.innerHTML = `<p>Error: No response received when injecting content script. Please try again.</p>`;
                return;
            }

            if (response.error) {
                resultsList.innerHTML = `<p>Error: ${response.error}</p>`;
                return;
            }

            // Then, fetch the word list
            chrome.runtime.sendMessage({action: "fetchWordList"}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('Error fetching word list:', chrome.runtime.lastError);
                    resultsList.innerHTML = `<p>Error: Failed to fetch word list. Please check your internet connection and try again.</p>`;
                    return;
                }

                if (!response) {
                    console.error('No response received when fetching word list');
                    resultsList.innerHTML = `<p>Error: No response received when fetching word list. Please try again.</p>`;
                    return;
                }

                console.log('Received response from background script:', response);
                if (response.error) {
                    resultsList.innerHTML = `<p>Error: ${response.error}</p>`;
                    return;
                }

                // Finally, analyze the current page
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "analyze", wordList: response.wordList}, function(response) {
                        if (chrome.runtime.lastError) {
                            console.error('Error analyzing page:', chrome.runtime.lastError);
                            resultsList.innerHTML = '<p>Error: Could not analyze this page. Please try refreshing the page.</p>';
                            return;
                        }

                        if (!response) {
                            console.error('No response received when analyzing page');
                            resultsList.innerHTML = '<p>Error: No response received when analyzing page. Please try again.</p>';
                            return;
                        }

                        console.log('Received response from content script:', response);
                        if (response.words) {
                            displayResults(response.words);
                        } else {
                            resultsList.innerHTML = '<p>No words found or error occurred.</p>';
                        }
                    });
                    displayFoundWords();
                });
            });
        });
    });

    function displayFoundWords() {
    chrome.storage.local.get(['found_words'], function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error retrieving found words:', chrome.runtime.lastError);
            return;
        }

        const foundWords = result.found_words || [];
        console.log('Retrieved found words:', foundWords);

        foundWords.forEach(word => {
        //     get the word from the server
        fetch(`http://localhost:8000/word/${word}`)
            .then(response => response.json())
            .then(data => {
                console.log('Received word info:', data);
                const li = document.createElement('li');
                const word_object = data.word;
                li.textContent = word;
                console.log(word_object.source.link);
                li.innerHTML = `
                    <p><strong>Description:</strong> ${word_object.description}</p>
                    <p><strong>Source:</strong> <a href="${word_object.source.link}"> ${word_object.source.name}</a></p>
                `;
                foundWordsList.appendChild(li);
            })
            .catch(error => {
                console.error('Error fetching word info:', error);
                const li = document.createElement('li');
                li.textContent = word;
                li.innerHTML = '<p>Error loading word information.</p>';
                foundWordsList.appendChild(li);
            });
        })

        const foundWordsList = document.getElementById('foundWordsList');
        if (foundWordsList) {
            foundWordsList.innerHTML = '';
            if (foundWords.length > 0) {
                foundWords.forEach(word => {
                    const li = document.createElement('li');
                    li.textContent = word;
                    foundWordsList.appendChild(li);
                });
            } else {
                foundWordsList.innerHTML = '<li>No words found</li>';
            }
        }
    });
}

    function displayResults(words) {
        console.log('Displaying results for words:', words);
        resultsList.innerHTML = '';
        if (words.length === 0) {
            resultsList.innerHTML = '<p>No matching words found on this page.</p>';
            return;
        }
        words.forEach(word => {
            const button = document.createElement('button');
            button.className = 'collapsible';
            button.textContent = word;
            resultsList.appendChild(button);

            const content = document.createElement('div');
            content.className = 'content';
            content.innerHTML = '<p>Loading...</p>';
            resultsList.appendChild(content);

            button.addEventListener('click', function () {
                this.classList.toggle('active');
                if (content.style.display === 'block') {
                    content.style.display = 'none';
                } else {
                    content.style.display = 'block';
                    if (content.innerHTML === '<p>Loading...</p>') {
                        fetchWordInfo(word, content);
                    }
                }
            });
        });
    }

    function fetchWordInfo(word, contentElement) {
        console.log('Fetching info for word:', word);
        fetch(`http://localhost:8000/word/${word}`)
            .then(response => response.json())
            .then(data => {
                console.log('Received word info:', data);
                contentElement.innerHTML = `
                    <p><strong>Description:</strong> ${data.description}</p>
                    <p><strong>Source:</strong> ${data.source}</p>
                `;
            })
            .catch(error => {
                console.error('Error fetching word info:', error);
                contentElement.innerHTML = '<p>Error loading word information.</p>';
            });
    }
});