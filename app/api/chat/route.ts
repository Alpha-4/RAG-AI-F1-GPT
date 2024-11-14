import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);

// create db connection
const db = client.db(ASTRA_DB_API_ENDPOINT, {
  keyspace: ASTRA_DB_NAMESPACE,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    let docContext = "";

    //console.log("latestMessage>>>" + latestMessage);

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    });

    try {
      const collection = db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(
        {},
        {
          sort: {
            $vector: embedding.data[0].embedding,
          },
          limit: 10,
          includeSimilarity: true,
        }
      );

      // console.log("vector>>" + embedding.data[0].embedding);

      //console.log("* Search results:");

      for await (const doc of cursor) {
        // console.log("@", doc.content, doc.$similarity);
        docContext += doc.content;
      }

      //console.log("docContext data from db>>>" + docContext);

      const template = {
        role: "system",
        content: `You are an AI Assistant that helps you 
        with Formula 1 related questions. Use the following context to answer the
        question at the end. The context provides you with the most recent page
        dat from wikipedia, f1.com and formula1.com official website & other sources.
        If the context does not contain enough data to answer the question, try to
        figure the anser out by yourself but with reasonable accuracy & reliable sources. 
        If the answer is completely based on your exisitng knowledge and don't have a specific source
        then state that your anser maybe less reliable otherwise state the sources. Response should be
        in Markdown format and should not contain images or media. Please provide the answer in a well 
        formatted structure that is easy to read and understand. Use bullet points, paragraphs, 
        newline characters and other markdown elements to structure the response.
        ------------------------------
        START CONTEXT
        ${docContext}
        END CONTEXT
        ------------------------------
        QUESTION: ${latestMessage}
        ------------------------------
        `,
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [template, ...messages],
        stream: true,
        temperature: 0.7,
      });

      const stream = OpenAIStream(response);
      return new StreamingTextResponse(stream);
    } catch (error) {
      console.log("error while fetching the record from the collection");
      docContext = "";
      throw error;
    }
  } catch (err) {
    console.log("error creating db....");
    throw err;
  }
}
