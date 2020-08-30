import { getDatabase } from '../misc/getDatabase'

export default async function init() {
  const db = await getDatabase()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS client (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL,
      fiscal_code TEXT DEFAULT NULL,
      first_name TEXT DEFAULT NULL,
      last_name TEXT DEFAULT NULL,
      country_code TEXT DEFAULT NULL,
      vat_number TEXT DEFAULT NULL,
      business_name TEXT DEFAULT NULL,
      address_country TEXT NOT NULL,
      address_province TEXT NOT NULL,
      address_city TEXT NOT NULL,
      address_zip TEXT NOT NULL,
      address_street TEXT NOT NULL,
      address_street_number TEXT DEFAULT NULL,
      address_email TEXT NOT NULL,
      user INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user) REFERENCES user(id),
      CHECK ((
        type = 'PRIVATE' AND
        fiscal_code IS NOT NULL AND
        first_name IS NOT NULL AND
        last_name IS NOT NULL
      ) OR (
        type = 'BUSINESS' AND
        country_code IS NOT NULL AND
        vat_number IS NOT NULL AND
        business_name IS NOT NULL
      ))
    );

    CREATE TRIGGER IF NOT EXISTS client_updated_at AFTER UPDATE ON client
    FOR EACH ROW BEGIN
      UPDATE client SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS client_user_deleted AFTER DELETE ON user
    FOR EACH ROW BEGIN
      DELETE FROM client WHERE user = OLD.id;
    END;
  `)
}
