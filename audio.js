function AudioDataDestination(sampleRate, readFn) {
    // Initialize the audio output.
    var audio = new Audio();
    audio.mozSetup(1, sampleRate);

    var currentWritePosition = 0;
    var prebufferSize = sampleRate / 2; // buffer 500ms
    var tail = null;

    // The function called with regular interval to populate 
    // the audio output buffer.
    setInterval(function() {
        var written;
        // Check if some data was not written in previous attempts.
        if(tail) {  
            written = audio.mozWriteAudio(tail);
            currentWritePosition += written;
            if(written < tail.length) {
                // Not all the data was written, saving the tail...
                tail = tail.slice(written);
                return; // ... and exit the function.
            }
            tail = null;
        }

        // Check if we need add some data to the audio output.
        var currentPosition = audio.mozCurrentSampleOffset();
        var available = currentPosition + prebufferSize - currentWritePosition;
        if(available > 0) {
            // Request some sound data from the callback function.
            var soundData = new Float32Array(available);
            readFn(soundData);

            // Writting the data.
            written = audio.mozWriteAudio(soundData);
            if(written < soundData.length) {
                // Not all the data was written, saving the tail.
                tail = soundData.slice(written);
            }
            currentWritePosition += written;
        }
    }, 100);
}

// Control and generate the sound.

var frequency = 0, currentSoundSample;
var sampleRate = 44100;

function requestSoundData(soundData) {
    if (!frequency) { 
        return; // no sound selected
    }

    square(soundData);
}

function sine(soundData) {
    var k = 2* Math.PI * frequency / sampleRate;

    for (var i=0, size=soundData.length; i<size; i++) {
        soundData[i] = volume *= Math.sin(k * currentSoundSample++);
    }        
}

function square(soundData) {
    var k = 2* Math.PI * frequency / sampleRate;

    var overtones = 20;
    for (var i=0, size=soundData.length; i<size; i++) {
        soundData[i] = 0;
        for(var j=0; j != overtones; j++) {
            var o = 2*j + 1;
            soundData[i] += 1/o * Math.sin(o * k * currentSoundSample);
        }
        soundData[i] *= volume;
        currentSoundSample++;
    }
}

var audioDestination = new AudioDataDestination(sampleRate, requestSoundData);
var volume = 1.0;
function setVolume() {
    volume = parseFloat(document.getElementById("vol").value);
}

function start() {
    currentSoundSample = 0;
    frequency = parseFloat(document.getElementById("freq").value);
}

function stop() {
    frequency = 0;
}
