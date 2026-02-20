/**
 * Conversation Recorder - Records audio for later analysis
 * Migrated from: backend/src/voice_proxy_handler.py (ConversationRecorder class)
 *
 * Records user and AI audio as a stereo WAV file
 * (user on left channel, AI on right channel)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'

// ============================================================================
// Types
// ============================================================================

interface ConversationEvent {
  timestamp: string
  type: string
  data?: unknown
}

// ============================================================================
// ConversationRecorder
// ============================================================================

export class ConversationRecorder {
  private sessionId: string
  private userName: string
  private recordingsDir: string
  private userAudioChunks: Buffer[] = []
  private aiAudioChunks: Buffer[] = []
  private startTime: Date
  private events: ConversationEvent[] = []

  constructor(sessionId: string, userName: string, recordingsDir = 'recordings') {
    this.sessionId = sessionId
    this.userName = userName
    this.recordingsDir = recordingsDir
    this.startTime = new Date()

    // Ensure recordings directory exists
    if (!existsSync(this.recordingsDir)) {
      mkdirSync(this.recordingsDir, { recursive: true })
    }

    console.log(`📹 Recording enabled for session ${sessionId}`)
  }

  /** Add user audio chunk (raw PCM16 bytes). */
  addUserAudio(audioData: Buffer): void {
    this.userAudioChunks.push(audioData)
  }

  /** Add AI audio chunk (raw PCM16 bytes). */
  addAiAudio(audioData: Buffer): void {
    this.aiAudioChunks.push(audioData)
  }

  /** Log conversation event with timestamp. */
  addEvent(eventType: string, data?: unknown): void {
    this.events.push({
      timestamp: new Date().toISOString(),
      type: eventType,
      data,
    })
  }

  /**
   * Save conversation as stereo WAV file.
   * @returns Path to saved file or null if no audio
   */
  saveRecording(): string | null {
    console.log(
      `Attempting to save recording (user_chunks=${this.userAudioChunks.length}, ai_chunks=${this.aiAudioChunks.length})`,
    )

    if (!this.userAudioChunks.length && !this.aiAudioChunks.length) {
      console.warn(`No audio to save for session ${this.sessionId}`)
      return null
    }

    try {
      // Generate filename
      const timestamp = this.formatTimestamp(this.startTime)
      const safeName = this.userName.replace(/[^a-zA-Z0-9 \-_]/g, '').trim()
      const filename = `${timestamp}_${safeName}_${this.sessionId.slice(0, 8)}.wav`
      const filepath = path.join(this.recordingsDir, filename)

      // Merge audio to stereo WAV
      this.saveStereoWav(filepath)

      // Save metadata
      this.saveMetadata(filepath.replace('.wav', '.json'))

      console.log(`💾 Recording saved: ${filepath}`)
      return filepath
    } catch (e) {
      console.error(`Failed to save recording: ${e}`)
      return null
    }
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private saveStereoWav(filepath: string): void {
    const userAudio = Buffer.concat(this.userAudioChunks)
    const aiAudio = Buffer.concat(this.aiAudioChunks)

    const userSamples = Math.floor(userAudio.length / 2) // 16-bit = 2 bytes/sample
    const aiSamples = Math.floor(aiAudio.length / 2)
    const maxSamples = Math.max(userSamples, aiSamples)

    // Pad shorter channel with silence
    const userPadded =
      userSamples < maxSamples
        ? Buffer.concat([userAudio, Buffer.alloc((maxSamples - userSamples) * 2)])
        : userAudio

    const aiPadded =
      aiSamples < maxSamples
        ? Buffer.concat([aiAudio, Buffer.alloc((maxSamples - aiSamples) * 2)])
        : aiAudio

    // Interleave stereo channels (L=User, R=AI)
    const stereoData = Buffer.alloc(maxSamples * 4) // 2 channels * 2 bytes/sample
    for (let i = 0; i < maxSamples; i++) {
      // Left channel (User)
      stereoData[i * 4] = userPadded[i * 2]
      stereoData[i * 4 + 1] = userPadded[i * 2 + 1]
      // Right channel (AI)
      stereoData[i * 4 + 2] = aiPadded[i * 2]
      stereoData[i * 4 + 3] = aiPadded[i * 2 + 1]
    }

    // Build WAV header
    const sampleRate = 24000
    const numChannels = 2
    const bitsPerSample = 16
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
    const blockAlign = numChannels * (bitsPerSample / 8)
    const dataSize = stereoData.length
    const fileSize = 36 + dataSize

    const header = Buffer.alloc(44)
    header.write('RIFF', 0) // ChunkID
    header.writeUInt32LE(fileSize, 4) // ChunkSize
    header.write('WAVE', 8) // Format
    header.write('fmt ', 12) // Subchunk1ID
    header.writeUInt32LE(16, 16) // Subchunk1Size (PCM)
    header.writeUInt16LE(1, 20) // AudioFormat (PCM)
    header.writeUInt16LE(numChannels, 22) // NumChannels
    header.writeUInt32LE(sampleRate, 24) // SampleRate
    header.writeUInt32LE(byteRate, 28) // ByteRate
    header.writeUInt16LE(blockAlign, 32) // BlockAlign
    header.writeUInt16LE(bitsPerSample, 34) // BitsPerSample
    header.write('data', 36) // Subchunk2ID
    header.writeUInt32LE(dataSize, 40) // Subchunk2Size

    const wavFile = Buffer.concat([header, stereoData])
    writeFileSync(filepath, wavFile)
  }

  private saveMetadata(filepath: string): void {
    const metadata = {
      session_id: this.sessionId,
      user_name: this.userName,
      start_time: this.startTime.toISOString(),
      end_time: new Date().toISOString(),
      duration_seconds: (Date.now() - this.startTime.getTime()) / 1000,
      user_audio_chunks: this.userAudioChunks.length,
      ai_audio_chunks: this.aiAudioChunks.length,
      events: this.events,
    }

    writeFileSync(filepath, JSON.stringify(metadata, null, 2), 'utf-8')
  }

  private formatTimestamp(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${y}${m}${d}_${h}${min}${s}`
  }
}
