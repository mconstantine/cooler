import { randNumber, randSoonDate } from "@ngneat/falso";
import { Db } from "mongodb";

export async function seedSessions(db: Db) {
  const tasks = await db.collection("tasks").find({}).toArray();

  const data = tasks
    .map((task) =>
      new Array(20).fill(null).map(() => {
        const hasEnded = Math.random() > 0.5;
        const startTime = randSoonDate({ days: 60 });

        return {
          task: task._id,
          startTime,
          endTime: hasEnded
            ? new Date(
                startTime.getTime() +
                  7200000 +
                  randNumber({ min: 0, max: 28800000 })
              )
            : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
    )
    .flat();

  return db.collection("sessions").insertMany(data);
}
