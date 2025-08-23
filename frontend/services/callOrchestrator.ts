import { CallScript } from './generateScript';

export interface VapiCallRequest {
  phoneNumber: string;
  assistantId: string;
  variables: Record<string, string | number>;
}

export interface VapiCallResponse {
  id: string;
  status: string;
  createdAt: string;
}

export interface CallOrchestratorParams {
  businessId: string;
  leads: Array<{
    _id: string;
    name: string;
    phone: string;
    city: string;
  }>;
  script: CallScript;
  businessName: string;
  businessUSP: string;
}

export class VapiService {
  private apiKey: string;
  private baseUrl = 'https://api.vapi.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createAssistant(config: {
    name: string;
    model: string;
    voice: string;
    systemMessage: string;
    functions?: unknown[];
  }): Promise<{ id: string }> {
    const response = await fetch(`${this.baseUrl}/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        name: config.name,
        model: {
          provider: 'openai',
          model: config.model || 'gpt-4',
          temperature: 0.1,
        },
        voice: {
          provider: 'elevenlabs',
          voiceId: config.voice || '21m00Tcm4TlvDq8ikWAM', // Default professional voice
        },
        firstMessage: "Hello! I'm calling on behalf of a local business. Is now a good time to talk?",
        systemMessage: config.systemMessage,
        functions: config.functions || [],
        recordingEnabled: true,
        endCallFunctionEnabled: true,
        interruptSensitivity: 0.5,
        responseDelaySeconds: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create assistant: ${response.statusText}`);
    }

    const data = await response.json();
    return { id: data.id };
  }

  async createCall(request: VapiCallRequest): Promise<VapiCallResponse> {
    const response = await fetch(`${this.baseUrl}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        phoneNumber: request.phoneNumber,
        assistantId: request.assistantId,
        metadata: request.variables,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create call: ${response.statusText} - ${error}`);
    }

    return await response.json();
  }

  async getCall(callId: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/call/${callId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get call: ${response.statusText}`);
    }

    return await response.json();
  }

  async endCall(callId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/call/${callId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        status: 'ended',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to end call: ${response.statusText}`);
    }
  }
}

export async function createOrUpdateAssistant(
  businessName: string,
  script: CallScript
): Promise<string> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error('Vapi API key not configured');
  }

  const vapi = new VapiService(apiKey);
  
  const systemMessage = `You are a virtual sales assistant calling on behalf of ${businessName}.

COMPLIANCE FIRST:
- Always start with: "${script.opener}"
- If asked to be removed from lists, immediately comply and end the call
- Respect "not interested" responses
- Keep calls under 3 minutes unless prospect is actively engaged

SCRIPT GUIDANCE:
Opener: ${script.opener}

Value Propositions (use when appropriate):
${script.valueProps.map((prop, i) => `${i + 1}. ${prop}`).join('\n')}

Common Objections and Responses:
${script.objections.map((obj, i) => `${i + 1}. Objection: "${obj.objection}"\n   Response: "${obj.reply}"`).join('\n')}

Call-to-Action: ${script.cta}

Closing: ${script.closing}

INSTRUCTIONS:
- Be conversational and natural, don't read the script word-for-word
- Listen actively and respond to what the prospect actually says
- If they seem interested, focus on scheduling a follow-up
- If they're not interested, politely end the call
- Always be respectful and professional
- End calls that become confrontational
- Take detailed notes on the prospect's responses`;

  try {
    const assistant = await vapi.createAssistant({
      name: `${businessName} Cold Call Assistant`,
      model: 'gpt-4',
      voice: '21m00Tcm4TlvDq8ikWAM', // Professional male voice
      systemMessage,
      functions: [
        {
          name: 'end_call',
          description: 'End the current call',
          parameters: {
            type: 'object',
            properties: {
              reason: {
                type: 'string',
                description: 'Reason for ending the call'
              }
            }
          }
        }
      ]
    });

    return assistant.id;
  } catch (error) {
    console.error('Error creating assistant:', error);
    throw error;
  }
}

export async function startCalls(params: CallOrchestratorParams): Promise<Array<{
  leadId: string;
  vapiCallId: string;
  status: string;
}>> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    throw new Error('Vapi API key not configured');
  }

  const vapi = new VapiService(apiKey);
  
  // Create or get assistant
  const assistantId = await createOrUpdateAssistant(params.businessName, params.script);
  
  const results: Array<{
    leadId: string;
    vapiCallId: string;
    status: string;
  }> = [];

  for (const lead of params.leads) {
    if (!lead.phone) {
      console.warn(`Skipping lead ${lead.name} - no phone number`);
      continue;
    }

    try {
      // Clean phone number (remove formatting)
      const cleanPhone = lead.phone.replace(/\D/g, '');
      
      // Add country code if missing
      const phoneNumber = cleanPhone.length === 10 ? `+1${cleanPhone}` : `+${cleanPhone}`;

      const callResponse = await vapi.createCall({
        phoneNumber: phoneNumber,
        assistantId: assistantId,
        variables: {
          leadId: lead._id,
          leadName: lead.name,
          leadCity: lead.city,
          businessName: params.businessName,
          businessUSP: params.businessUSP
        }
      });

      results.push({
        leadId: lead._id,
        vapiCallId: callResponse.id,
        status: 'initiated'
      });

      // Small delay between calls to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error creating call for lead ${lead.name}:`, error);
      results.push({
        leadId: lead._id,
        vapiCallId: '',
        status: 'failed'
      });
    }
  }

  return results;
}

export async function summarizeCall(transcript: string): Promise<{
  summary: string;
  outcome: 'interested' | 'callback' | 'not_interested' | 'vm_left' | 'no_answer';
  followups: Array<{ when: string; channel: string; notes: string }>;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Summarize the call transcript in ≤5 bullet points. Classify outcome: interested|callback|not_interested|vm_left|no_answer. Extract followups: when, channel, notes. Return JSON: {summary, outcome, followups}'
          },
          {
            role: 'user',
            content: `Call transcript:\n${transcript}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      summary: result.summary || 'Call completed',
      outcome: result.outcome || 'no_answer',
      followups: Array.isArray(result.followups) ? result.followups : []
    };

  } catch (error) {
    console.error('Error summarizing call:', error);
    
    // Fallback analysis
    const lowerTranscript = transcript.toLowerCase();
    let outcome: 'interested' | 'callback' | 'not_interested' | 'vm_left' | 'no_answer' = 'no_answer';
    
    if (lowerTranscript.includes('interested') || lowerTranscript.includes('yes') || lowerTranscript.includes('tell me more')) {
      outcome = 'interested';
    } else if (lowerTranscript.includes('call back') || lowerTranscript.includes('later') || lowerTranscript.includes('busy')) {
      outcome = 'callback';
    } else if (lowerTranscript.includes('not interested') || lowerTranscript.includes('no thank') || lowerTranscript.includes('remove')) {
      outcome = 'not_interested';
    } else if (lowerTranscript.includes('voicemail') || lowerTranscript.includes('leave a message')) {
      outcome = 'vm_left';
    }

    return {
      summary: `Call completed. Transcript length: ${transcript.length} characters.`,
      outcome,
      followups: []
    };
  }
}