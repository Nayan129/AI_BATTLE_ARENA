import express from "express";
import useGraph from "./ai/graph.ai.js"
const app = express();

app.get("/health",(req,res)=>{
  res.status(200).json({
    status:"ok"
  })
})

app.post("/use-graph",async (req,res)=>{
  await useGraph("what is the capital of America?")
})
export default app;