import express from "express";
import cors from "cors";
import leadGenerationRoutes from "./routes/browseruse";

const app = express();
const PORT = process.env["PORT"] || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/leads", leadGenerationRoutes);

app.get("/", (_, res) => {
  res.json({ message: "online!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
