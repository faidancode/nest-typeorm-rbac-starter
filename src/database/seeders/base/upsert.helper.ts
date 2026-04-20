import { DataSource } from 'typeorm';

export async function insertIfNotExists(
  db: DataSource,
  table: string,
  uniqueColumn: string,
  rows: Record<string, any>[],
) {
  for (const row of rows) {
    const columns = Object.keys(row).join(',');
    const values = Object.values(row)
      .map((v) => (typeof v === 'string' ? `'${v}'` : v))
      .join(',');

    await db.query(`
      IF NOT EXISTS (
        SELECT 1 FROM ${table} WHERE ${uniqueColumn} = '${row[uniqueColumn]}'
      )
      BEGIN
        INSERT INTO ${table} (${columns})
        VALUES (${values})
      END
    `);
  }
}
