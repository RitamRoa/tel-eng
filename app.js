// Bringing the function to the home window.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const startButton = document.getElementById('startRecording');
const stopButton = document.getElementById('stopRecording');
const teluguText = document.getElementById('teluguText');
const englishText = document.getElementById('englishText');
const status = document.getElementById('status');

let recognition;
let final_transcript = '';
let isStopping = false; // Add a flag to prevent multiple stop calls

if (SpeechRecognition) {
    startButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    // Add touchstart event for better mobile support
    stopButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevents firing a click event as well
        stopRecording();
    });

    function startRecording() {
        isStopping = false; // Reset the flag when starting a new recording
        final_transcript = ''; // Clear previous transcript
        teluguText.textContent = '';
        englishText.textContent = '';
        
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'te-IN';

        recognition.onresult = (event) => {
            let interim_transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            teluguText.textContent = final_transcript + interim_transcript;
        };

        recognition.onend = async () => {
            isStopping = false; // Allow stopping again once finished
            startButton.classList.remove('hidden');
            stopButton.classList.add('hidden');
            status.textContent = 'Processing translation...';
            status.classList.remove('recording');

            if (final_transcript) {
                try {
                    const translation = await translateText(final_transcript);
                    englishText.textContent = translation;
                    status.textContent = 'Ready to record';
                } catch (error) {
                    console.error('Translation error:', error);
                    englishText.textContent = "[Translation failed]";
                    status.textContent = 'Error translating text. Please try again.';
                }
            } else {
                status.textContent = 'Ready to record. No speech was detected.';
            }
        };

        recognition.onerror = (event) => {
            isStopping = false; // Reset on error as well
            console.error('Speech recognition error:', event.error);
            status.textContent = `Error: ${event.error}`;
            startButton.classList.remove('hidden');
            stopButton.classList.add('hidden');
            status.classList.remove('recording');
        };

        try {
            recognition.start();
            startButton.classList.add('hidden');
            stopButton.classList.remove('hidden');
            status.textContent = 'Recording...';
            status.classList.add('recording');
        } catch (error) {
            console.error('Error starting recording:', error);
            status.textContent = 'Error starting recording. Please try again.';
        }
    }

    function stopRecording() {
        if (isStopping) return; // Prevent multiple calls while stopping

        if (recognition) {
            isStopping = true;
            recognition.stop();
        }
    }
} else {
    status.textContent = "Sorry, your browser doesn't support Speech Recognition. Try Chrome on desktop or Android.";
    startButton.classList.add('hidden');
    stopButton.classList.add('hidden');
}

//This is the function for translation through api. Right now we are using My memory and please try using libreTranslation
async function translateText(text) {
    if (!text.trim()) return "";
    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=te|en`
        );
        if (!response.ok) {
            return "[Translation service returned an error]";
        }
        const data = await response.json();
        if (data.responseStatus !== 200) {
            console.error("MyMemory API error:", data.responseDetails);
            return `[Translation failed: ${data.responseDetails}]`;
        }
        return data.responseData.translatedText || "[Translation failed]";
    } catch (e) {
        console.error("Fetch error for translation:", e);
        return "[Translation request failed. Check network.]";
    }
}
