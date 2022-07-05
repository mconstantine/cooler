import sqlite3, { Database } from "sqlite3";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URL =
  "mongodb://localhost:27017/cooler?maxPoolSize=20&w=majority&readPreference=primary&directConnection=true&ssl=false";

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

interface Tax {
  id: number;
  label: string;
  value: number;
  user: number;
}

interface BaseClient {
  id: number;
  address_country: string;
  address_province: string;
  address_city: string;
  address_zip: string;
  address_street: string;
  address_street_number: string | null;
  address_email: string;
  user: number;
  created_at: string;
  updated_at: string;
}

interface PrivateClient extends BaseClient {
  type: "PRIVATE";
  fiscal_code: string;
  first_name: string;
  last_name: string;
  country_code: null;
  vat_number: null;
  business_name: null;
}

interface BusinessClient extends BaseClient {
  type: "BUSINESS";
  fiscal_code: null;
  first_name: null;
  last_name: null;
  country_code: string;
  vat_number: string;
  business_name: string;
}

type Client = PrivateClient | BusinessClient;

interface Project {
  id: number;
  name: string;
  description: string | null;
  client: number;
  cashed_at: string | null;
  cashed_balance: number | null;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: number;
  name: string;
  description: string | null;
  start_time: string;
  expectedWorkingHours: number;
  hourlyCost: number;
  project: number;
  created_at: string;
  updated_at: string;
}

interface Session {
  id: number;
  start_time: string;
  end_time: string;
  task: number;
}

(async () => {
  const sqlite = new sqlite3.Database("data.db");
  const mongoClient = await MongoClient.connect(MONGO_URL);
  const mongo = mongoClient.db("cooler");

  const collections = await mongo
    .listCollections()
    .map((_) => _.name)
    .toArray();

  for (const collection of collections) {
    await mongo.dropCollection(collection);
  }

  const users = await getEntity<User>(sqlite, "user");

  const usersResult = await mongo.collection("users").insertMany(
    users.map((user) => ({
      name: user.name,
      email: user.email,
      password: user.password,
      createdAt: sqlToISODate(user.created_at),
      updatedAt: sqlToISODate(user.updated_at),
    }))
  );

  const usersIdsMap = Object.entries(usersResult.insertedIds).reduce(
    (res, [index, objectId]) => {
      const id = users[parseInt(index)]!.id;
      return { ...res, [id]: objectId };
    },
    {} as Record<number, ObjectId>
  );

  const taxes = await getEntity<Tax>(sqlite, "tax");

  await mongo.collection("taxes").insertMany(
    taxes.map((tax) => ({
      label: tax.label,
      value: tax.value,
      user: usersIdsMap[tax.user],
    }))
  );

  const clients = await getEntity<Client>(sqlite, "client");

  const clientsResult = await mongo.collection("clients").insertMany(
    clients.map((client) => ({
      ...(() => {
        switch (client.type) {
          case "PRIVATE":
            return {
              fiscalCode: client.fiscal_code,
              firstName: client.first_name,
              lastName: client.last_name,
            };
          case "BUSINESS":
            return {
              countryCode: client.country_code,
              vatNumber: client.vat_number,
              businessName: client.business_name,
            };
        }
      })(),
      ...{
        addressCountry: client.address_country,
        addressProvince: client.address_province,
        addressCity: client.address_city,
        addressZip: client.address_zip,
        addressStreet: client.address_street,
        addressStreetNumber: client.address_street_number,
        addressEmail: client.address_email,
        user: usersIdsMap[client.user],
        createdAt: sqlToISODate(client.created_at),
        updatedAt: sqlToISODate(client.updated_at),
      },
    }))
  );

  const clientsIdsMap = Object.entries(clientsResult.insertedIds).reduce(
    (res, [index, objectId]) => {
      const id = clients[parseInt(index)]!.id;
      return { ...res, [id]: objectId };
    },
    {} as Record<number, ObjectId>
  );

  const projects = await getEntity<Project>(sqlite, "project");

  const projectsResult = await mongo.collection("projects").insertMany(
    projects.map((project) => ({
      name: project.name,
      description: project.description,
      client: clientsIdsMap[project.client],
      cashData:
        project.cashed_at && project.cashed_balance
          ? {
              at: sqlToISODate(project.cashed_at),
              amount: project.cashed_balance,
            }
          : null,
      createdAt: sqlToISODate(project.created_at),
      updatedAt: sqlToISODate(project.updated_at),
    }))
  );

  const projectsIdsMap = Object.entries(projectsResult.insertedIds).reduce(
    (res, [index, objectId]) => {
      const id = projects[parseInt(index)]!.id;
      return { ...res, [id]: objectId };
    },
    {} as Record<number, ObjectId>
  );

  const tasks = await getEntity<Task>(sqlite, "task");

  const tasksResult = await mongo.collection("tasks").insertMany(
    tasks.map((task) => ({
      name: task.name,
      description: task.description,
      startTime: sqlToISODate(task.start_time),
      expectedWorkingHours: task.expectedWorkingHours,
      hourlyCost: task.hourlyCost,
      project: projectsIdsMap[task.project],
      createdAt: sqlToISODate(task.created_at),
      updatedAt: sqlToISODate(task.updated_at),
    }))
  );

  const tasksIdsMap = Object.entries(tasksResult.insertedIds).reduce(
    (res, [index, objectId]) => {
      const id = tasks[parseInt(index)]!.id;
      return { ...res, [id]: objectId };
    },
    {} as Record<number, ObjectId>
  );

  const sessions = await getEntity<Session>(sqlite, "session");

  await mongo.collection("sessions").insertMany(
    sessions.map((session) => ({
      startTime: sqlToISODate(session.start_time),
      endTime: sqlToISODate(session.end_time),
      task: tasksIdsMap[session.task],
    }))
  );

  sqlite.close();
  await mongoClient.close();
})().then(
  () => process.exit(0),
  (error) => {
    console.log(error);
    process.exit(1);
  }
);

function getEntity<T>(db: Database, tableName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) reject(err);

      if (!rows.length) {
        reject(
          new Error("No users found. Are you sure there is any data at all?")
        );
      }

      resolve(rows);
    });
  });
}

const sqlDatePattern = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/;

function sqlToISODate(sqlDate: string): string {
  const [, year, month, day, hours, minutes, seconds] =
    sqlDate.match(sqlDatePattern)!;

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}
