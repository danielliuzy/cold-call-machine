export interface CallScript {
  opener: string;
  valueProps: string[];
  objections: { objection: string; reply: string }[];
  cta: string;
  closing: string;
}

export interface ScriptGenerationParams {
  businessName: string;
  businessCategory: string;
  businessUSP: string;
  leadCategory: string;
  leadCity: string;
  leadName?: string;
  tone: 'professional' | 'friendly' | 'casual';
}

export async function generateCallScript(params: ScriptGenerationParams): Promise<CallScript> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    const prompt = `Generate a concise cold-call script for a ${params.businessCategory} business pitching to ${params.leadCategory} prospects in ${params.leadCity}.

Business Details:
- Name: ${params.businessName}
- USP: ${params.businessUSP}
- Category: ${params.businessCategory}

Target Prospect:
- Category: ${params.leadCategory}
- Location: ${params.leadCity}
${params.leadName ? `- Name: ${params.leadName}` : ''}

Requirements:
- Opener: ≤15 seconds, include compliance disclaimer
- 2 compelling value propositions specific to ${params.leadCategory}
- 2 common objections with professional rebuttals
- 1 clear call-to-action
- Professional closing
- Tone: ${params.tone}

Return JSON with fields: opener, valueProps, objections:[{objection, reply}], cta, closing`;

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
            content: 'You are an expert sales script writer specializing in B2B cold calls. Create compliant, effective scripts that respect TCPA requirements and focus on value delivery.'
          },
          {
            role: 'user',
            content: prompt
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
    const script = JSON.parse(data.choices[0].message.content);

    // Validate and provide fallbacks
    return {
      opener: script.opener || `Hi ${params.leadName ? params.leadName : 'there'}, this is a virtual assistant calling on behalf of ${params.businessName}. This call may be recorded. Is now a bad time?`,
      valueProps: Array.isArray(script.valueProps) ? script.valueProps : [
        `We help ${params.leadCategory} businesses improve their operations`,
        'Our proven approach saves time and reduces costs'
      ],
      objections: Array.isArray(script.objections) ? script.objections : [
        {
          objection: "We're not interested right now",
          reply: "I understand timing is important. Would it be helpful if I sent you some information to review when you have a moment?"
        },
        {
          objection: "We already have a solution",
          reply: "That's great to hear you're being proactive. Many of our best clients had existing solutions before discovering the additional benefits we could provide. Would you be open to a brief conversation about what's working well for you?"
        }
      ],
      cta: script.cta || 'Would you be available for a brief 15-minute conversation next week to discuss how this might benefit your business?',
      closing: script.closing || 'Thank you for your time today. Have a great day!'
    };

  } catch (error) {
    console.error('Error generating script:', error);
    
    // Fallback script template
    return {
      opener: `Hi ${params.leadName ? params.leadName : 'there'}, this is a virtual assistant calling on behalf of ${params.businessName}, a ${params.businessCategory} in your area. This call may be recorded. Is now a bad time?`,
      valueProps: [
        `We specialize in helping ${params.leadCategory} businesses improve their operations`,
        'Our clients typically see measurable improvements in efficiency and cost savings'
      ],
      objections: [
        {
          objection: "We're not interested",
          reply: "I completely understand. Would it be helpful if I sent you some information to review at your convenience?"
        },
        {
          objection: "We're too busy right now",
          reply: "I appreciate that you're busy - that's exactly why our solution might be valuable. It's designed to save time for businesses like yours."
        }
      ],
      cta: 'Would you be open to a brief 10-minute conversation to see if this might be a fit for your business?',
      closing: 'Thank you for your time. Have a wonderful day!'
    };
  }
}

export async function scoreLead(leadData: {
  rating?: number;
  reviewCount?: number;
  hasPhone: boolean;
  hasWebsite: boolean;
  cityMatch: boolean;
}): Promise<{ score: number; reason: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  try {
    if (apiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Score business leads from 0-100 and provide brief reasoning.'
            },
            {
              role: 'user',
              content: `Score this lead: rating=${leadData.rating}, reviews=${leadData.reviewCount}, hasPhone=${leadData.hasPhone}, hasWebsite=${leadData.hasWebsite}, cityMatch=${leadData.cityMatch}. Return JSON: {score, reason}`
            }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        return {
          score: Math.max(0, Math.min(100, result.score || 0)),
          reason: result.reason || 'AI generated score'
        };
      }
    }
  } catch (error) {
    console.error('Error with AI scoring:', error);
  }
  
  // Fallback heuristic scoring
  let score = 0;
  const reasons: string[] = [];
  
  if (leadData.rating) {
    const ratingScore = (leadData.rating - 1) * 15; // 1-5 star rating -> 0-60 points
    score += ratingScore;
    reasons.push(`${leadData.rating} star rating (+${ratingScore})`);
  }
  
  if (leadData.reviewCount) {
    const reviewScore = Math.min(20, Math.log10(leadData.reviewCount) * 8); // More reviews = higher score, capped at 20
    score += reviewScore;
    reasons.push(`${leadData.reviewCount} reviews (+${Math.round(reviewScore)})`);
  }
  
  if (leadData.hasPhone) {
    score += 15;
    reasons.push('Has phone (+15)');
  }
  
  if (leadData.hasWebsite) {
    score += 5;
    reasons.push('Has website (+5)');
  }
  
  if (leadData.cityMatch) {
    score += 10;
    reasons.push('Location match (+10)');
  }
  
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    reason: reasons.join(', ') || 'No scoring factors available'
  };
}