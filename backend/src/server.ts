import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 5000;

// ============================================
// HEALTH & DB CHECKS
// ============================================

app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "Wellbore Viewer backend is running",
    });
});

app.get("/api/db-check", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            success: true,
            message: "PostgreSQL database connected successfully",
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});

// Helper to find or create default well and laterals
async function ensureDefaultWell() {
    let well = await prisma.well.findFirst({
        include: { laterals: true },
        orderBy: { createdAt: "asc" },
    });

    if (!well) {
        well = await prisma.well.create({
            data: {
                name: "Test Well 01",
                wellCode: "TW-001",
                fieldName: "Demo Field",
                laterals: {
                    create: [
                        { code: "L1", name: "Main Wellbore", type: "MAIN" },
                        { code: "L2", name: "First Branch", type: "BRANCH" },
                        { code: "L3", name: "Second Branch", type: "BRANCH" },
                    ],
                },
            },
            include: { laterals: true },
        });
    } else if (well.laterals.length === 0) {
        await prisma.lateral.createMany({
            data: [
                { wellId: well.id, code: "L1", name: "Main Wellbore", type: "MAIN" },
                { wellId: well.id, code: "L2", name: "First Branch", type: "BRANCH" },
                { wellId: well.id, code: "L3", name: "Second Branch", type: "BRANCH" },
            ],
        });
        well = (await prisma.well.findUnique({
            where: { id: well.id },
            include: { laterals: true },
        }))!;
    }

    return well;
}

// ============================================
// 1. WELL APIs
// ============================================

// Get all wells
app.get("/api/wells", async (_req, res) => {
    try {
        let wells = await prisma.well.findMany({
            include: { laterals: { orderBy: { code: "asc" } } },
            orderBy: { createdAt: "asc" },
        });

        if (wells.length === 0) {
            const defWell = await ensureDefaultWell();
            wells = [defWell];
        }

        res.json({ success: true, data: wells });
    } catch (error) {
        console.error("Error fetching wells:", error);
        res.status(500).json({ success: false, message: "Could not fetch wells" });
    }
});

// Get single well
app.get("/api/wells/:wellId", async (req, res) => {
    try {
        const { wellId } = req.params;
        const well = await prisma.well.findUnique({
            where: { id: wellId },
            include: { laterals: { orderBy: { code: "asc" } } },
        });

        if (!well) {
            res.status(404).json({ success: false, message: "Well not found" });
            return;
        }

        res.json({ success: true, data: well });
    } catch (error) {
        console.error("Error fetching well:", error);
        res.status(500).json({ success: false, message: "Could not fetch well" });
    }
});

// Create well
app.post("/api/wells", async (req, res) => {
    try {
        const { name, wellCode, fieldName, location, description } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            res.status(400).json({ success: false, message: "Well name is required" });
            return;
        }

        const well = await prisma.well.create({
            data: {
                name: name.trim(),
                wellCode: wellCode ? String(wellCode).trim() : null,
                fieldName: fieldName ? String(fieldName).trim() : null,
                location: location ? String(location).trim() : null,
                description: description ? String(description).trim() : null,
                laterals: {
                    create: [
                        { code: "L1", name: "Main Wellbore", type: "MAIN" },
                        { code: "L2", name: "First Branch", type: "BRANCH" },
                        { code: "L3", name: "Second Branch", type: "BRANCH" },
                    ],
                },
            },
            include: { laterals: true },
        });

        res.status(201).json({ success: true, message: "Well created successfully", data: well });
    } catch (error) {
        console.error("Error creating well:", error);
        res.status(500).json({ success: false, message: "Could not create well" });
    }
});

// Update well
app.put("/api/wells/:wellId", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { name, wellCode, fieldName, location, description } = req.body;

        const well = await prisma.well.update({
            where: { id: wellId },
            data: {
                ...(name ? { name: String(name).trim() } : {}),
                ...(wellCode !== undefined ? { wellCode: wellCode ? String(wellCode).trim() : null } : {}),
                ...(fieldName !== undefined ? { fieldName: fieldName ? String(fieldName).trim() : null } : {}),
                ...(location !== undefined ? { location: location ? String(location).trim() : null } : {}),
                ...(description !== undefined ? { description: description ? String(description).trim() : null } : {}),
            },
            include: { laterals: true },
        });

        res.json({ success: true, message: "Well updated successfully", data: well });
    } catch (error) {
        console.error("Error updating well:", error);
        res.status(500).json({ success: false, message: "Could not update well" });
    }
});

// Delete well
app.delete("/api/wells/:wellId", async (req, res) => {
    try {
        const { wellId } = req.params;
        await prisma.well.delete({ where: { id: wellId } });
        res.json({ success: true, message: "Well deleted successfully" });
    } catch (error) {
        console.error("Error deleting well:", error);
        res.status(500).json({ success: false, message: "Could not delete well" });
    }
});

// ============================================
// 2. LATERAL APIs
// ============================================

// Get laterals for a well
app.get("/api/wells/:wellId/laterals", async (req, res) => {
    try {
        const { wellId } = req.params;
        const laterals = await prisma.lateral.findMany({
            where: { wellId },
            orderBy: { code: "asc" },
        });
        res.json({ success: true, data: laterals });
    } catch (error) {
        console.error("Error fetching laterals:", error);
        res.status(500).json({ success: false, message: "Could not fetch laterals" });
    }
});

// Create lateral under a well
app.post("/api/wells/:wellId/laterals", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { code, name, type, kickoffMd } = req.body;

        if (typeof code !== "string" || !code.trim()) {
            res.status(400).json({ success: false, message: "Lateral code is required" });
            return;
        }

        const lateral = await prisma.lateral.upsert({
            where: { wellId_code: { wellId, code: code.trim() } },
            update: {
                name: name ? String(name).trim() : code.trim(),
                type: type === "MAIN" ? "MAIN" : "BRANCH",
                kickoffMd: Number.isFinite(kickoffMd) ? Number(kickoffMd) : null,
            },
            create: {
                wellId,
                code: code.trim(),
                name: name ? String(name).trim() : code.trim(),
                type: type === "MAIN" ? "MAIN" : "BRANCH",
                kickoffMd: Number.isFinite(kickoffMd) ? Number(kickoffMd) : null,
            },
        });

        res.status(201).json({ success: true, message: "Lateral created/updated successfully", data: lateral });
    } catch (error) {
        console.error("Error creating lateral:", error);
        res.status(500).json({ success: false, message: "Could not create lateral" });
    }
});

// ============================================
// 3. SURVEY APIs (PLAN, ACTUAL, LIVE)
// ============================================

// Get all surveys (with stations) for a well
app.get("/api/wells/:wellId/surveys", async (req, res) => {
    try {
        const { wellId } = req.params;
        const laterals = await prisma.lateral.findMany({
            where: { wellId },
            include: {
                surveys: {
                    where: { isActive: true },
                    include: {
                        stations: { orderBy: { measuredDepth: "asc" } },
                    },
                },
            },
            orderBy: { code: "asc" },
        });

        res.json({ success: true, data: laterals });
    } catch (error) {
        console.error("Error fetching surveys:", error);
        res.status(500).json({ success: false, message: "Could not fetch surveys" });
    }
});

// Upload Plan or Actual survey (can handle multiple wells/laterals at once)
app.post("/api/wells/:wellId/surveys/upload", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { type, sourceFile, surveys } = req.body as {
            type: "PLAN" | "ACTUAL";
            sourceFile?: string;
            surveys: Record<string, { md: number; inc: number; azi: number; n?: number; e?: number; tvd?: number; dls?: number }[]>;
        };

        if (type !== "PLAN" && type !== "ACTUAL") {
            res.status(400).json({ success: false, message: "Survey type must be PLAN or ACTUAL" });
            return;
        }

        if (!surveys || typeof surveys !== "object" || Object.keys(surveys).length === 0) {
            res.status(400).json({ success: false, message: "No survey data provided" });
            return;
        }

        const well = await prisma.well.findUnique({
            where: { id: wellId },
            include: { laterals: true },
        });

        if (!well) {
            res.status(404).json({ success: false, message: "Well not found" });
            return;
        }

        const results = await prisma.$transaction(async (tx) => {
            const savedSurveys = [];

            for (const [lateralCode, stations] of Object.entries(surveys)) {
                if (!Array.isArray(stations) || stations.length === 0) continue;

                // Find or create lateral
                let lateral = well.laterals.find((l) => l.code === lateralCode);
                if (!lateral) {
                    lateral = await tx.lateral.create({
                        data: {
                            wellId,
                            code: lateralCode,
                            name: `Lateral ${lateralCode}`,
                            type: lateralCode === "L1" ? "MAIN" : "BRANCH",
                        },
                    });
                }

                // Deactivate previous surveys of this type
                await tx.surveyRun.updateMany({
                    where: { lateralId: lateral.id, type, isActive: true },
                    data: { isActive: false },
                });

                // Deduplicate stations by md
                const seenMd = new Set<number>();
                const cleanStations = [];
                for (const st of stations) {
                    if (!Number.isFinite(st.md) || !Number.isFinite(st.inc) || !Number.isFinite(st.azi)) continue;
                    if (seenMd.has(st.md)) continue;
                    seenMd.add(st.md);
                    cleanStations.push({
                        measuredDepth: st.md,
                        inclination: st.inc,
                        azimuth: st.azi,
                        northing: Number.isFinite(st.n) ? st.n : null,
                        easting: Number.isFinite(st.e) ? st.e : null,
                        tvd: Number.isFinite(st.tvd) ? st.tvd : null,
                        doglegSeverity: Number.isFinite(st.dls) ? st.dls : null,
                    });
                }

                cleanStations.sort((a, b) => a.measuredDepth - b.measuredDepth);

                const newRun = await tx.surveyRun.create({
                    data: {
                        lateralId: lateral.id,
                        type,
                        name: `${lateralCode} ${type} Survey`,
                        sourceFile: sourceFile || null,
                        isActive: true,
                        stations: {
                            create: cleanStations,
                        },
                    },
                    include: {
                        stations: { orderBy: { measuredDepth: "asc" } },
                    },
                });

                savedSurveys.push({ lateralCode, run: newRun });
            }

            return savedSurveys;
        });

        res.status(201).json({
            success: true,
            message: `${type} surveys saved to PostgreSQL successfully`,
            data: results,
        });
    } catch (error) {
        console.error("Error uploading surveys:", error);
        res.status(500).json({ success: false, message: "Could not save surveys" });
    }
});

// Add live survey station to a well's lateral
app.post("/api/wells/:wellId/surveys/live", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { lateralCode, measuredDepth, inclination, azimuth, northing, easting, tvd, doglegSeverity } = req.body;

        if (!lateralCode || !Number.isFinite(measuredDepth) || !Number.isFinite(inclination) || !Number.isFinite(azimuth)) {
            res.status(400).json({ success: false, message: "Valid lateralCode, measuredDepth, inclination, and azimuth are required" });
            return;
        }

        // Find or create lateral
        let lateral = await prisma.lateral.findUnique({
            where: { wellId_code: { wellId, code: String(lateralCode) } },
        });

        if (!lateral) {
            lateral = await prisma.lateral.create({
                data: {
                    wellId,
                    code: String(lateralCode),
                    name: `Lateral ${lateralCode}`,
                    type: lateralCode === "L1" ? "MAIN" : "BRANCH",
                },
            });
        }

        // Find or create active ACTUAL survey run
        let surveyRun = await prisma.surveyRun.findFirst({
            where: { lateralId: lateral.id, type: "ACTUAL", isActive: true },
        });

        if (!surveyRun) {
            surveyRun = await prisma.surveyRun.create({
                data: {
                    lateralId: lateral.id,
                    type: "ACTUAL",
                    name: `${lateralCode} Live Actual Survey`,
                    isActive: true,
                },
            });
        }

        // Upsert station by surveyRunId + measuredDepth
        const station = await prisma.surveyStation.upsert({
            where: {
                surveyRunId_measuredDepth: {
                    surveyRunId: surveyRun.id,
                    measuredDepth: Number(measuredDepth),
                },
            },
            update: {
                inclination: Number(inclination),
                azimuth: Number(azimuth),
                northing: Number.isFinite(northing) ? Number(northing) : null,
                easting: Number.isFinite(easting) ? Number(easting) : null,
                tvd: Number.isFinite(tvd) ? Number(tvd) : null,
                doglegSeverity: Number.isFinite(doglegSeverity) ? Number(doglegSeverity) : null,
            },
            create: {
                surveyRunId: surveyRun.id,
                measuredDepth: Number(measuredDepth),
                inclination: Number(inclination),
                azimuth: Number(azimuth),
                northing: Number.isFinite(northing) ? Number(northing) : null,
                easting: Number.isFinite(easting) ? Number(easting) : null,
                tvd: Number.isFinite(tvd) ? Number(tvd) : null,
                doglegSeverity: Number.isFinite(doglegSeverity) ? Number(doglegSeverity) : null,
            },
        });

        res.status(201).json({
            success: true,
            message: "Live survey station saved to PostgreSQL",
            data: station,
        });
    } catch (error) {
        console.error("Error saving live survey:", error);
        res.status(500).json({ success: false, message: "Could not save live survey" });
    }
});

// ============================================
// 4. FORMATIONS & LITHOLOGY APIs
// ============================================

// Get all formations and lithologies for a well
app.get("/api/wells/:wellId/formations", async (req, res) => {
    try {
        const { wellId } = req.params;
        const formations = await prisma.formationInterval.findMany({
            where: { wellId },
            include: {
                lithologies: true,
                lateral: true,
            },
            orderBy: { topMd: "asc" },
        });

        res.json({ success: true, data: formations });
    } catch (error) {
        console.error("Error fetching formations:", error);
        res.status(500).json({ success: false, message: "Could not fetch formations" });
    }
});

// Create formation with lithology percentages
app.post("/api/wells/:wellId/formations", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { name, ref, well: wellName, from, to, color, description, comp } = req.body;

        if (!name || !Number.isFinite(from) || !Number.isFinite(to)) {
            res.status(400).json({ success: false, message: "Formation name, from depth, and to depth are required" });
            return;
        }

        // Find lateral if wellName is a lateral code
        let lateralId: string | null = null;
        if (wellName && wellName !== "All") {
            const lat = await prisma.lateral.findUnique({
                where: { wellId_code: { wellId, code: String(wellName) } },
            });
            if (lat) lateralId = lat.id;
        }

        const compList = Array.isArray(comp) && comp.length > 0 ? comp : [{ lith: "shale", pct: 100 }];

        const formation = await prisma.formationInterval.create({
            data: {
                wellId,
                lateralId,
                name: String(name).trim(),
                ref: ref === "MD" ? "MD" : "TVD",
                topMd: Number(from),
                baseMd: Number(to),
                color: color || null,
                description: description || null,
                lithologies: {
                    create: compList.map((c: { lith: string; pct: number }) => ({
                        name: c.lith,
                        topMd: Number(from),
                        baseMd: Number(to),
                        percentage: Number(c.pct) || 0,
                        color: color || null,
                    })),
                },
            },
            include: { lithologies: true },
        });

        res.status(201).json({ success: true, message: "Formation created successfully", data: formation });
    } catch (error) {
        console.error("Error creating formation:", error);
        res.status(500).json({ success: false, message: "Could not create formation" });
    }
});

// Update formation
app.put("/api/wells/:wellId/formations/:id", async (req, res) => {
    try {
        const { wellId, id } = req.params;
        const { name, ref, well: wellName, from, to, color, description, comp } = req.body;

        let lateralId: string | null = null;
        if (wellName && wellName !== "All") {
            const lat = await prisma.lateral.findUnique({
                where: { wellId_code: { wellId, code: String(wellName) } },
            });
            if (lat) lateralId = lat.id;
        }

        const compList = Array.isArray(comp) && comp.length > 0 ? comp : [{ lith: "shale", pct: 100 }];

        // Transaction to update formation and replace its lithologies
        const updated = await prisma.$transaction(async (tx) => {
            await tx.lithologyInterval.deleteMany({ where: { formationId: id } });

            return tx.formationInterval.update({
                where: { id },
                data: {
                    name: name ? String(name).trim() : undefined,
                    ref: ref ? (ref === "MD" ? "MD" : "TVD") : undefined,
                    topMd: Number.isFinite(from) ? Number(from) : undefined,
                    baseMd: Number.isFinite(to) ? Number(to) : undefined,
                    lateralId,
                    color: color || null,
                    description: description || null,
                    lithologies: {
                        create: compList.map((c: { lith: string; pct: number }) => ({
                            name: c.lith,
                            topMd: Number.isFinite(from) ? Number(from) : 0,
                            baseMd: Number.isFinite(to) ? Number(to) : 0,
                            percentage: Number(c.pct) || 0,
                            color: color || null,
                        })),
                    },
                },
                include: { lithologies: true },
            });
        });

        res.json({ success: true, message: "Formation updated successfully", data: updated });
    } catch (error) {
        console.error("Error updating formation:", error);
        res.status(500).json({ success: false, message: "Could not update formation" });
    }
});

// Delete formation
app.delete("/api/wells/:wellId/formations/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.formationInterval.delete({ where: { id } });
        res.json({ success: true, message: "Formation deleted successfully" });
    } catch (error) {
        console.error("Error deleting formation:", error);
        res.status(500).json({ success: false, message: "Could not delete formation" });
    }
});

// Batch save formations (e.g. for reset to sample or sync)
app.post("/api/wells/:wellId/formations/batch", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { formations } = req.body as {
            formations: { id?: string; name: string; ref: string; well: string; from: number; to: number; comp: { lith: string; pct: number }[]; color?: string }[];
        };

        if (!Array.isArray(formations)) {
            res.status(400).json({ success: false, message: "Formations array is required" });
            return;
        }

        const laterals = await prisma.lateral.findMany({ where: { wellId } });
        const lateralMap = new Map(laterals.map((l) => [l.code, l.id]));

        await prisma.$transaction(async (tx) => {
            // Clear existing formations for this well
            await tx.formationInterval.deleteMany({ where: { wellId } });

            for (const f of formations) {
                const lateralId = f.well && f.well !== "All" ? lateralMap.get(f.well) || null : null;
                const compList = Array.isArray(f.comp) && f.comp.length > 0 ? f.comp : [{ lith: "shale", pct: 100 }];

                await tx.formationInterval.create({
                    data: {
                        wellId,
                        lateralId,
                        name: f.name,
                        ref: f.ref === "MD" ? "MD" : "TVD",
                        topMd: f.from,
                        baseMd: f.to,
                        color: f.color || null,
                        lithologies: {
                            create: compList.map((c) => ({
                                name: c.lith,
                                topMd: f.from,
                                baseMd: f.to,
                                percentage: c.pct,
                                color: f.color || null,
                            })),
                        },
                    },
                });
            }
        });

        const refreshed = await prisma.formationInterval.findMany({
            where: { wellId },
            include: { lithologies: true },
            orderBy: { topMd: "asc" },
        });

        res.json({ success: true, message: "Formations synced to PostgreSQL", data: refreshed });
    } catch (error) {
        console.error("Error batch saving formations:", error);
        res.status(500).json({ success: false, message: "Could not save formations" });
    }
});

// ============================================
// 5. ENGINEERING EVENTS APIs
// ============================================

// Get all engineering events for a well
app.get("/api/wells/:wellId/engineering-events", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { lateralCode } = req.query;

        let lateralId: string | undefined = undefined;
        if (lateralCode && lateralCode !== "All") {
            const lat = await prisma.lateral.findUnique({
                where: { wellId_code: { wellId, code: String(lateralCode) } },
            });
            if (lat) lateralId = lat.id;
        }

        const events = await prisma.engineeringEvent.findMany({
            where: {
                wellId,
                ...(lateralId ? { lateralId } : {}),
            },
            include: { lateral: true },
            orderBy: { measuredDepth: "asc" },
        });

        res.json({ success: true, data: events });
    } catch (error) {
        console.error("Error fetching engineering events:", error);
        res.status(500).json({ success: false, message: "Could not fetch engineering events" });
    }
});

// Create engineering event
app.post("/api/wells/:wellId/engineering-events", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { eventName, eventType, measuredDepth, eventDate, description, lateralCode } = req.body;

        if (!eventType || !Number.isFinite(measuredDepth)) {
            res.status(400).json({ success: false, message: "Event type and measured depth are required" });
            return;
        }

        let lateralId: string | null = null;
        if (lateralCode && lateralCode !== "All") {
            const lat = await prisma.lateral.findUnique({
                where: { wellId_code: { wellId, code: String(lateralCode) } },
            });
            if (lat) lateralId = lat.id;
        }

        const event = await prisma.engineeringEvent.create({
            data: {
                wellId,
                lateralId,
                eventName: eventName ? String(eventName).trim() : String(eventType),
                eventType: String(eventType).trim(),
                measuredDepth: Number(measuredDepth),
                eventDate: eventDate ? new Date(eventDate) : new Date(),
                description: description ? String(description).trim() : null,
            },
            include: { lateral: true },
        });

        res.status(201).json({ success: true, message: "Engineering event created successfully", data: event });
    } catch (error) {
        console.error("Error creating engineering event:", error);
        res.status(500).json({ success: false, message: "Could not create engineering event" });
    }
});

// Update engineering event
app.put("/api/wells/:wellId/engineering-events/:id", async (req, res) => {
    try {
        const { wellId, id } = req.params;
        const { eventName, eventType, measuredDepth, eventDate, description, lateralCode } = req.body;

        let lateralId: string | null | undefined = undefined;
        if (lateralCode !== undefined) {
            if (lateralCode && lateralCode !== "All") {
                const lat = await prisma.lateral.findUnique({
                    where: { wellId_code: { wellId, code: String(lateralCode) } },
                });
                lateralId = lat ? lat.id : null;
            } else {
                lateralId = null;
            }
        }

        const event = await prisma.engineeringEvent.update({
            where: { id },
            data: {
                ...(eventName !== undefined ? { eventName: String(eventName).trim() } : {}),
                ...(eventType !== undefined ? { eventType: String(eventType).trim() } : {}),
                ...(Number.isFinite(measuredDepth) ? { measuredDepth: Number(measuredDepth) } : {}),
                ...(eventDate !== undefined ? { eventDate: eventDate ? new Date(eventDate) : null } : {}),
                ...(description !== undefined ? { description: description ? String(description).trim() : null } : {}),
                ...(lateralId !== undefined ? { lateralId } : {}),
            },
            include: { lateral: true },
        });

        res.json({ success: true, message: "Engineering event updated successfully", data: event });
    } catch (error) {
        console.error("Error updating engineering event:", error);
        res.status(500).json({ success: false, message: "Could not update engineering event" });
    }
});

// Delete engineering event
app.delete("/api/wells/:wellId/engineering-events/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.engineeringEvent.delete({ where: { id } });
        res.json({ success: true, message: "Engineering event deleted successfully" });
    } catch (error) {
        console.error("Error deleting engineering event:", error);
        res.status(500).json({ success: false, message: "Could not delete engineering event" });
    }
});

// Batch save engineering events (e.g. for reset to sample)
app.post("/api/wells/:wellId/engineering-events/batch", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { events } = req.body as {
            events: { well: string; md: number; type: string; note?: string }[];
        };

        if (!Array.isArray(events)) {
            res.status(400).json({ success: false, message: "Events array is required" });
            return;
        }

        const laterals = await prisma.lateral.findMany({ where: { wellId } });
        const lateralMap = new Map(laterals.map((l) => [l.code, l.id]));

        await prisma.$transaction(async (tx) => {
            await tx.engineeringEvent.deleteMany({ where: { wellId } });

            for (const ev of events) {
                const lateralId = ev.well && ev.well !== "All" ? lateralMap.get(ev.well) || null : null;
                await tx.engineeringEvent.create({
                    data: {
                        wellId,
                        lateralId,
                        eventName: ev.type,
                        eventType: ev.type,
                        measuredDepth: ev.md,
                        description: ev.note || null,
                    },
                });
            }
        });

        const refreshed = await prisma.engineeringEvent.findMany({
            where: { wellId },
            include: { lateral: true },
            orderBy: { measuredDepth: "asc" },
        });

        res.json({ success: true, message: "Events synced to PostgreSQL", data: refreshed });
    } catch (error) {
        console.error("Error batch saving events:", error);
        res.status(500).json({ success: false, message: "Could not batch save events" });
    }
});

// ============================================
// 6. WELL CONSTRUCTION (HOLE, CASING, CEMENT) & SCHEMATIC APIs
// ============================================

// Get all construction items for a well
app.get("/api/wells/:wellId/construction", async (req, res) => {
    try {
        const { wellId } = req.params;
        const [holes, casings, cements] = await Promise.all([
            prisma.wellConstructionSection.findMany({
                where: { wellId },
                include: { lateral: true },
                orderBy: { topMd: "asc" },
            }),
            prisma.casingString.findMany({
                where: { wellId },
                include: { lateral: true },
                orderBy: { topMd: "asc" },
            }),
            prisma.cementInterval.findMany({
                where: { wellId },
                include: { lateral: true },
                orderBy: { topMd: "asc" },
            }),
        ]);

        // Transform into unified ConstructionItem format
        const items = [
            ...holes.map((h) => ({
                id: h.id,
                kind: "hole" as const,
                well: h.lateral?.code || "All",
                from: h.topMd,
                to: h.baseMd,
                size: h.holeSize || 0,
                note: h.description || h.sectionName,
            })),
            ...casings.map((c) => ({
                id: c.id,
                kind: "casing" as const,
                well: c.lateral?.code || "All",
                from: c.topMd,
                to: c.shoeMd,
                size: c.outerDiameter || 0,
                note: c.description || c.casingName,
            })),
            ...cements.map((m) => ({
                id: m.id,
                kind: "cement" as const,
                well: m.lateral?.code || "All",
                from: m.topMd,
                to: m.baseMd,
                size: m.casingSize || 0,
                note: m.description || m.name,
            })),
        ];

        // Sort items by from depth
        items.sort((a, b) => a.from - b.from);

        res.json({ success: true, data: items });
    } catch (error) {
        console.error("Error fetching construction items:", error);
        res.status(500).json({ success: false, message: "Could not fetch construction items" });
    }
});

// Create construction item
app.post("/api/wells/:wellId/construction", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { kind, well: wellName, from, to, size, note } = req.body;

        if (!kind || !Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(size)) {
            res.status(400).json({ success: false, message: "Kind, from, to, and size are required" });
            return;
        }

        let lateralId: string | null = null;
        if (wellName && wellName !== "All") {
            const lat = await prisma.lateral.findUnique({
                where: { wellId_code: { wellId, code: String(wellName) } },
            });
            if (lat) lateralId = lat.id;
        }

        let result;
        if (kind === "hole") {
            const hole = await prisma.wellConstructionSection.create({
                data: {
                    wellId,
                    lateralId,
                    sectionName: note || `${size}" Hole (${from}-${to} ft)`,
                    topMd: Number(from),
                    baseMd: Number(to),
                    holeSize: Number(size),
                    description: note || null,
                },
            });
            result = {
                id: hole.id,
                kind: "hole",
                well: wellName || "All",
                from: hole.topMd,
                to: hole.baseMd,
                size: hole.holeSize,
                note: hole.description,
            };
        } else if (kind === "casing") {
            const casing = await prisma.casingString.create({
                data: {
                    wellId,
                    lateralId,
                    casingName: note || `${size}" Casing (${from}-${to} ft)`,
                    topMd: Number(from),
                    shoeMd: Number(to),
                    outerDiameter: Number(size),
                    description: note || null,
                },
            });
            result = {
                id: casing.id,
                kind: "casing",
                well: wellName || "All",
                from: casing.topMd,
                to: casing.shoeMd,
                size: casing.outerDiameter,
                note: casing.description,
            };
        } else if (kind === "cement") {
            const cement = await prisma.cementInterval.create({
                data: {
                    wellId,
                    lateralId,
                    name: note || `${size}" Cement (${from}-${to} ft)`,
                    topMd: Number(from),
                    baseMd: Number(to),
                    casingSize: Number(size),
                    description: note || null,
                },
            });
            result = {
                id: cement.id,
                kind: "cement",
                well: wellName || "All",
                from: cement.topMd,
                to: cement.baseMd,
                size: cement.casingSize,
                note: cement.description,
            };
        } else {
            res.status(400).json({ success: false, message: "Invalid construction kind" });
            return;
        }

        res.status(201).json({ success: true, message: "Construction item created successfully", data: result });
    } catch (error) {
        console.error("Error creating construction item:", error);
        res.status(500).json({ success: false, message: "Could not create construction item" });
    }
});

// Update construction item
app.put("/api/wells/:wellId/construction/:id", async (req, res) => {
    try {
        const { wellId, id } = req.params;
        const { kind, well: wellName, from, to, size, note } = req.body;

        let lateralId: string | null = null;
        if (wellName && wellName !== "All") {
            const lat = await prisma.lateral.findUnique({
                where: { wellId_code: { wellId, code: String(wellName) } },
            });
            if (lat) lateralId = lat.id;
        }

        let result;
        if (kind === "hole") {
            const hole = await prisma.wellConstructionSection.update({
                where: { id },
                data: {
                    lateralId,
                    sectionName: note || undefined,
                    topMd: Number.isFinite(from) ? Number(from) : undefined,
                    baseMd: Number.isFinite(to) ? Number(to) : undefined,
                    holeSize: Number.isFinite(size) ? Number(size) : undefined,
                    description: note !== undefined ? note : undefined,
                },
            });
            result = { id: hole.id, kind: "hole", well: wellName || "All", from: hole.topMd, to: hole.baseMd, size: hole.holeSize, note: hole.description };
        } else if (kind === "casing") {
            const casing = await prisma.casingString.update({
                where: { id },
                data: {
                    lateralId,
                    casingName: note || undefined,
                    topMd: Number.isFinite(from) ? Number(from) : undefined,
                    shoeMd: Number.isFinite(to) ? Number(to) : undefined,
                    outerDiameter: Number.isFinite(size) ? Number(size) : undefined,
                    description: note !== undefined ? note : undefined,
                },
            });
            result = { id: casing.id, kind: "casing", well: wellName || "All", from: casing.topMd, to: casing.shoeMd, size: casing.outerDiameter, note: casing.description };
        } else if (kind === "cement") {
            const cement = await prisma.cementInterval.update({
                where: { id },
                data: {
                    lateralId,
                    name: note || undefined,
                    topMd: Number.isFinite(from) ? Number(from) : undefined,
                    baseMd: Number.isFinite(to) ? Number(to) : undefined,
                    casingSize: Number.isFinite(size) ? Number(size) : undefined,
                    description: note !== undefined ? note : undefined,
                },
            });
            result = { id: cement.id, kind: "cement", well: wellName || "All", from: cement.topMd, to: cement.baseMd, size: cement.casingSize, note: cement.description };
        } else {
            res.status(400).json({ success: false, message: "Invalid construction kind" });
            return;
        }

        res.json({ success: true, message: "Construction item updated successfully", data: result });
    } catch (error) {
        console.error("Error updating construction item:", error);
        res.status(500).json({ success: false, message: "Could not update construction item" });
    }
});

// Delete construction item
app.delete("/api/wells/:wellId/construction/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { kind } = req.query;

        if (kind === "hole") {
            await prisma.wellConstructionSection.delete({ where: { id } });
        } else if (kind === "casing") {
            await prisma.casingString.delete({ where: { id } });
        } else if (kind === "cement") {
            await prisma.cementInterval.delete({ where: { id } });
        } else {
            try {
                await prisma.wellConstructionSection.delete({ where: { id } });
            } catch {
                try {
                    await prisma.casingString.delete({ where: { id } });
                } catch {
                    await prisma.cementInterval.delete({ where: { id } });
                }
            }
        }

        res.json({ success: true, message: "Construction item deleted successfully" });
    } catch (error) {
        console.error("Error deleting construction item:", error);
        res.status(500).json({ success: false, message: "Could not delete construction item" });
    }
});

// Batch save construction items (e.g. for reset to sample)
app.post("/api/wells/:wellId/construction/batch", async (req, res) => {
    try {
        const { wellId } = req.params;
        const { items } = req.body as {
            items: { kind: "hole" | "casing" | "cement"; well: string; from: number; to: number; size: number; note?: string }[];
        };

        if (!Array.isArray(items)) {
            res.status(400).json({ success: false, message: "Items array is required" });
            return;
        }

        const laterals = await prisma.lateral.findMany({ where: { wellId } });
        const lateralMap = new Map(laterals.map((l) => [l.code, l.id]));

        await prisma.$transaction(async (tx) => {
            await tx.wellConstructionSection.deleteMany({ where: { wellId } });
            await tx.casingString.deleteMany({ where: { wellId } });
            await tx.cementInterval.deleteMany({ where: { wellId } });

            for (const it of items) {
                const lateralId = it.well && it.well !== "All" ? lateralMap.get(it.well) || null : null;
                if (it.kind === "hole") {
                    await tx.wellConstructionSection.create({
                        data: {
                            wellId,
                            lateralId,
                            sectionName: it.note || `${it.size}" Hole`,
                            topMd: it.from,
                            baseMd: it.to,
                            holeSize: it.size,
                            description: it.note || null,
                        },
                    });
                } else if (it.kind === "casing") {
                    await tx.casingString.create({
                        data: {
                            wellId,
                            lateralId,
                            casingName: it.note || `${it.size}" Casing`,
                            topMd: it.from,
                            shoeMd: it.to,
                            outerDiameter: it.size,
                            description: it.note || null,
                        },
                    });
                } else if (it.kind === "cement") {
                    await tx.cementInterval.create({
                        data: {
                            wellId,
                            lateralId,
                            name: it.note || `${it.size}" Cement`,
                            topMd: it.from,
                            baseMd: it.to,
                            casingSize: it.size,
                            description: it.note || null,
                        },
                    });
                }
            }
        });

        res.json({ success: true, message: "Construction items synced to PostgreSQL" });
    } catch (error) {
        console.error("Error batch saving construction items:", error);
        res.status(500).json({ success: false, message: "Could not save construction items" });
    }
});

// ============================================
// 7. WELL PLANNING APIs
// ============================================

// Helper validator for WellPlan
function validateWellPlanPayload(data: {
    wellId?: unknown;
    targetDepthMD?: unknown;
    targetDepthTVD?: unknown;
    targetInclination?: unknown;
    targetAzimuth?: unknown;
    plannedKickoffDepth?: unknown;
    targetObjective?: unknown;
}): { valid: boolean; error?: string } {
    if (!data.wellId || typeof data.wellId !== "string" || !data.wellId.trim()) {
        return { valid: false, error: "wellId is required" };
    }
    if (typeof data.targetObjective !== "string" || !data.targetObjective.trim()) {
        return { valid: false, error: "targetObjective is required" };
    }
    const md = Number(data.targetDepthMD);
    if (isNaN(md) || md <= 0) {
        return { valid: false, error: "targetDepthMD must be a positive number (> 0)" };
    }
    const tvd = Number(data.targetDepthTVD);
    if (isNaN(tvd) || tvd <= 0) {
        return { valid: false, error: "targetDepthTVD must be a positive number (> 0)" };
    }
    if (tvd > md) {
        return { valid: false, error: "targetDepthTVD cannot exceed targetDepthMD (TVD <= MD)" };
    }
    const kop = Number(data.plannedKickoffDepth);
    if (isNaN(kop) || kop < 0) {
        return { valid: false, error: "plannedKickoffDepth must be 0 or greater" };
    }
    if (kop > md) {
        return { valid: false, error: "plannedKickoffDepth cannot exceed targetDepthMD" };
    }
    const inc = Number(data.targetInclination);
    if (isNaN(inc) || inc < 0 || inc > 180) {
        return { valid: false, error: "targetInclination must be between 0 and 180 degrees" };
    }
    const azi = Number(data.targetAzimuth);
    if (isNaN(azi) || azi < 0 || azi > 360) {
        return { valid: false, error: "targetAzimuth must be between 0 and 360 degrees" };
    }
    return { valid: true };
}

// GET all well plans (optionally filtered by ?wellId=...)
app.get("/api/well-plans", async (req, res) => {
    try {
        const { wellId } = req.query;
        const whereClause = wellId && typeof wellId === "string" ? { wellId } : {};
        const plans = await prisma.wellPlan.findMany({
            where: whereClause,
            include: { well: { select: { id: true, name: true, wellCode: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error("Error fetching well plans:", error);
        res.status(500).json({ success: false, message: "Could not fetch well plans" });
    }
});

// GET /api/wells/:wellId/well-plans
app.get("/api/wells/:wellId/well-plans", async (req, res) => {
    try {
        const { wellId } = req.params;
        const plans = await prisma.wellPlan.findMany({
            where: { wellId },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error("Error fetching well plans for well:", error);
        res.status(500).json({ success: false, message: "Could not fetch well plans" });
    }
});

// GET single well plan by ID
app.get("/api/well-plans/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await prisma.wellPlan.findUnique({
            where: { id },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
        });
        if (!plan) {
            res.status(404).json({ success: false, message: "Well plan not found" });
            return;
        }
        res.json({ success: true, data: plan });
    } catch (error) {
        console.error("Error fetching well plan:", error);
        res.status(500).json({ success: false, message: "Could not fetch well plan" });
    }
});

// POST create well plan
app.post("/api/well-plans", async (req, res) => {
    try {
        const validation = validateWellPlanPayload(req.body);
        if (!validation.valid) {
            res.status(400).json({ success: false, message: validation.error });
            return;
        }

        const {
            wellId,
            targetDepthMD,
            targetDepthTVD,
            targetInclination,
            targetAzimuth,
            plannedKickoffDepth,
            targetObjective,
            remarks,
        } = req.body;

        const wellExists = await prisma.well.findUnique({ where: { id: wellId } });
        if (!wellExists) {
            res.status(404).json({ success: false, message: `Well with id "${wellId}" not found` });
            return;
        }

        const created = await prisma.wellPlan.create({
            data: {
                wellId,
                targetDepthMD: Number(targetDepthMD),
                targetDepthTVD: Number(targetDepthTVD),
                targetInclination: Number(targetInclination),
                targetAzimuth: Number(targetAzimuth),
                plannedKickoffDepth: Number(plannedKickoffDepth),
                targetObjective: targetObjective.trim(),
                remarks: remarks && typeof remarks === "string" ? remarks.trim() : null,
            },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
        });

        res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error("Error creating well plan:", error);
        res.status(500).json({ success: false, message: "Could not create well plan" });
    }
});

// POST /api/wells/:wellId/well-plans
app.post("/api/wells/:wellId/well-plans", async (req, res) => {
    try {
        const payload = { ...req.body, wellId: req.params.wellId };
        const validation = validateWellPlanPayload(payload);
        if (!validation.valid) {
            res.status(400).json({ success: false, message: validation.error });
            return;
        }

        const wellExists = await prisma.well.findUnique({ where: { id: req.params.wellId } });
        if (!wellExists) {
            res.status(404).json({ success: false, message: `Well with id "${req.params.wellId}" not found` });
            return;
        }

        const created = await prisma.wellPlan.create({
            data: {
                wellId: req.params.wellId,
                targetDepthMD: Number(payload.targetDepthMD),
                targetDepthTVD: Number(payload.targetDepthTVD),
                targetInclination: Number(payload.targetInclination),
                targetAzimuth: Number(payload.targetAzimuth),
                plannedKickoffDepth: Number(payload.plannedKickoffDepth),
                targetObjective: payload.targetObjective.trim(),
                remarks: payload.remarks && typeof payload.remarks === "string" ? payload.remarks.trim() : null,
            },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
        });

        res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error("Error creating well plan:", error);
        res.status(500).json({ success: false, message: "Could not create well plan" });
    }
});

// PUT update well plan by ID
app.put("/api/well-plans/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.wellPlan.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: "Well plan not found" });
            return;
        }

        const merged = {
            wellId: req.body.wellId ?? existing.wellId,
            targetDepthMD: req.body.targetDepthMD ?? existing.targetDepthMD,
            targetDepthTVD: req.body.targetDepthTVD ?? existing.targetDepthTVD,
            targetInclination: req.body.targetInclination ?? existing.targetInclination,
            targetAzimuth: req.body.targetAzimuth ?? existing.targetAzimuth,
            plannedKickoffDepth: req.body.plannedKickoffDepth ?? existing.plannedKickoffDepth,
            targetObjective: req.body.targetObjective ?? existing.targetObjective,
        };

        const validation = validateWellPlanPayload(merged);
        if (!validation.valid) {
            res.status(400).json({ success: false, message: validation.error });
            return;
        }

        const updated = await prisma.wellPlan.update({
            where: { id },
            data: {
                wellId: merged.wellId,
                targetDepthMD: Number(merged.targetDepthMD),
                targetDepthTVD: Number(merged.targetDepthTVD),
                targetInclination: Number(merged.targetInclination),
                targetAzimuth: Number(merged.targetAzimuth),
                plannedKickoffDepth: Number(merged.plannedKickoffDepth),
                targetObjective: merged.targetObjective.trim(),
                remarks: req.body.remarks !== undefined
                    ? (req.body.remarks ? String(req.body.remarks).trim() : null)
                    : existing.remarks,
            },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating well plan:", error);
        res.status(500).json({ success: false, message: "Could not update well plan" });
    }
});

// DELETE well plan by ID
app.delete("/api/well-plans/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.wellPlan.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: "Well plan not found" });
            return;
        }

        await prisma.wellPlan.delete({ where: { id } });
        res.json({ success: true, message: "Well plan deleted successfully" });
    } catch (error) {
        console.error("Error deleting well plan:", error);
        res.status(500).json({ success: false, message: "Could not delete well plan" });
    }
});

// ============================================
// 8. MUD PLANNING APIs
// ============================================

// Helper validator for MudPlan
function validateMudPlanPayload(data: {
    wellId?: unknown;
    mudType?: unknown;
    mudWeight?: unknown;
    plasticViscosity?: unknown;
    yieldPoint?: unknown;
    fluidLoss?: unknown;
}): { valid: boolean; error?: string } {
    if (!data.wellId || typeof data.wellId !== "string" || !data.wellId.trim()) {
        return { valid: false, error: "wellId is required" };
    }
    if (typeof data.mudType !== "string" || !data.mudType.trim()) {
        return { valid: false, error: "mudType is required" };
    }
    const mw = Number(data.mudWeight);
    if (isNaN(mw) || mw <= 0 || mw > 25) {
        return { valid: false, error: "mudWeight must be between 0.1 and 25.0 ppg" };
    }
    const pv = Number(data.plasticViscosity);
    if (isNaN(pv) || pv < 0 || pv > 150) {
        return { valid: false, error: "plasticViscosity must be between 0 and 150 cP" };
    }
    const yp = Number(data.yieldPoint);
    if (isNaN(yp) || yp < 0 || yp > 120) {
        return { valid: false, error: "yieldPoint must be between 0 and 120 lb/100ft²" };
    }
    const fl = Number(data.fluidLoss);
    if (isNaN(fl) || fl < 0 || fl > 100) {
        return { valid: false, error: "fluidLoss must be between 0 and 100 mL/30min" };
    }
    return { valid: true };
}

// GET all mud plans (optionally filtered by ?wellId=...)
app.get("/api/mud-plans", async (req, res) => {
    try {
        const { wellId } = req.query;
        const whereClause = wellId && typeof wellId === "string" ? { wellId } : {};
        const plans = await prisma.mudPlan.findMany({
            where: whereClause,
            include: { well: { select: { id: true, name: true, wellCode: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error("Error fetching mud plans:", error);
        res.status(500).json({ success: false, message: "Could not fetch mud plans" });
    }
});

// GET /api/wells/:wellId/mud-plans
app.get("/api/wells/:wellId/mud-plans", async (req, res) => {
    try {
        const { wellId } = req.params;
        const plans = await prisma.mudPlan.findMany({
            where: { wellId },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error("Error fetching mud plans for well:", error);
        res.status(500).json({ success: false, message: "Could not fetch mud plans" });
    }
});

// GET single mud plan by ID
app.get("/api/mud-plans/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await prisma.mudPlan.findUnique({
            where: { id },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
        });
        if (!plan) {
            res.status(404).json({ success: false, message: "Mud plan not found" });
            return;
        }
        res.json({ success: true, data: plan });
    } catch (error) {
        console.error("Error fetching mud plan:", error);
        res.status(500).json({ success: false, message: "Could not fetch mud plan" });
    }
});

// POST create mud plan
app.post("/api/mud-plans", async (req, res) => {
    try {
        const validation = validateMudPlanPayload(req.body);
        if (!validation.valid) {
            res.status(400).json({ success: false, message: validation.error });
            return;
        }

        const {
            wellId,
            mudType,
            mudWeight,
            plasticViscosity,
            yieldPoint,
            fluidLoss,
            remarks,
        } = req.body;

        const wellExists = await prisma.well.findUnique({ where: { id: wellId } });
        if (!wellExists) {
            res.status(404).json({ success: false, message: `Well with id "${wellId}" not found` });
            return;
        }

        const created = await prisma.mudPlan.create({
            data: {
                wellId,
                mudType: mudType.trim(),
                mudWeight: Number(mudWeight),
                plasticViscosity: Number(plasticViscosity),
                yieldPoint: Number(yieldPoint),
                fluidLoss: Number(fluidLoss),
                remarks: remarks && typeof remarks === "string" ? remarks.trim() : null,
            },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
        });

        res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error("Error creating mud plan:", error);
        res.status(500).json({ success: false, message: "Could not create mud plan" });
    }
});

// POST /api/wells/:wellId/mud-plans
app.post("/api/wells/:wellId/mud-plans", async (req, res) => {
    try {
        const payload = { ...req.body, wellId: req.params.wellId };
        const validation = validateMudPlanPayload(payload);
        if (!validation.valid) {
            res.status(400).json({ success: false, message: validation.error });
            return;
        }

        const wellExists = await prisma.well.findUnique({ where: { id: req.params.wellId } });
        if (!wellExists) {
            res.status(404).json({ success: false, message: `Well with id "${req.params.wellId}" not found` });
            return;
        }

        const created = await prisma.mudPlan.create({
            data: {
                wellId: req.params.wellId,
                mudType: payload.mudType.trim(),
                mudWeight: Number(payload.mudWeight),
                plasticViscosity: Number(payload.plasticViscosity),
                yieldPoint: Number(payload.yieldPoint),
                fluidLoss: Number(payload.fluidLoss),
                remarks: payload.remarks && typeof payload.remarks === "string" ? payload.remarks.trim() : null,
            },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
        });

        res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error("Error creating mud plan:", error);
        res.status(500).json({ success: false, message: "Could not create mud plan" });
    }
});

// PUT update mud plan by ID
app.put("/api/mud-plans/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.mudPlan.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: "Mud plan not found" });
            return;
        }

        const merged = {
            wellId: req.body.wellId ?? existing.wellId,
            mudType: req.body.mudType ?? existing.mudType,
            mudWeight: req.body.mudWeight ?? existing.mudWeight,
            plasticViscosity: req.body.plasticViscosity ?? existing.plasticViscosity,
            yieldPoint: req.body.yieldPoint ?? existing.yieldPoint,
            fluidLoss: req.body.fluidLoss ?? existing.fluidLoss,
        };

        const validation = validateMudPlanPayload(merged);
        if (!validation.valid) {
            res.status(400).json({ success: false, message: validation.error });
            return;
        }

        const updated = await prisma.mudPlan.update({
            where: { id },
            data: {
                wellId: merged.wellId,
                mudType: String(merged.mudType).trim(),
                mudWeight: Number(merged.mudWeight),
                plasticViscosity: Number(merged.plasticViscosity),
                yieldPoint: Number(merged.yieldPoint),
                fluidLoss: Number(merged.fluidLoss),
                remarks: req.body.remarks !== undefined
                    ? (req.body.remarks ? String(req.body.remarks).trim() : null)
                    : existing.remarks,
            },
            include: { well: { select: { id: true, name: true, wellCode: true } } },
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating mud plan:", error);
        res.status(500).json({ success: false, message: "Could not update mud plan" });
    }
});

// DELETE mud plan by ID
app.delete("/api/mud-plans/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.mudPlan.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: "Mud plan not found" });
            return;
        }

        await prisma.mudPlan.delete({ where: { id } });
        res.json({ success: true, message: "Mud plan deleted successfully" });
    } catch (error) {
        console.error("Error deleting mud plan:", error);
        res.status(500).json({ success: false, message: "Could not delete mud plan" });
    }
});

// ============================================
// INCIDENT CATEGORIES & TAXONOMY
// ============================================

// GET /api/incident-categories - list all incident families with their types
app.get("/api/incident-categories", async (_req, res) => {
    try {
        const families = await prisma.incidentFamily.findMany({
            include: {
                incidentTypes: {
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        const data = families.map((f) => ({
            id: f.id,
            name: f.name,
            description: f.description,
            typesCount: f.incidentTypes.length,
            incidentTypes: f.incidentTypes,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching incident categories:", error);
        res.status(500).json({ success: false, message: "Could not fetch incident categories" });
    }
});

// GET /api/incident-categories/:id - get single incident family
app.get("/api/incident-categories/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const family = await prisma.incidentFamily.findUnique({
            where: { id },
            include: {
                incidentTypes: {
                    orderBy: { name: "asc" },
                },
            },
        });

        if (!family) {
            res.status(404).json({ success: false, message: "Incident family not found" });
            return;
        }

        res.json({
            success: true,
            data: {
                ...family,
                typesCount: family.incidentTypes.length,
            },
        });
    } catch (error) {
        console.error("Error fetching incident family:", error);
        res.status(500).json({ success: false, message: "Could not fetch incident family" });
    }
});

// GET /api/incident-categories/:familyId/types - list types for a family
app.get("/api/incident-categories/:familyId/types", async (req, res) => {
    try {
        const { familyId } = req.params;
        const types = await prisma.incidentType.findMany({
            where: { familyId },
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data: types });
    } catch (error) {
        console.error("Error fetching incident types:", error);
        res.status(500).json({ success: false, message: "Could not fetch incident types" });
    }
});

// POST /api/incident-categories - create a new incident family
app.post("/api/incident-categories", async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || typeof name !== "string") {
            res.status(400).json({ success: false, message: "Family name is required" });
            return;
        }

        const existing = await prisma.incidentFamily.findUnique({ where: { name: name.trim() } });
        if (existing) {
            res.status(400).json({ success: false, message: "An incident family with this name already exists" });
            return;
        }

        const family = await prisma.incidentFamily.create({
            data: {
                name: name.trim(),
                description: description ? String(description).trim() : null,
            },
            include: {
                incidentTypes: true,
            },
        });

        res.status(201).json({
            success: true,
            data: {
                ...family,
                typesCount: 0,
            },
        });
    } catch (error) {
        console.error("Error creating incident family:", error);
        res.status(500).json({ success: false, message: "Could not create incident family" });
    }
});

// PUT /api/incident-categories/:id - update an incident family
app.put("/api/incident-categories/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const existing = await prisma.incidentFamily.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: "Incident family not found" });
            return;
        }

        const updated = await prisma.incidentFamily.update({
            where: { id },
            data: {
                ...(name ? { name: String(name).trim() } : {}),
                ...(description !== undefined ? { description: description ? String(description).trim() : null } : {}),
            },
            include: {
                incidentTypes: true,
            },
        });

        res.json({
            success: true,
            data: {
                ...updated,
                typesCount: updated.incidentTypes.length,
            },
        });
    } catch (error) {
        console.error("Error updating incident family:", error);
        res.status(500).json({ success: false, message: "Could not update incident family" });
    }
});

// DELETE /api/incident-categories/:id - delete an incident family
app.delete("/api/incident-categories/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.incidentFamily.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: "Incident family not found" });
            return;
        }

        await prisma.incidentFamily.delete({ where: { id } });
        res.json({ success: true, message: "Incident family deleted successfully" });
    } catch (error) {
        console.error("Error deleting incident family:", error);
        res.status(500).json({ success: false, message: "Could not delete incident family" });
    }
});

// POST /api/incident-categories/:familyId/types - create an incident type
app.post("/api/incident-categories/:familyId/types", async (req, res) => {
    try {
        const { familyId } = req.params;
        const { name, description } = req.body;

        if (!name || typeof name !== "string") {
            res.status(400).json({ success: false, message: "Type name is required" });
            return;
        }

        const family = await prisma.incidentFamily.findUnique({ where: { id: familyId } });
        if (!family) {
            res.status(404).json({ success: false, message: "Incident family not found" });
            return;
        }

        const existing = await prisma.incidentType.findUnique({
            where: {
                familyId_name: {
                    familyId,
                    name: name.trim(),
                },
            },
        });
        if (existing) {
            res.status(400).json({ success: false, message: "This incident type already exists in this family" });
            return;
        }

        const created = await prisma.incidentType.create({
            data: {
                familyId,
                name: name.trim(),
                description: description ? String(description).trim() : null,
            },
        });

        res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error("Error creating incident type:", error);
        res.status(500).json({ success: false, message: "Could not create incident type" });
    }
});

// DELETE /api/incident-types/:id - delete an incident type
app.delete("/api/incident-types/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.incidentType.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: "Incident type not found" });
            return;
        }

        await prisma.incidentType.delete({ where: { id } });
        res.json({ success: true, message: "Incident type deleted successfully" });
    } catch (error) {
        console.error("Error deleting incident type:", error);
        res.status(500).json({ success: false, message: "Could not delete incident type" });
    }
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, async () => {
    console.warn(`Backend server running at http://localhost:${PORT}`);
    try {
        await ensureDefaultWell();
        console.warn("Default well verified in PostgreSQL");
    } catch (err) {
        console.error("Error verifying default well:", err);
    }
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on("SIGINT", async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
});
