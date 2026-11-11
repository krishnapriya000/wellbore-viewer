const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wells = await prisma.well.findMany({
    include: { laterals: true },
  });
  console.log('Wells count:', wells.length);
  for (const w of wells) {
    console.log(`Well: "${w.name}" (id: ${w.id}, code: ${w.wellCode}) - Laterals: [${w.laterals.map(l => l.code).join(', ')}]`);
  }

  const events = await prisma.engineeringEvent.count();
  const formations = await prisma.formationInterval.count();
  const lithologies = await prisma.lithologyInterval.count();
  const surveyRuns = await prisma.surveyRun.count();
  const surveyStations = await prisma.surveyStation.count();
  const constructionSections = await prisma.wellConstructionSection.count();
  const casings = await prisma.casingString.count();
  const cements = await prisma.cementInterval.count();

  console.log('\n--- PostgreSQL Database Statistics ---');
  console.log('EngineeringEvent rows:', events);
  console.log('FormationInterval rows:', formations);
  console.log('LithologyInterval rows:', lithologies);
  console.log('SurveyRun rows:', surveyRuns);
  console.log('SurveyStation rows:', surveyStations);
  console.log('WellConstructionSection rows:', constructionSections);
  console.log('CasingString rows:', casings);
  console.log('CementInterval rows:', cements);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

