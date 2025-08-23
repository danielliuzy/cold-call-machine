import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

function App() {
  const [url, setUrl] = useState("");
  return (
    <div className="h-screen w-screen px-1/2 bg-red-300">
      <Input value={url} onChange={(e) => setUrl(e.target.value)} />
    </div>
  );
}

export default App;
