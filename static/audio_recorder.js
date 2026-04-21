document.addEventListener("DOMContentLoaded", () => {
    const recordButton = document.getElementById("recordButton");
    const recordingStatus = document.getElementById("recordingStatus");
    const recordingHint = document.getElementById("recordingHint");
    
    const audioControls = document.getElementById("audioControls");
    const playButton = document.getElementById("playButton");
    const resetButton = document.getElementById("resetButton");
    
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let audioUrl = null;

    if (!recordButton) return;

    // --- 1. START/STOP RECORDING ---
    recordButton.addEventListener("click", async () => {
        if (!isRecording) {
            // START
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    // Create Blob
                    const blob = new Blob(audioChunks, { type: "audio/wav" });
                    window.audioBlob = blob;
                    audioUrl = URL.createObjectURL(blob);
                    
                    // UI TRANSITION: Hide Mic, Show Controls
                    console.log("🎙️ Audio Captured:", blob.size, "bytes");
                    recordButton.classList.add("hidden");
                    audioControls.classList.remove("hidden");
                    audioControls.classList.add("flex"); // Ensure flex layout
                    
                    recordingStatus.innerText = "Audio Note Attached";
                    recordingStatus.className = "text-sm text-green-400 font-bold";
                    recordingHint.innerText = "Ready to analyze.";
                };

                mediaRecorder.start();
                isRecording = true;
                
                // UI: Active Recording State
                recordButton.classList.remove("bg-slate-700", "hover:bg-red-500");
                recordButton.classList.add("bg-red-600", "animate-pulse", "border-red-400");
                
                recordingStatus.innerText = "Recording... (Tap to Stop)";
                recordingStatus.className = "text-sm text-red-400 font-bold animate-pulse";
                recordingHint.innerText = "Speak clearly...";

            } catch (err) {
                console.error("Mic Error:", err);
                alert("Microphone access is required for voice notes.");
            }
        } else {
            // STOP
            if(mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            isRecording = false;
            
            // UI Cleanup (will be overridden by onstop)
            recordButton.classList.remove("bg-red-600", "animate-pulse", "border-red-400");
            recordButton.classList.add("bg-slate-700");
        }
    });

    // --- 2. PLAY RECORDING ---
    playButton.addEventListener("click", () => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
        }
    });

    // --- 3. RESET (TRASH) RECORDING ---
    resetButton.addEventListener("click", () => {
        // Clear Data
        window.audioBlob = null;
        audioUrl = null;
        
        // UI TRANSITION: Hide Controls, Show Mic
        audioControls.classList.add("hidden");
        audioControls.classList.remove("flex");
        recordButton.classList.remove("hidden");
        
        // Reset Text
        recordingStatus.innerText = "Tap mic to speak...";
        recordingStatus.className = "text-sm text-slate-400 font-medium";
        recordingHint.innerText = 'e.g. "This is glass or yeh plastic hai"';
        
        // Reset Mic Button Style
        recordButton.className = "w-16 h-16 rounded-full bg-slate-700 hover:bg-red-500 flex items-center justify-center transition-all shadow-lg border border-slate-600 shrink-0";
    });
});