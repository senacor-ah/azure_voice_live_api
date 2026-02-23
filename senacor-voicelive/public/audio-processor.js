/**
 * Audio Worklet Processor for capturing microphone audio
 * Converts Float32 audio samples to PCM16 format for streaming
 */
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // Collect samples before sending
    this.buffer = new Int16Array(this.bufferSize);
    this.bufferIndex = 0;
    // Gate: only forward audio while PTT is pressed (START_RECORDING / STOP_RECORDING)
    this.isRecording = false;

    this.port.onmessage = (e) => {
      if (e.data && e.data.command === 'START_RECORDING') {
        this.isRecording = true;
        this.bufferIndex = 0; // discard any stale samples
      } else if (e.data && e.data.command === 'STOP_RECORDING') {
        // Flush remaining buffered samples before closing the gate
        if (this.bufferIndex > 0) {
          const audioData = this.buffer.slice(0, this.bufferIndex);
          this.port.postMessage(audioData.buffer);
          this.bufferIndex = 0;
        }
        this.isRecording = false;
      }
    };
  }

  /**
   * Convert Float32 sample to Int16 (PCM16)
   */
  floatTo16BitPCM(float32) {
    // Clamp and convert
    const s = Math.max(-1, Math.min(1, float32));
    return s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  /**
   * Process audio input
   * @param {Float32Array[][]} inputs - Input audio data
   * @param {Float32Array[][]} outputs - Output audio data (not used)
   * @param {Object} parameters - Audio parameters
   * @returns {boolean} - Return true to keep processor alive
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    // Check if we have audio input
    if (!input || !input[0]) {
      return true;
    }

    // Only process while PTT is active
    if (!this.isRecording) {
      return true;
    }

    const samples = input[0]; // Mono channel

    // Convert and buffer samples
    for (let i = 0; i < samples.length; i++) {
      this.buffer[this.bufferIndex++] = this.floatTo16BitPCM(samples[i]);

      // When buffer is full, send to main thread
      if (this.bufferIndex >= this.bufferSize) {
        // Create a copy of the buffer to send
        const audioData = this.buffer.slice(0, this.bufferIndex);
        this.port.postMessage(audioData.buffer);
        this.bufferIndex = 0;
      }
    }

    return true; // Keep processor running
  }
}

// Register the processor
registerProcessor('audio-processor', AudioProcessor);
