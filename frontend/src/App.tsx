import { useState } from "react";
import LeadGenerationTester from "./test";

const API_BASE_URL = "http://localhost:3001";

export type Lead = {
  name: string;
  address: string;
  phoneNumber: string;
};

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const onCall = async (url: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/leads/analyze-company-leads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyUrl: url }),
      }
    );
    const reader = response.body!.getReader();
    const decoder = new TextDecoder("utf-8");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      setLeads((cur) => [...cur, JSON.parse(chunk)]);
    }
  };

  return <LeadGenerationTester leads={leads} onCall={onCall} />;
}

export default App;
