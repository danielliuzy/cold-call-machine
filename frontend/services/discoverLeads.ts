export interface LeadData {
  extId: string;
  name: string;
  category: string;
  website?: string;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviewCount?: number;
  dedupKey: string;
}

export interface DiscoveryResults {
  leads: LeadData[];
  totalFound: number;
  apiCost: number;
}

function normalizeDedup(phone?: string, website?: string, name?: string, address?: string): string {
  if (phone) {
    // Normalize phone number: remove all non-digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `phone_${digits.slice(-10)}`;
    }
  }
  
  if (website) {
    // Normalize domain
    try {
      const domain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname;
      return `domain_${domain.toLowerCase().replace(/^www\./, '')}`;
    } catch {
      // Invalid URL, continue
    }
  }
  
  if (name && address) {
    // Fallback to normalized name + address
    const nameNorm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const addrNorm = address.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    return `name_addr_${nameNorm}_${addrNorm}`;
  }
  
  return `fallback_${Date.now()}_${Math.random()}`;
}

export async function discoverLeads(
  category: string, 
  serviceArea: string[], 
  maxResults = 50
): Promise<DiscoveryResults> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }
  
  const allLeads: LeadData[] = [];
  let totalApiCost = 0;
  
  try {
    for (const area of serviceArea) {
      // Use Text Search to find businesses in the category
      const query = `${category} in ${area}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Google Places API error: ${searchResponse.statusText}`);
      }
      
      const searchData = await searchResponse.json();
      totalApiCost += 0.032; // Text Search API cost estimate
      
      if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
        console.warn(`Places API warning for ${area}:`, searchData.status);
        continue;
      }
      
      for (const place of searchData.results.slice(0, maxResults)) {
        // Get detailed information for each place
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,address_components&key=${apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        if (!detailsResponse.ok) {
          console.warn(`Failed to get details for place ${place.place_id}`);
          continue;
        }
        
        const detailsData = await detailsResponse.json();
        totalApiCost += 0.017; // Place Details API cost estimate
        
        if (detailsData.status !== 'OK') {
          console.warn(`Place details error for ${place.place_id}:`, detailsData.status);
          continue;
        }
        
        const details = detailsData.result;
        
        // Extract city and state from address components
        let city = area; // fallback
        let state = '';
        let postalCode = '';
        
        if (details.address_components) {
          for (const component of details.address_components) {
            if (component.types.includes('locality')) {
              city = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name;
            } else if (component.types.includes('postal_code')) {
              postalCode = component.long_name;
            }
          }
        }
        
        const leadData: LeadData = {
          extId: place.place_id,
          name: details.name || place.name,
          category: category,
          website: details.website,
          phone: details.formatted_phone_number,
          address: details.formatted_address || place.formatted_address,
          city,
          state,
          postalCode,
          lat: details.geometry?.location?.lat,
          lng: details.geometry?.location?.lng,
          rating: details.rating,
          reviewCount: details.user_ratings_total,
          dedupKey: normalizeDedup(
            details.formatted_phone_number,
            details.website,
            details.name,
            details.formatted_address
          )
        };
        
        allLeads.push(leadData);
        
        if (allLeads.length >= maxResults) {
          break;
        }
      }
      
      if (allLeads.length >= maxResults) {
        break;
      }
    }
    
    // Remove duplicates based on dedupKey
    const uniqueLeads = allLeads.filter((lead, index, self) => 
      index === self.findIndex(l => l.dedupKey === lead.dedupKey)
    );
    
    return {
      leads: uniqueLeads,
      totalFound: allLeads.length,
      apiCost: totalApiCost
    };
    
  } catch (error) {
    console.error('Error discovering leads:', error);
    throw error;
  }
}

// Alternative Yelp Fusion implementation
export async function discoverLeadsYelp(
  category: string,
  serviceArea: string[],
  maxResults = 50
): Promise<DiscoveryResults> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    throw new Error('Yelp API key not configured');
  }
  
  const allLeads: LeadData[] = [];
  let totalApiCost = 0;
  
  try {
    for (const area of serviceArea) {
      const searchUrl = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(category)}&location=${encodeURIComponent(area)}&limit=50`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Yelp API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      totalApiCost += 0.01; // Yelp API cost estimate
      
      for (const business of data.businesses.slice(0, maxResults)) {
        const leadData: LeadData = {
          extId: business.id,
          name: business.name,
          category: category,
          website: business.url ? business.url.replace('yelp.com', business.url) : undefined,
          phone: business.phone,
          address: business.location.display_address.join(', '),
          city: business.location.city,
          state: business.location.state,
          postalCode: business.location.zip_code,
          lat: business.coordinates?.latitude,
          lng: business.coordinates?.longitude,
          rating: business.rating,
          reviewCount: business.review_count,
          dedupKey: normalizeDedup(
            business.phone,
            business.url,
            business.name,
            business.location.display_address.join(', ')
          )
        };
        
        allLeads.push(leadData);
        
        if (allLeads.length >= maxResults) {
          break;
        }
      }
      
      if (allLeads.length >= maxResults) {
        break;
      }
    }
    
    // Remove duplicates
    const uniqueLeads = allLeads.filter((lead, index, self) => 
      index === self.findIndex(l => l.dedupKey === lead.dedupKey)
    );
    
    return {
      leads: uniqueLeads,
      totalFound: allLeads.length,
      apiCost: totalApiCost
    };
    
  } catch (error) {
    console.error('Error discovering leads via Yelp:', error);
    throw error;
  }
}