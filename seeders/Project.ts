import { randProductDescription, randProductName } from "@ngneat/falso";
import { Db } from "mongodb";

export async function seedProjects(db: Db) {
  const clients = await db.collection("clients").find({}).toArray();

  const data = clients
    .map((client) =>
      new Array(3).fill(null).map(() => {
        const isCashed = Math.random() > 0.5;
        const hasDescription = Math.random() > 0.5;

        return {
          name: randProductName(),
          description: hasDescription ? randProductDescription() : null,
          cashData: isCashed
            ? {
                at: new Date(),
                amount: 1000,
              }
            : null,
          client: client._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
    )
    .flat();

  return db.collection("projects").insertMany(data);
}
