import config from "../src/main/resources/application.json";
import { MongoClient } from "mongodb";
import { seedClients } from "./Client";
import { seedUsers } from "./User";
import { seedProjects } from "./Project";

const dbUri = config.database.uri;
const dbName = config.database.name;

(async () => {
  const client = await MongoClient.connect(dbUri);
  const db = client.db(dbName);

  await seedUsers(db);
  await seedClients(db);
  await seedProjects(db);
})().then(
  () => {
    console.log("Done.");
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
