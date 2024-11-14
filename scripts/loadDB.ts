import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import OpenAI from "openai";
import "dotenv/config";

// import from .env
const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

//openai initialization
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// urls to be scrapped
const f1Data = [
  "https://en.wikipedia.org/wiki/Formula_One",
  "https://www.formula1.com/en/results/2021/races",
  "https://en.wikipedia.org/wiki/List_of_FIA_championships",
  "https://www.formula1.com/en/results/2024/races",
  "https://www.formula1.com/en/results/2023/races",
  "https://en.wikipedia.org/wiki/2021_British_Grand_Prix",
  "https://www.formula1.com/en/racing/2024",
  "https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/2023_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/2022_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/2021_Formula_One_World_Championship",
];

// create a Astra db client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);

// create db connection
const db = client.db(ASTRA_DB_API_ENDPOINT, {
  keyspace: ASTRA_DB_NAMESPACE,
});

// Splitter init
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

// type of similarity parameter
type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

// create a collection in db
const createCollection = async (
  similarityMatric: SimilarityMetric = "dot_product"
) => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 1536,
      metric: similarityMatric,
    },
  });

  console.log("collection result>>" + res);
};

//initialize the data & save it to vector db
const loadSampleData = async () => {
  const collection = db.collection(ASTRA_DB_COLLECTION);
  for (const url of f1Data) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);
    //for await (const chunk of chunks) { //she put wait here & other in other for's
    for (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const vector = embedding.data[0].embedding;
      const res = await collection.insertOne({
        content: chunk,
        $vector: vector,
      });

      console.log(res);
    }
  }
};

//Scraper function with settings
const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const res = await page.evaluate(() => document.body.innerText);
      await browser.close();
      return res;
    },
  });

  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "|");
};

createCollection().then(() => loadSampleData());
