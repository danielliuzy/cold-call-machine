# Cold Call Machine

An AI-powered cold calling system that automatically discovers leads, generates personalized scripts, and manages outbound calls using Vapi.

## Features

-   **Business Analysis**: Automatically classify businesses from website URLs
-   **Lead Discovery**: Find prospects using Google Places API and Yelp Fusion
-   **Lead Enrichment**: Extract contact information from business websites
-   **AI Script Generation**: Create personalized cold call scripts
-   **Automated Calling**: Place outbound calls with Vapi voice AI
-   **Real-time Dashboard**: Monitor leads, calls, and performance metrics
-   **Compliance**: TCPA-compliant calling with opt-out support

## Tech Stack

-   **Frontend**: React + TypeScript + Vite + Tailwind CSS
-   **Backend**: Convex (serverless TypeScript)
-   **Database**: Convex (real-time reactive database)
-   **Voice AI**: Vapi for outbound calling
-   **LLM**: OpenAI GPT-4 for classification and script generation
-   **Lead Discovery**: Google Places API, Yelp Fusion API
-   **Lead Enrichment**: Browser Use API

## Prerequisites

1. **API Keys Required:**

    - OpenAI API key
    - Google Places API key
    - Vapi API key
    - Browser Use API key

2. **Accounts:**
    - Convex account
    - Vapi account with phone number

## Quick Start

1. **Clone and Install**

    ```bash
    cd frontend
    npm install
    ```

2. **Set up Convex**

    ```bash
    npx convex dev
    # Follow prompts to create account and deployment
    ```

3. **Configure Environment Variables**
   Create `.env.local`:

    ```bash
    OPENAI_API_KEY=your_openai_api_key
    GOOGLE_PLACES_API_KEY=your_google_places_api_key
    VAPI_API_KEY=your_vapi_api_key
    BROWSERUSE_API_KEY=your_browseruse_api_key  # Optional
    YELP_API_KEY=your_yelp_api_key  # Optional
    VAPI_WEBHOOK_SECRET=your_webhook_secret  # Optional
    ```

4. **Start Development**

    ```bash
    npm run dev
    ```

5. **Configure Vapi Webhook**
    - In Vapi dashboard, set webhook URL to: `https://your-convex-deployment.convex.cloud/vapiWebhook`
    - Enable events: `call.started`, `transcript.updated`, `call.ended`, `call.failed`

## Project Structure

```
frontend/
├── convex/                 # Convex backend functions
│   ├── schema.ts          # Database schema
│   ├── queries/           # Query functions
│   ├── mutations/         # Mutation functions
│   └── actions/           # HTTP actions (webhooks)
├── services/              # External API integrations
│   ├── classifyBusiness.ts
│   ├── discoverLeads.ts
│   ├── enrichLead.ts
│   ├── generateScript.ts
│   └── callOrchestrator.ts
└── src/
    └── App.tsx           # Main dashboard UI
```

## Usage

### 1. Business Onboarding

-   Enter business website URL
-   System analyzes and extracts business information
-   Creates business profile with category and service area

### 2. Lead Generation

-   Click "Generate Leads"
-   System searches Google Places/Yelp for similar businesses
-   Deduplicates and scores leads
-   Optionally enriches contact information

### 3. Script Creation

-   Click "Generate Script"
-   AI creates personalized cold call script
-   Includes objection handling and compliance disclaimers

### 4. Start Calling

-   Click "Start Calls"
-   System creates Vapi outbound calls
-   Webhooks update call status in real-time
-   AI summarizes call outcomes

### 5. Monitor Results

-   View leads and call status in dashboard
-   Track performance metrics
-   Export results as needed

## API Integration Details

### Google Places API

-   **Text Search**: Find businesses by category and location
-   **Place Details**: Get contact information and ratings
-   **Cost**: ~$0.032 per text search + $0.017 per place detail

### Vapi Integration

-   **Assistant Creation**: Configure voice AI with custom scripts
-   **Outbound Calls**: Initiate calls to lead phone numbers
-   **Webhooks**: Receive real-time call status updates
-   **Cost**: ~$0.05-0.15 per minute depending on configuration

### OpenAI Integration

-   **Business Classification**: Extract category and service area from websites
-   **Script Generation**: Create personalized cold call scripts
-   **Call Summarization**: Analyze call transcripts and outcomes
-   **Cost**: ~$0.01-0.05 per request depending on content length

## Compliance & Legal

-   **TCPA Compliance**: Includes opt-out mechanisms and call time restrictions
-   **Do Not Call**: Maintains suppression lists
-   **Recording Disclosure**: Scripts include recording disclaimers
-   **Data Sources**: Uses only official APIs, no web scraping of protected content
-   **Robots.txt**: Respects website crawling permissions

## Deployment

### Convex Deployment

```bash
npx convex deploy
```

### Vite Build

```bash
npm run build
npm run preview
```

### Environment Variables for Production

Set the same environment variables in your deployment environment.

## Customization

### Adding New Lead Sources

1. Create new service in `services/`
2. Add provider option in `discoverLeads.ts`
3. Update UI to include new provider

### Custom Scripts

-   Modify `generateScript.ts` prompts
-   Add business-specific templates
-   Include industry-specific objection handling

### Voice Configuration

-   Update Vapi assistant configuration in `callOrchestrator.ts`
-   Change voice, model, or behavior settings
-   Add custom functions for dynamic responses

## Troubleshooting

### Common Issues

1. **API Rate Limits**

    - Google Places: 100 requests/second
    - OpenAI: Tier-based limits
    - Add retry logic with exponential backoff

2. **Vapi Webhooks**

    - Ensure webhook URL is publicly accessible
    - Check webhook signature verification
    - Monitor Convex action logs

3. **Lead Quality**
    - Adjust scoring algorithm in `generateScript.ts`
    - Filter by rating/review count thresholds
    - Add business verification steps

## Cost Optimization

-   **Batch API calls** where possible
-   **Cache results** for repeated queries
-   **Set daily spending limits** per API
-   **Monitor usage** through API dashboards

## Security

-   **API Keys**: Never commit to version control
-   **Webhook Verification**: Verify signatures when available
-   **Data Validation**: Sanitize all user inputs
-   **Access Control**: Implement user authentication for production

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

-   Create GitHub issues for bugs
-   Check API documentation for integration issues
-   Review Convex docs for database questions

---

**⚠️ Important**: This system makes real phone calls and incurs costs. Always test with small batches and monitor spending. Ensure compliance with local telemarketing laws.
