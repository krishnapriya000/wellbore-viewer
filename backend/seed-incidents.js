const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '..', '..', 'drillwise-all-families.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found:', dataPath);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Seeding ${rawData.length} incident families...`);

  for (const f of rawData) {
    // Check if family already exists
    const familyName = `${f.no}. ${f.name.replace(' incidents', '')}`;
    let family = await prisma.incidentFamily.findFirst({
      where: {
        OR: [
          { name: familyName },
          { name: f.name },
          { name: { contains: f.name.replace(' incidents', '') } }
        ]
      },
    });

    const familyDescription = `Standard operational classification for ${f.name.toLowerCase()}.`;

    if (!family) {
      family = await prisma.incidentFamily.create({
        data: {
          name: familyName,
          description: familyDescription,
        },
      });
      console.log(`Created family: ${family.name}`);
    } else {
      console.log(`Family already exists: ${family.name}`);
    }

    // Now insert incident types for this family
    for (const item of f.items) {
      const typeMetadata = {
        code: `DW-${f.id.toUpperCase()}-${String(f.items.indexOf(item) + 1).padStart(2, '0')}`,
        state: item.s,
        severity: item.sev,
        confidence: item.c,
        evidence: item.ev,
        causes: item.ca,
        recommendedAction: item.ac,
        constraints: item.co,
        escalation: item.es,
        sop: item.sop,
        owner: item.ow,
      };

      const existingType = await prisma.incidentType.findFirst({
        where: {
          familyId: family.id,
          name: item.n,
        },
      });

      if (!existingType) {
        await prisma.incidentType.create({
          data: {
            familyId: family.id,
            name: item.n,
            description: JSON.stringify(typeMetadata),
          },
        });
      } else {
        await prisma.incidentType.update({
          where: { id: existingType.id },
          data: {
            description: JSON.stringify(typeMetadata),
          },
        });
      }
    }
  }

  const countFam = await prisma.incidentFamily.count();
  const countTypes = await prisma.incidentType.count();
  console.log(`\nSeed completed! PostgreSQL now has ${countFam} families and ${countTypes} incident types.`);
}

main()
  .catch((e) => {
    console.error('Error seeding incidents:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
