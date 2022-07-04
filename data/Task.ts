import { randNumber, randPhrase, randSoonDate } from "@ngneat/falso";
import { Db } from "mongodb";

export async function seedTasks(db: Db) {
  const projects = await db.collection("projects").find({}).toArray();

  const data = projects
    .map((project) =>
      new Array(3).fill(null).map(() => {
        const hasDescription = Math.random() > 0.5;

        return {
          name: randPhrase(),
          project: project._id,
          description: hasDescription ? randPhrase() : null,
          startTime: randSoonDate({ days: 60 }),
          expectedWorkingHours: randNumber({ min: 1, max: 100 }),
          hourlyCost: randNumber({ min: 20, max: 35 }),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
    )
    .flat();

  return db.collection("tasks").insertMany(data);
}
