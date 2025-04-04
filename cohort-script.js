document.addEventListener('DOMContentLoaded', () => {
    console.log('Widget script loaded');
    
    const launcher = document.getElementById('cohort-launcher');
    const widget = document.getElementById('cohort-widget');
    const videoPlayer = document.getElementById('cohort-videoPlayer');
    const cameraPreview = document.getElementById('cohort-cameraPreview');
    const startVideoBtn = document.getElementById('cohort-startVideo');
    const recordAnswerBtn = document.getElementById('cohort-recordAnswer');
    const form = document.querySelector('.cohort-form-container');
    const recordingControls = document.querySelector('.cohort-recording-controls');
    const startRecordingBtn = document.getElementById('cohort-startRecording');
    const stopRecordingBtn = document.getElementById('cohort-stopRecording');
    
    console.log('Elements found:', {
        launcher,
        widget,
        videoPlayer,
        cameraPreview,
        startVideoBtn,
        recordAnswerBtn,
        form,
        recordingControls,
        startRecordingBtn,
        stopRecordingBtn
    });
    
    let mediaStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    
    launcher.addEventListener('click', () => {
        widget.classList.toggle('active');
    });

    startVideoBtn.addEventListener('click', () => {
        videoPlayer.play();
    });

    recordAnswerBtn.addEventListener('click', async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true,
                audio: true
            });
            cameraPreview.srcObject = mediaStream;
            videoPlayer.style.display = 'none';
            cameraPreview.style.display = 'block';
            recordingControls.style.display = 'flex';
            recordAnswerBtn.style.display = 'none';
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Error accessing camera. Please make sure you have granted camera permissions.');
        }
    });

    startRecordingBtn.addEventListener('click', () => {
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(mediaStream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            // Store the recorded video for later submission
            window.recordedVideo = blob;
            
            // Clean up
            mediaStream.getTracks().forEach(track => track.stop());
            cameraPreview.style.display = 'none';
            videoPlayer.style.display = 'block';
            recordingControls.style.display = 'none';
            recordAnswerBtn.style.display = 'block';
            startRecordingBtn.style.display = 'block';
            stopRecordingBtn.style.display = 'none';
        };

        mediaRecorder.start();
        startRecordingBtn.style.display = 'none';
        stopRecordingBtn.style.display = 'block';
        stopRecordingBtn.classList.add('recording');
    });

    stopRecordingBtn.addEventListener('click', () => {
        mediaRecorder.stop();
    });

    // Handle clicking outside the widget
    document.addEventListener('click', (e) => {
        const isClickInside = widget.contains(e.target) || launcher.contains(e.target);
        if (!isClickInside && widget.classList.contains('active')) {
            widget.classList.remove('active');
            // Stop camera when closing widget
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                cameraPreview.style.display = 'none';
                videoPlayer.style.display = 'block';
                recordingControls.style.display = 'none';
                recordAnswerBtn.style.display = 'block';
            }
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        const message = form.querySelector('textarea').value;
        
        try {
            // Create FormData object
            const formData = new FormData();
            formData.append('email', email);
            formData.append('message', message);
            
            // If there's a recorded video, append it
            if (window.recordedVideo) {
                formData.append('video', window.recordedVideo, 'recording.webm');
            }
            
            // Send data to Xano
            const response = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:9xcSnwaO/response', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Success:', result);
            
            // Clear the form and video
            form.reset();
            delete window.recordedVideo;
            
            // Show success message
            alert('Thank you for your submission!');
            
            // Close the widget
            widget.classList.remove('active');
            
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error submitting your response. Please try again.');
        }
    });
}); 