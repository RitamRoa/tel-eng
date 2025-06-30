// Bringing the function to the home window.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const startButton = document.getElementById('startRecording');
const stopButton = document.getElementById('stopRecording');
const teluguText = document.getElementById('teluguText');
const englishText = document.getElementById('englishText');
const status = document.getElementById('status');

let recognition;
let final_transcript = '';
let isStopping = false;

if (SpeechRecognition) {
    startButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    stopButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        stopRecording();
    });

    function startRecording() {
        console.log("startRecording called");
        isStopping = false;
        teluguText.textContent = '';
        englishText.textContent = '';
        
        recognition = new SpeechRecognition();
        recognition.continuous = false; // More reliable on mobile
        recognition.interimResults = false; // Only get final results
        recognition.lang = 'te-IN';

        recognition.onstart = () => {
            console.log("Speech recognition started.");
            status.textContent = 'Listening...';
        };

        recognition.onresult = (event) => {
            console.log("onresult event fired.");
            const transcript = event.results[0][0].transcript;
            teluguText.textContent = transcript;
        };

        recognition.onspeechend = () => {
            console.log("Speech has stopped being detected, stopping recognition.");
            // The browser will automatically stop, but we can be explicit
            stopRecording(); 
        };

        recognition.onend = async () => {
            console.log("Speech recognition service has disconnected.");
            if (!isStopping) return; // Prevent running on auto-stops before user action
            
            isStopping = false;
            startButton.classList.remove('hidden');
            stopButton.classList.add('hidden');
            status.textContent = 'Processing translation...';
            status.classList.remove('recording');

            const transcriptToTranslate = teluguText.textContent;
            if (transcriptToTranslate) {
                try {
                    const translation = await translateText(transcriptToTranslate);
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
            console.error('Speech recognition error:', event.error);
            isStopping = false;
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
        console.log("stopRecording called");
        if (isStopping) {
            console.log("Already stopping, returning.");
            return;
        }
        if (recognition) {
            console.log("Calling recognition.stop()");
            isStopping = true;
            recognition.stop();
        } else {
            console.log("No recognition instance to stop.");
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
