export interface BusinessClassification {
  name: string;
  category: string;
  serviceArea: string[];
  icp: string;
  usp: string;
}

export async function classifyBusiness(sourceUrl: string): Promise<BusinessClassification> {
  try {
    // Fetch the webpage content
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Extract text content from HTML (simple approach)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // Limit content for API

    // Call OpenAI API for classification
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are given a local business homepage content and URL.
            Return JSON with these fields: {name, category, serviceArea, icp, usp}
            
            - name: Business name
            - category: Business category (e.g., "HVAC contractor", "dental practice", "law firm")  
            - serviceArea: Array of cities/regions served (e.g., ["San Jose, CA", "Santa Clara County"])
            - icp: Ideal customer profile (e.g., "Residential HVAC, 1-20 employees")
            - usp: Unique selling proposition (brief, 1-2 sentences)
            
            If information is unclear, make reasonable inferences based on context.`
          },
          {
            role: 'user',
            content: `URL: ${sourceUrl}\n\nWebpage content:\n${textContent}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const data = await openaiResponse.json();
    const classification = JSON.parse(data.choices[0].message.content);

    return {
      name: classification.name || 'Unknown Business',
      category: classification.category || 'General Business',
      serviceArea: Array.isArray(classification.serviceArea) ? classification.serviceArea : [classification.serviceArea || 'Unknown Area'],
      icp: classification.icp || 'General customers',
      usp: classification.usp || 'Quality service provider'
    };

  } catch (error) {
    console.error('Error classifying business:', error);
    
    // Fallback classification based on URL
    const domain = new URL(sourceUrl).hostname;
    return {
      name: domain.replace(/^www\./, '').split('.')[0],
      category: 'General Business',
      serviceArea: ['Unknown Area'],
      icp: 'General customers',
      usp: 'Professional service provider'
    };
  }
}