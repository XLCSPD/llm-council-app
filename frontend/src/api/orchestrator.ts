import axios from 'axios';

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8002';

const orchestratorClient = axios.create({
  baseURL: ORCHESTRATOR_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PromptAttachmentRequest {
  id: string;
  type: 'image' | 'pdf' | 'text';
  filename: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  size_bytes: number;
  extracted_text?: string;
}

export interface RunCreateRequest {
  session_id: string;
  prompt: {
    content: string;
    objective?: string | null;
    constraints?: string[];
    audience?: string | null;
    context?: string | null;
    attachments?: PromptAttachmentRequest[];
  };
  council: {
    members: Array<{
      model_key: string;
      display_name: string;
      role: string;
      weight: number;
    }>;
    chairman_model_key?: string | null;
  };
}

export interface RunResponse {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  current_phase: number;
  message?: string;
}

export interface PromptEnhanceRequest {
  content: string;
  objective?: string | null;
  constraints?: string[];
  context?: string | null;
  audience?: string | null;
}

export interface PromptEnhanceResponse {
  original_content: string;
  enhanced_content: string;
  suggested_objective?: string | null;
  suggested_constraints: string[];
  suggested_context?: string | null;
  suggested_audience?: string | null;
  improvements: string[];
}

export interface TranscribeResponse {
  text: string;
}

export const orchestratorApi = {
  // Health check
  health: async () => {
    const response = await orchestratorClient.get('/health');
    return response.data;
  },

  // Create and start a run
  createRun: async (request: RunCreateRequest, userId: string): Promise<RunResponse> => {
    const response = await orchestratorClient.post<RunResponse>('/api/runs', request, {
      headers: {
        'X-User-ID': userId,
      },
    });
    return response.data;
  },

  // Get run status
  getRun: async (runId: string) => {
    const response = await orchestratorClient.get(`/api/runs/${runId}`);
    return response.data;
  },

  // Cancel a run
  cancelRun: async (runId: string): Promise<RunResponse> => {
    const response = await orchestratorClient.post<RunResponse>(`/api/runs/${runId}/cancel`);
    return response.data;
  },

  // Enhance a prompt with AI suggestions
  enhancePrompt: async (request: PromptEnhanceRequest): Promise<PromptEnhanceResponse> => {
    const response = await orchestratorClient.post<PromptEnhanceResponse>(
      '/api/prompts/enhance',
      request
    );
    return response.data;
  },

  // Transcribe audio to text using Whisper
  transcribe: async (audioBlob: Blob): Promise<TranscribeResponse> => {
    const formData = new FormData();
    // Determine filename based on blob type
    const extension = audioBlob.type.includes('webm') ? 'webm' :
                      audioBlob.type.includes('wav') ? 'wav' :
                      audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('audio', audioBlob, `recording.${extension}`);

    const response = await orchestratorClient.post<TranscribeResponse>(
      '/api/transcribe',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout for transcription
      }
    );
    return response.data;
  },
};
