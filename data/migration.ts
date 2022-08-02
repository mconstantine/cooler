import sqlite3, { Database } from "sqlite3";
import {
  MongoClient as MongoDBClient,
  ObjectId,
  WithId,
  InsertManyResult,
} from "mongodb";

const MONGO_URL =
  "mongodb://localhost:27017/cooler?maxPoolSize=20&w=majority&readPreference=primary&directConnection=true&ssl=false";

interface SQLiteUser {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}
interface MongoUser {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SQLiteTax {
  id: number;
  label: string;
  value: number;
  user: number;
}
interface MongoTax {
  label: string;
  value: number;
  user: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface BaseSQLiteClient {
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
interface BaseMongoClient {
  addressCountry: string;
  addressProvince: string;
  addressCity: string;
  addressZIP: string;
  addressStreet: string;
  addressStreetNumber: string | null;
  addressEmail: string;
  user: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface PrivateSQLiteClient extends BaseSQLiteClient {
  type: "PRIVATE";
  fiscal_code: string;
  first_name: string;
  last_name: string;
  country_code: null;
  vat_number: null;
  business_name: null;
}
interface PrivateMongoClient extends BaseMongoClient {
  type: "PRIVATE";
  fiscalCode: string;
  firstName: string;
  lastName: string;
  countryCode: null;
  vatNumber: null;
  businessName: null;
}

interface BusinessSQLiteClient extends BaseSQLiteClient {
  type: "BUSINESS";
  fiscal_code: null;
  first_name: null;
  last_name: null;
  country_code: string;
  vat_number: string;
  business_name: string;
}
interface BusinessMongoClient extends BaseMongoClient {
  type: "BUSINESS";
  fiscalCode: null;
  firstName: null;
  lastName: null;
  countryCode: string;
  vatNumber: string;
  businessName: string;
}

type SQLiteClient = PrivateSQLiteClient | BusinessSQLiteClient;
type MongoClient = PrivateMongoClient | BusinessMongoClient;

interface SQLiteProject {
  id: number;
  name: string;
  description: string | null;
  client: number;
  cashed_at: string | null;
  cashed_balance: number | null;
  created_at: string;
  updated_at: string;
}
interface MongoProject {
  name: string;
  description: string | null;
  client: ObjectId;
  user: ObjectId;
  cashData: {
    at: Date;
    amount: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SQLiteTask {
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
interface MongoTask {
  name: string;
  description: string | null;
  startTime: Date;
  expectedWorkingHours: number;
  hourlyCost: number;
  project: ObjectId;
  client: ObjectId;
  user: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface SQLiteSession {
  id: number;
  start_time: string;
  end_time: string;
  task: number;
}
interface MongoSession {
  startTime: Date;
  endTime: Date;
  task: ObjectId;
  project: ObjectId;
  client: ObjectId;
  user: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type EntityList<T> = Array<{
  id: number;
  _id: ObjectId;
  item: WithId<T>;
}>;

(async () => {
  console.log("Starting");

  const sqlite = new sqlite3.Database("data.db");
  console.log("Connected to SQLite database");

  const mongoClient = await MongoDBClient.connect(MONGO_URL);
  const mongo = mongoClient.db("cooler");
  console.log("Connected to Mongo database");

  const collections = await mongo
    .listCollections()
    .map((_) => _.name)
    .toArray();

  for (const collection of collections) {
    await mongo.dropCollection(collection);
  }

  console.log("Cleaned Mongo database");
  console.log("Migrating users");

  const users = await getEntity<SQLiteUser>(sqlite, "user");

  const usersList: EntityList<MongoUser> = await toEntityList<
    SQLiteUser,
    MongoUser
  >("users", users, (user) =>
    Promise.resolve({
      name: user.name,
      email: user.email,
      password: user.password,
      createdAt: sqlToJSDate(user.created_at),
      updatedAt: sqlToJSDate(user.updated_at),
    })
  );

  console.log("Migrating taxes");

  const taxes = await getEntity<SQLiteTax>(sqlite, "tax");

  await mongo.collection("taxes").insertMany(
    taxes.map((tax): MongoTax => {
      const user = usersList.find((user) => user.id === tax.user);

      if (!user) {
        throw new Error(`User not found while creating tax! id: ${tax.user}`);
      }

      return {
        label: tax.label,
        value: tax.value,
        user: user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    })
  );

  console.log("Migrating clients");

  const clients = await getEntity<SQLiteClient>(sqlite, "client");

  const clientsList: EntityList<MongoClient> = await toEntityList<
    SQLiteClient,
    MongoClient
  >("clients", clients, async (client) => {
    const user = usersList.find((user) => user.id === client.user);

    if (!user) {
      throw new Error(
        `User not found while creating client! id: ${client.user}`
      );
    }

    return {
      type: client.type,
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
        addressZIP: client.address_zip,
        addressStreet: client.address_street,
        addressStreetNumber: client.address_street_number,
        addressEmail: client.address_email,
        user: user._id,
        createdAt: sqlToJSDate(client.created_at),
        updatedAt: sqlToJSDate(client.updated_at),
      },
    } as MongoClient;
  });

  console.log("Migrating projects");

  const projects = await getEntity<SQLiteProject>(sqlite, "project");

  const projectsList = await toEntityList<SQLiteProject, MongoProject>(
    "projects",
    projects,
    async (project) => {
      const client = clientsList.find((client) => client.id === project.client);

      if (!client) {
        throw new Error(
          `Client not found while creating project! id: ${project.client}`
        );
      }

      return {
        name: project.name,
        description: project.description,
        client: client._id,
        user: client.item.user,
        cashData:
          project.cashed_at && project.cashed_balance
            ? {
                at: sqlToJSDate(project.cashed_at),
                amount: project.cashed_balance,
              }
            : null,
        createdAt: sqlToJSDate(project.created_at),
        updatedAt: sqlToJSDate(project.updated_at),
      };
    }
  );

  console.log("Migrating tasks");

  const tasks = await getEntity<SQLiteTask>(sqlite, "task");

  const tasksList: EntityList<MongoTask> = await toEntityList<
    SQLiteTask,
    MongoTask
  >("tasks", tasks, async (task) => {
    const project = projectsList.find((project) => project.id === task.project);

    if (!project) {
      throw new Error(
        `Project not found while creating task! id: ${task.project}`
      );
    }

    return {
      name: task.name,
      description: task.description,
      startTime: sqlToJSDate(task.start_time),
      expectedWorkingHours: task.expectedWorkingHours,
      hourlyCost: task.hourlyCost,
      project: project._id,
      client: project.item.client,
      user: project.item.user,
      createdAt: sqlToJSDate(task.created_at),
      updatedAt: sqlToJSDate(task.updated_at),
    };
  });

  console.log("Migrating sessions");

  const sessions = await getEntity<SQLiteSession>(sqlite, "session");

  await mongo.collection("sessions").insertMany(
    sessions.map((session): MongoSession => {
      const task = tasksList.find((task) => task.id === session.task);

      if (!task) {
        throw new Error(
          `Task not found while creating session! id: ${session.task}`
        );
      }

      const startTime = sqlToJSDate(session.start_time);
      const endTime = sqlToJSDate(session.end_time);

      return {
        startTime,
        endTime,
        task: task._id,
        project: task.item.project,
        client: task.item.client,
        user: task.item.user,
        createdAt: startTime,
        updatedAt: endTime,
      };
    })
  );

  sqlite.close();
  await mongoClient.close();

  async function toEntityList<I extends { id: number }, O>(
    collectionName: string,
    list: I[],
    f: (item: I) => Promise<O>
  ): Promise<EntityList<O>> {
    const items: O[] = [];

    for (const item of list) {
      items.push(await f(item));
    }

    const result = await mongo.collection(collectionName).insertMany(items);
    const _ids = arrayFromInsertedResult(result);

    return items.map((item, index) => {
      const _id = _ids[index]!;

      return {
        id: list[index]!.id,
        _id,
        item: { _id, ...item } as WithId<O>,
      };
    });
  }
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

function sqlToJSDate(sqlDate: string): Date {
  const [, year, month, day, hours, minutes, seconds] =
    sqlDate.match(sqlDatePattern)!;

  return new Date(
    `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`
  );
}

function arrayFromInsertedResult<T>(result: InsertManyResult<T>): ObjectId[] {
  return Object.values(result.insertedIds);
}
