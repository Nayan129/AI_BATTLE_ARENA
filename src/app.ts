import express from "express";
import runGraph from "./ai/graph.ai.js"
const app = express();

app.get("/",(req,res)=>{
  res.status(200).json({
    status:"ok"
  })
})

app.post("/runGraph", async (req, res) => {
  try {
    const result = await runGraph("give me proper interview questions for crack frontend developer interview in 2026 with the asnwers , soltions, and explaination in hinglish.make sure search on internet about mostly ask interview questions in companies");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});
export default app;

