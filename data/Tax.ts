import { randProductName } from "@ngneat/falso";
import { Db } from "mongodb";

export const taxData = new Array(10).fill(null).map(() => ({
  label: randProductName(),
  value: Math.random() / 10,
}));

export async function seedTaxes(db: Db) {
  return db.collection("taxes").insertMany(
    taxData.map((data) => ({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
}
