import { randFullName, randEmail, randPassword } from "@ngneat/falso";
import { Db } from "mongodb";
import { hashSync } from "bcryptjs";

export const userData = new Array(10).fill(null).map(() => ({
  name: randFullName(),
  email: randEmail(),
  password: randPassword(),
}));

export async function seedUsers(db: Db) {
  return db.collection("users").insertMany(
    userData.map((data) => ({
      ...data,
      password: hashSync(data.password),
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
}
