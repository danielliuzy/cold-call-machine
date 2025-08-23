export interface EnrichmentResult {
  phone?: string;
  email?: string;
  confidence: number;
  supportingUrls: string[];
  error?: string;
}

export async function enrichLead(website: string): Promise<EnrichmentResult> {
  if (!website) {
    return { confidence: 0, supportingUrls: [] };
  }
  
  const apiKey = process.env.BROWSERUSE_API_KEY;
  if (!apiKey) {
    console.warn('Browser Use API key not configured, skipping enrichment');
    return { confidence: 0, supportingUrls: [], error: 'API key not configured' };
  }
  
  try {
    // Ensure website has protocol
    const url = website.startsWith('http') ? website : `https://${website}`;
    
    // Use Browser Use API to extract contact information
    const response = await fetch('https://api.browseruse.com/v1/browse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: url,
        goal: "Find phone number, email address, or contact page information for this business. Look in headers, footers, contact pages, and about pages.",
        max_steps: 5,
        timeout: 20000,
        extract: {
          phone: "Extract any phone numbers found on the page",
          email: "Extract any email addresses found on the page", 
          contactUrls: "List any contact page URLs discovered"
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Browser Use API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Parse the extracted information
    let phone: string | undefined;
    let email: string | undefined;
    const supportingUrls: string[] = [url];
    
    if (data.extracted) {
      // Extract phone number
      if (data.extracted.phone) {
        const phoneMatch = data.extracted.phone.match(/[+]?\s?[(]?\d{1,3}[)]?\s?[-.]?[(]?\d{3}[)]?\s?[-.]?\d{3}\s?[-.]?\d{4}/);
        if (phoneMatch) {
          phone = phoneMatch[0].replace(/\D/g, '');
          if (phone.length >= 10) {
            phone = phone.length === 11 && phone.startsWith('1') ? phone.slice(1) : phone;
            phone = `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
          }
        }
      }
      
      // Extract email
      if (data.extracted.email) {
        const emailMatch = data.extracted.email.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          email = emailMatch[0];
        }
      }
      
      // Add contact URLs to supporting URLs
      if (data.extracted.contactUrls && Array.isArray(data.extracted.contactUrls)) {
        supportingUrls.push(...data.extracted.contactUrls);
      }
    }
    
    // Calculate confidence based on what we found
    let confidence = 0;
    if (phone) confidence += 0.5;
    if (email) confidence += 0.3;
    if (data.extracted?.contactUrls?.length > 0) confidence += 0.2;
    
    return {
      phone,
      email,
      confidence: Math.min(confidence, 1.0),
      supportingUrls
    };
    
  } catch (error) {
    console.error('Error enriching lead:', error);
    
    // Fallback: Simple regex extraction from website content
    try {
      const response = await fetch(website.startsWith('http') ? website : `https://${website}`);
      if (response.ok) {
        const html = await response.text();
        
        // Simple regex patterns
        const phoneMatch = html.match(/[+]?\s?[(]?\d{1,3}[)]?\s?[-.]?[(]?\d{3}[)]?\s?[-.]?\d{3}\s?[-.]?\d{4}/);
        const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        
        let phone: string | undefined;
        if (phoneMatch) {
          const phoneDigits = phoneMatch[0].replace(/\D/g, '');
          if (phoneDigits.length >= 10) {
            const cleanPhone = phoneDigits.length === 11 && phoneDigits.startsWith('1') 
              ? phoneDigits.slice(1) 
              : phoneDigits;
            phone = `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
          }
        }
        
        return {
          phone,
          email: emailMatch ? emailMatch[0] : undefined,
          confidence: (phone ? 0.3 : 0) + (emailMatch ? 0.2 : 0),
          supportingUrls: [website],
          error: error instanceof Error ? error.message : String(error)
        };
      }
    } catch {
      // Ignore fallback errors
    }
    
    return { 
      confidence: 0, 
      supportingUrls: [], 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Utility function to check if robots.txt allows crawling
export async function checkRobotsTxt(website: string): Promise<boolean> {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
    
    const response = await fetch(robotsUrl);
    if (!response.ok) {
      return true; // No robots.txt found, assume allowed
    }
    
    const robotsTxt = await response.text();
    
    // Simple check for common disallow patterns
    const lines = robotsTxt.split('\n');
    let userAgent = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        userAgent = trimmed.substring(11).trim();
      } else if (trimmed.toLowerCase().startsWith('disallow:') && 
                 (userAgent === '*' || userAgent.toLowerCase().includes('bot'))) {
        const disallowed = trimmed.substring(9).trim();
        if (disallowed === '/' || disallowed === '') {
          return false; // Disallows all crawling
        }
      }
    }
    
    return true; // No specific disallow found
    
  } catch (error) {
    console.warn('Error checking robots.txt:', error);
    return true; // Assume allowed if check fails
  }
}