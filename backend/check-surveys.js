const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const runs = await prisma.surveyRun.findMany({
    include: { stations: { orderBy: { measuredDepth: 'asc' } }, lateral: true }
  });
  console.log('Total survey runs in DB:', runs.length);
  for (const r of runs) {
    console.log(`Run ID: ${r.id}, Lateral: ${r.lateral?.code}, Type: ${r.type}, Active: ${r.isActive}, Stations: ${r.stations.length}, First MD: ${r.stations[0]?.measuredDepth}, Last MD: ${r.stations.at(-1)?.measuredDepth}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);

