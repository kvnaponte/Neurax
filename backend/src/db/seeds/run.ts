import { db, client } from '../index'
import { seedOdinCatalogo } from './odin-catalogo'
import { seedLeonidasCatalogo } from './leonidas-catalogo'

async function main() {
  console.log('Ejecutando seeds...')
  await seedOdinCatalogo(db)
  await seedLeonidasCatalogo(db)
  console.log('Seeds completados.')
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(async () => { await client.end(); process.exit(0) })
