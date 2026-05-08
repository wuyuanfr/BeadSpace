import express from "express";
import cors from "cors";
import { workspaceRouter } from "./routes/workspace.js";

const app = express();
const PORT = 3002;

app.use(cors());
app.use("/api", workspaceRouter);

app.listen(PORT, () => {
  console.log(`BeadSpace server running on http://localhost:${PORT}`);
});
