import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

interface VapiWebhookEvent {
  type: string;
  call?: {
    id: string;
    duration?: number;
    recordingUrl?: string;
  };
  transcript?: {
    text: string;
  };
}

interface ConvexActionContext {
  runMutation: (mutation: unknown, args: Record<string, unknown>) => Promise<unknown>;
}

export const webhook = httpAction(async (ctx, request) => {
  // Verify webhook signature (if Vapi provides it)
  // const signature = request.headers.get('x-vapi-signature');
  const body = await request.text();
  
  // TODO: Verify signature with webhook secret
  // const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  
  let event: VapiWebhookEvent;
  try {
    event = JSON.parse(body) as VapiWebhookEvent;
  } catch (error) {
    console.error('Invalid JSON in webhook:', error);
    return new Response('Invalid JSON', { status: 400 });
  }
  
  console.log('Vapi webhook event:', event.type, event);
  
  try {
    switch (event.type) {
      case 'call.started':
        await handleCallStarted(ctx, event);
        break;
        
      case 'transcript.updated':
      case 'transcript.partial':
        await handleTranscriptUpdate(ctx, event);
        break;
        
      case 'transcript.completed':
        await handleTranscriptCompleted(ctx, event);
        break;
        
      case 'call.ended':
        await handleCallEnded(ctx, event);
        break;
        
      case 'call.failed':
        await handleCallFailed(ctx, event);
        break;
        
      default:
        console.log('Unhandled webhook event type:', event.type);
    }
    
    return new Response('OK', { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

async function handleCallStarted(ctx: ConvexActionContext, event: VapiWebhookEvent) {
  const callId = event.call?.id;
  if (!callId) return;
  
  await ctx.runMutation(internal.mutations.calls.updateByVapiId, {
    vapiCallId: callId,
    status: 'in_progress',
    startedAt: Date.now()
  });
}

async function handleTranscriptUpdate(ctx: ConvexActionContext, event: VapiWebhookEvent) {
  // For partial transcripts, we might just log or store incrementally
  // This is useful for real-time transcript display
  console.log('Transcript update for call:', event.call?.id, event.transcript?.text);
}

async function handleTranscriptCompleted(ctx: ConvexActionContext, event: VapiWebhookEvent) {
  const callId = event.call?.id;
  const transcript = event.transcript?.text;
  
  if (!callId || !transcript) return;
  
  try {
    // Use OpenAI to summarize the call and determine outcome
    const summary = await summarizeCallTranscript(transcript);
    
    await ctx.runMutation(internal.mutations.calls.addTranscript, {
      vapiCallId: callId,
      transcript: transcript,
      summary: summary.summary,
      outcome: summary.outcome
    });
    
  } catch (error) {
    console.error('Error processing transcript:', error);
    // Still save the raw transcript
    await ctx.runMutation(internal.mutations.calls.addTranscript, {
      vapiCallId: callId,
      transcript: transcript
    });
  }
}

async function handleCallEnded(ctx: ConvexActionContext, event: VapiWebhookEvent) {
  const callId = event.call?.id;
  if (!callId) return;
  
  const endedAt = Date.now();
  let costUsd = 0;
  
  // Calculate cost based on duration if available
  if (event.call?.duration) {
    // Rough estimate: $0.05 per minute
    const durationMinutes = event.call.duration / 60;
    costUsd = Math.round(durationMinutes * 0.05 * 100) / 100;
  }
  
  await ctx.runMutation(internal.mutations.calls.updateByVapiId, {
    vapiCallId: callId,
    status: 'ended',
    endedAt: endedAt,
    recordingUrl: event.call?.recordingUrl,
    costUsd: costUsd
  });
}

async function handleCallFailed(ctx: ConvexActionContext, event: VapiWebhookEvent) {
  const callId = event.call?.id;
  if (!callId) return;
  
  await ctx.runMutation(internal.mutations.calls.updateByVapiId, {
    vapiCallId: callId,
    status: 'failed',
    endedAt: Date.now()
  });
}

async function summarizeCallTranscript(transcript: string): Promise<{
  summary: string;
  outcome: 'interested' | 'callback' | 'not_interested' | 'vm_left' | 'no_answer';
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
            content: `Analyze this cold call transcript and provide:
1. A brief summary (2-3 sentences)
2. Call outcome classification: interested|callback|not_interested|vm_left|no_answer

Return JSON: {"summary": "...", "outcome": "..."}

Guidelines:
- interested: Prospect showed genuine interest, wants to learn more
- callback: Prospect wants to be called back later or set up a meeting
- not_interested: Clear rejection, asked to be removed from lists
- vm_left: Reached voicemail and left a message
- no_answer: No one answered or call didn't connect properly`
          },
          {
            role: 'user',
            content: transcript
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
      outcome: result.outcome || 'no_answer'
    };
    
  } catch (error) {
    console.error('Error summarizing transcript:', error);
    
    // Fallback analysis
    const lowerTranscript = transcript.toLowerCase();
    let outcome: 'interested' | 'callback' | 'not_interested' | 'vm_left' | 'no_answer' = 'no_answer';
    
    if (lowerTranscript.includes('interested') || lowerTranscript.includes('tell me more')) {
      outcome = 'interested';
    } else if (lowerTranscript.includes('call back') || lowerTranscript.includes('meeting')) {
      outcome = 'callback';
    } else if (lowerTranscript.includes('not interested') || lowerTranscript.includes('remove')) {
      outcome = 'not_interested';
    } else if (lowerTranscript.includes('voicemail') || lowerTranscript.includes('message')) {
      outcome = 'vm_left';
    }
    
    return {
      summary: `Call completed. Duration: ${transcript.length} characters.`,
      outcome
    };
  }
}