// Bringing the function to the home window.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const startButton = document.getElementById('startRecording');
const stopButton = document.getElementById('stopRecording');
const teluguText = document.getElementById('teluguText');
const englishText = document.getElementById('englishText');
const status = document.getElementById('status');

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'te-IN'; // Telugu language

    // Event listener function to start and stop recording the audio from the user 
    startButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);

    // Start recording
    function startRecording() {
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

    // Stop recording
    function stopRecording() {
        recognition.stop();
        startButton.classList.remove('hidden');
        stopButton.classList.add('hidden');
        status.textContent = 'Processing...';
        status.classList.remove('recording');
    }

    // Handle speech recognition results
    recognition.onresult = async (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

        teluguText.textContent = transcript;
        
        try {
            // Api is good only for laptops please check if using it in mobile.
            const translation = await translateText(transcript);
            englishText.textContent = translation;
        } catch (error) {
            console.error('Translation error:', error);
            status.textContent = 'Error translating text. Please try again.';
        }
    };

    // Handle errors
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        status.textContent = `Error: ${event.error}`;
        startButton.classList.remove('hidden');
        stopButton.classList.add('hidden');
        status.classList.remove('recording');
    };
    
    // Handle when recognition ends
    recognition.onend = () => {
        startButton.classList.remove('hidden');
        stopButton.classList.add('hidden');
        status.textContent = 'Ready to record';
        status.classList.remove('recording');
    }; 
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
        const data = await response.json();
        return data.responseData.translatedText || "[Translation failed]";
    } catch (e) {
        return "[Translation failed]";
    }
}
