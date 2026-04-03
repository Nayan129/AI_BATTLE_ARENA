import { HumanMessage } from "@langchain/core/messages";
import { StateSchema, MessagesValue, StateGraph, START, END, ReducedValue } 
from "@langchain/langgraph";
import { mistralModel,cohereModel,geminiModel } from "./models.service.js";
import {createAgent,providerStrategy} from "langchain" ;
import type { GraphNode } from "@langchain/langgraph";
import { compile } from "tailwindcss";
import {promise, z} from "zod"

const State = new StateSchema({
  messages:MessagesValue,
   solution_1:new ReducedValue(z.string().default(""),{
    reducer:(current,next)=>{
      return next;
    }
   }),
   solution_2:new ReducedValue(z.string().default(""),{
    reducer:(current,next)=>{
      return next;
    }
   }),
   judge_recommendation:new ReducedValue(z.object().default({
    solution_1_score:0,
    solution_2_score:0
   }),{
    reducer:(current,next)=>{
      return next
    }
   })
});

const solutionNode : GraphNode<typeof State> = async(state : typeof State) => {
  
  const [mistral_solution,cohere_solution] =await Promise.all([
    mistralModel.invoke(state.messages[0].text),
    cohereModel.invoke(state.messages[0].text)
  ])

  return{
    solution_1:mistral_solution.text,
    solution_2:cohere_solution.text
  }
}

const judgeNode: GraphNode<typeof State> = async(state : typeof State) =>{
  const  {solution_1,solution_2} = state;

  const judge = createAgent({
    model:geminiModel,
    tools:[],
    responseFormat:providerStrategy(z.object({
      solution_1_score:z.number().min(0).max(10),
      solution_2_score:z.number().min(0).max(10),
    }))
  })

  const judgeResponse = await judge.invoke({
     messages:[
      new HumanMessage(`You are a judge with evaluating the quality of two solutions to a problem . The problem is :${state.messages[0].text}. The first solution is:${solution_1}.The second solution is: ${solution_2}.please provide a score between 0 to 10 for each solution, where 0 means the solution is completely incorrect or irrelevant, and 10 means solution is perfect and fully adresses the problem.`)
    ]
  })
  const result = judgeResponse.structuredResponse

  return {
    judge_recommendation:result
  }
}



const graph = new StateGraph(State)
.addNode("solution",solutionNode)
.addNode("judge",judgeNode)
.addEdge(START,"solution")
.addEdge("solution","judge")
.addEdge("judge",END)
.compile();


export default async function(userMessage : string){
  const result = await graph.invoke({
    messages:[
      new HumanMessage(userMessage)
    ]
  })

  console.log(result)
  return result.messages
}


// type JUDGEMENT = {
//   winner:"solution_1" | "solution_2";
//   solution_1_score : number;
//   solution_2_score : number;
// }

// type AIBATTLESTATE = {
//   messages : typeof MessagesValue;
//   solution_1:string;
//   solution_2:string;
//   judgement:JUDGEMENT
// }

// const state : AIBATTLESTATE = {
//   messages:MessagesValue,
//   solution_1:"",
//   solution_2:"",
//   judgement:{
//       winner:"solution_1",
//       solution_1_score : 0,
//       solution_2_score : 0,
//   }
// }

