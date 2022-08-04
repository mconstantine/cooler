import {
  randCity,
  randCompanyName,
  randCountryCode,
  randEmail,
  randFirstName,
  randLastName,
  randMask,
  randStreetName,
  randZipCode,
} from "@ngneat/falso";
import { Db } from "mongodb";

export async function seedClients(db: Db) {
  const users = await db.collection("users").find({}).toArray();

  const data = users
    .map((user) =>
      new Array(10).fill(null).map(() => {
        const type = Math.random() < 0.5 ? "private" : "business";
        const inItaly = Math.random() < 0.5;
        const countryCode = inItaly ? "IT" : randCountryCode();

        return {
          ...{
            addressCountry: countryCode,
            addressProvince: inItaly ? randProvince() : "EE",
            addressZIP: randZipCode(),
            addressCity: randCity(),
            addressStreet: randStreetName(),
            addressEmail: randEmail(),
            user: user._id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...(type === "private"
            ? {
                firstName: randFirstName(),
                lastName: randLastName(),
                fiscalCode: randFiscalCode(),
              }
            : {
                countryCode,
                businessName: randCompanyName(),
                vatNumber: randMask({ mask: "###########" }),
              }),
        };
      })
    )
    .flat();

  return db.collection("clients").insertMany(data);
}

function randProvince() {
  // prettier-ignore
  const provinces = [
    "AG", "AL", "AN", "AO", "AQ", "AR", "AP", "AT", "AV", "BA", "BT", "BL", "BN", "BG", "BI", "BO", "BZ", "BS", "BR", "CA", "CL", "CB", "CI", "CE", "CT", "CZ", "CH", "CO", "CS", "CR", "KR", "CN", "EN", "FM", "FE", "FI", "FG", "FC", "FR", "GE", "GO", "GR", "IM", "IS", "SP", "LT", "LE", "LC", "LI", "LO", "LU", "MC", "MN", "MS", "MT", "VS", "ME", "MI", "MO", "MB", "NA", "NO", "NU", "OG", "OT", "OR", "PD", "PA", "PR", "PV", "PG", "PU", "PE", "PC", "PI", "PT", "PN", "PZ", "PO", "RG", "RA", "RC", "RE", "RI", "RN", "RO", "SA", "SS", "SV", "SI", "SR", "SO", "TA", "TE", "TR", "TO", "TP", "TN", "TV", "TS", "UD", "VA", "VE", "VB", "VC", "VR", "VV", "VI", "VT", "EE"
  ];

  return provinces[Math.floor(Math.random() * provinces.length)];
}

function randFiscalCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const rc = () => chars[Math.floor(Math.random() * chars.length)];
  const rd = () => digits[Math.floor(Math.random() * digits.length)];

  // prettier-ignore
  return [
    rc(), rc(), rc(), rc(), rc(), rc(), rd(), rd(), rc(), rd(), rd(), rc(), rd(), rd(), rd(), rc(),
  ].join("");
}
