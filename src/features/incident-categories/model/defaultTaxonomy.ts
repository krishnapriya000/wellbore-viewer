// Pre-configured DrillWise Advisory 14-Family Taxonomy & Fallback Data
// 14 Incident Families · 158 Monitored Incident Types
import type { IncidentFamilyItem } from './types';

export const isActiveState = (s: string) =>
  !/^(Clear|Not applicable|Not active|Cleared|Recovered|Anticipated)/i.test(s.trim());

export const DEFAULT_FAMILIES: IncidentFamilyItem[] = [
  {
    "id": "wc",
    "no": 1,
    "slug": "wc",
    "name": "1. Well-control",
    "description": "Operational classification and incident procedures for well-control incidents.",
    "typesCount": 10,
    "activeCount": 3,
    "criticalCount": 0,
    "warningCount": 1,
    "advisoryCount": 2,
    "incidentTypes": [
      {
        "id": "potential-kick-influx",
        "familyId": "wc",
        "name": "Potential kick / influx",
        "code": "DW-WC-01",
        "description": "Stop drilling at connection, space out and flow-check for 10 min. Line up trip tank. Do not increase pump rate during the check.",
        "record": {
          "id": "potential-kick-influx",
          "familyId": "wc",
          "code": "DW-WC-01",
          "name": "Potential kick / influx",
          "state": "Monitoring",
          "severity": "warn",
          "confidence": 0.72,
          "evidence": [
            "Flow-out 4.1% above flow-in for 6 min",
            "pit gain 2.4 bbl",
            "SPP −38 psi at constant flow",
            "background gas 38 → 61 units"
          ],
          "causes": [
            {
              "t": "Influx from permeable sand at 4,842 m",
              "p": 0.46
            },
            {
              "t": "Wellbore ballooning after ECD swing",
              "p": 0.34
            },
            {
              "t": "Coriolis flow-out calibration drift",
              "p": 0.2
            }
          ],
          "recommendedAction": "Stop drilling at connection, space out and flow-check for 10 min. Line up trip tank. Do not increase pump rate during the check.",
          "constraints": "Do not exceed 12.6 ppg static MW without engineering approval. Kick tolerance at shoe 0.42 ppg. MAASP 1,980 psi.",
          "escalation": "Pit gain > 5 bbl, or flow-out−flow-in > 2% sustained 3 min → hard shut-in and notify OIM/company rep.",
          "sop": "WC-01 Flow-check & Hard Shut-in",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "gas-influx",
        "familyId": "wc",
        "name": "Gas influx",
        "code": "DW-WC-02",
        "description": "Continue drilling. Log connection gas at every stand and trend against offset P50/P90.",
        "record": {
          "id": "gas-influx",
          "familyId": "wc",
          "code": "DW-WC-02",
          "name": "Gas influx",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.55,
          "evidence": [
            "Total gas 38 units, C1/C2 ratio stable",
            "no pit gain",
            "connection gas 74 units within offset P50"
          ],
          "causes": [
            {
              "t": "Normal formation gas liberation",
              "p": 0.71
            },
            {
              "t": "Trip/connection gas from swabbed volume",
              "p": 0.29
            }
          ],
          "recommendedAction": "Continue drilling. Log connection gas at every stand and trend against offset P50/P90.",
          "constraints": "Gas alarm at 250 units. Degasser lined up and confirmed operational.",
          "escalation": "Total gas > 250 units, or C1 rising with pit gain → treat as influx, flow-check.",
          "sop": "WC-04 Gas Monitoring & Trending",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "swab-induced-influx",
        "familyId": "wc",
        "name": "Swab-induced influx",
        "code": "DW-WC-03",
        "description": "Maintain current tripping speed schedule. Break circulation every 10 stands in the 8½\" section.",
        "record": {
          "id": "swab-induced-influx",
          "familyId": "wc",
          "code": "DW-WC-03",
          "name": "Swab-induced influx",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.41,
          "evidence": [
            "Last trip out at 22 m/min average",
            "swab pressure model 62 psi vs 180 psi allowable",
            "hole took 96% of calculated fill"
          ],
          "causes": [
            {
              "t": "Excessive pulling speed through tight sections",
              "p": 0.52
            },
            {
              "t": "High gel strength increasing swab",
              "p": 0.31
            },
            {
              "t": "Balled BHA acting as swab piston",
              "p": 0.17
            }
          ],
          "recommendedAction": "Maintain current tripping speed schedule. Break circulation every 10 stands in the 8½\" section.",
          "constraints": "Maximum trip-out speed 25 m/min above 4,200 m; swab margin must remain below 150 psi.",
          "escalation": "Hole fails to take 95% of calculated fill on two consecutive trip tank checks → stop, circulate bottoms-up.",
          "sop": "WC-06 Tripping & Swab Control",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "surge-induced-formation-fracture",
        "familyId": "wc",
        "name": "Surge-induced formation fracture",
        "code": "DW-WC-04",
        "description": "Break circulation before entering open hole. Limit running speed to 15 m/min below the shoe.",
        "record": {
          "id": "surge-induced-formation-fracture",
          "familyId": "wc",
          "code": "DW-WC-04",
          "name": "Surge-induced formation fracture",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.33,
          "evidence": [
            "Predicted surge on last run-in 0.19 ppg equivalent",
            "ECD peak 12.94 ppg vs LOT-derived 13.42 ppg fracture gradient"
          ],
          "causes": [
            {
              "t": "Running speed too high through open hole",
              "p": 0.48
            },
            {
              "t": "Balled bit restricting bypass area",
              "p": 0.29
            },
            {
              "t": "High gels not broken before RIH",
              "p": 0.23
            }
          ],
          "recommendedAction": "Break circulation before entering open hole. Limit running speed to 15 m/min below the shoe.",
          "constraints": "Peak surge ECD must remain below 13.00 ppg. Fracture gradient at 3,050 m TVD = 13.42 ppg (LOT).",
          "escalation": "Losses observed while running in → stop, pull back above the loss zone, circulate and reassess.",
          "sop": "LC-03 Surge Management",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "shallow-gas-shallow-water-flow",
        "familyId": "wc",
        "name": "Shallow gas / shallow-water flow",
        "code": "DW-WC-05",
        "description": "No action. Retained for the well record and for the abandonment risk register.",
        "record": {
          "id": "shallow-gas-shallow-water-flow",
          "familyId": "wc",
          "code": "DW-WC-05",
          "name": "Shallow gas / shallow-water flow",
          "state": "Not applicable",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "Section drilled riserless with seawater and returns to seabed",
            "no anomalies on the shallow-hazard seismic cube"
          ],
          "causes": [
            {
              "t": "Section already cased and cemented",
              "p": 0.86
            },
            {
              "t": "Residual shallow charge below 20\" shoe",
              "p": 0.14
            }
          ],
          "recommendedAction": "No action. Retained for the well record and for the abandonment risk register.",
          "constraints": "Not applicable in the current section.",
          "escalation": "Reactivate if a shallow sidetrack above the 13⅜\" shoe is planned.",
          "sop": "WC-09 Shallow Hazard Management",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "ballooning-breathing-well",
        "familyId": "wc",
        "name": "Ballooning / breathing well",
        "code": "DW-WC-06",
        "description": "Record volume-back curve on every connection. Compare decay signature against a true influx build-up before acting.",
        "record": {
          "id": "ballooning-breathing-well",
          "familyId": "wc",
          "code": "DW-WC-06",
          "name": "Ballooning / breathing well",
          "state": "Monitoring",
          "severity": "adv",
          "confidence": 0.64,
          "evidence": [
            "Returns 1.8 bbl after pumps off, decaying over 9 min",
            "no sustained flow",
            "repeatable on the last three connections"
          ],
          "causes": [
            {
              "t": "Wellbore breathing in the 4,610 m fractured stringer",
              "p": 0.62
            },
            {
              "t": "Micro-fracture charging near the shoe",
              "p": 0.24
            },
            {
              "t": "Small influx masked by ballooning",
              "p": 0.14
            }
          ],
          "recommendedAction": "Record volume-back curve on every connection. Compare decay signature against a true influx build-up before acting.",
          "constraints": "Do not raise mud weight to suppress the signature — that widens the fracture. ECD ceiling 13.10 ppg.",
          "escalation": "Volume-back stops decaying, or returns exceed 4 bbl → treat as an influx and flow-check.",
          "sop": "WC-07 Ballooning vs Influx Discrimination",
          "owner": "Supervisor",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "gas-migration-after-shut-in",
        "familyId": "wc",
        "name": "Gas migration after shut-in",
        "code": "DW-WC-07",
        "description": "No action while circulating. Retain the migration-rate model for use if the well is shut in.",
        "record": {
          "id": "gas-migration-after-shut-in",
          "familyId": "wc",
          "code": "DW-WC-07",
          "name": "Gas migration after shut-in",
          "state": "Not active",
          "severity": "info",
          "confidence": 0.88,
          "evidence": [
            "Well is not shut in",
            "annulus open to the flow line",
            "no closed-in pressure recorded"
          ],
          "causes": [
            {
              "t": "Well currently circulating",
              "p": 0.92
            },
            {
              "t": "Historic reference only",
              "p": 0.08
            }
          ],
          "recommendedAction": "No action while circulating. Retain the migration-rate model for use if the well is shut in.",
          "constraints": "If shut in, hold casing pressure within 200 psi of the migration schedule.",
          "escalation": "SICP rising more than 60 psi/hr with the well shut in → volumetric control per procedure.",
          "sop": "WC-03 Volumetric Well Control",
          "owner": "Supervisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "undetected-underbalance",
        "familyId": "wc",
        "name": "Undetected underbalance",
        "code": "DW-WC-08",
        "description": "Increase pore-pressure surveillance: d-exponent, connection gas and cuttings volume every stand. Prepare a 0.2 ppg weight-up in the active system.",
        "record": {
          "id": "undetected-underbalance",
          "familyId": "wc",
          "code": "DW-WC-08",
          "name": "Undetected underbalance",
          "state": "Clear",
          "severity": "adv",
          "confidence": 0.58,
          "evidence": [
            "Pore-pressure model 11.62 ppg EMW",
            "static MW 12.00 ppg",
            "overbalance 0.38 ppg — thinnest margin in the section so far"
          ],
          "causes": [
            {
              "t": "Pore-pressure ramp entering the sand",
              "p": 0.55
            },
            {
              "t": "Under-called PP from offset correlation",
              "p": 0.28
            },
            {
              "t": "Temperature effect on downhole density",
              "p": 0.17
            }
          ],
          "recommendedAction": "Increase pore-pressure surveillance: d-exponent, connection gas and cuttings volume every stand. Prepare a 0.2 ppg weight-up in the active system.",
          "constraints": "Minimum overbalance 0.30 ppg. Do not exceed 12.6 ppg without approval — losses seen at 12.85 ppg in offset AD-04.",
          "escalation": "Overbalance below 0.20 ppg, or connection gas doubling stand-on-stand → stop drilling and circulate.",
          "sop": "WC-02 Pore Pressure Surveillance",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bop-control-system-impairment",
        "familyId": "wc",
        "name": "BOP / control-system impairment",
        "code": "DW-WC-09",
        "description": "No action. Next function test due in 3 days.",
        "record": {
          "id": "bop-control-system-impairment",
          "familyId": "wc",
          "code": "DW-WC-09",
          "name": "BOP / control-system impairment",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.93,
          "evidence": [
            "Last BOP function test 4 days ago, all functions passed",
            "accumulator pressure 3,020 psi",
            "pod A/B response within spec"
          ],
          "causes": [
            {
              "t": "System healthy",
              "p": 0.93
            },
            {
              "t": "Sensor reporting lag on the yellow pod",
              "p": 0.07
            }
          ],
          "recommendedAction": "No action. Next function test due in 3 days.",
          "constraints": "Accumulator must remain above 2,800 psi. Regulatory function-test interval 7 days.",
          "escalation": "Any failed function, or accumulator below 2,800 psi → suspend operations that cannot be secured.",
          "sop": "WC-10 BOP Testing & Assurance",
          "owner": "Subsea Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "well-control-sensor-disagreement",
        "familyId": "wc",
        "name": "Well-control sensor disagreement",
        "code": "DW-WC-10",
        "description": "Use trip-tank volume as the arbiter for flow-check decisions until the two flow sensors agree. Schedule Coriolis re-zero at the next connection.",
        "record": {
          "id": "well-control-sensor-disagreement",
          "familyId": "wc",
          "code": "DW-WC-10",
          "name": "Well-control sensor disagreement",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.69,
          "evidence": [
            "Coriolis flow-out reads 4.1% above paddle-derived flow-out",
            "trip-tank volume agrees with paddle within 0.4 bbl"
          ],
          "causes": [
            {
              "t": "Coriolis zero drift after last calibration",
              "p": 0.57
            },
            {
              "t": "Paddle fouling with SBM cuttings",
              "p": 0.28
            },
            {
              "t": "Genuine small influx",
              "p": 0.15
            }
          ],
          "recommendedAction": "Use trip-tank volume as the arbiter for flow-check decisions until the two flow sensors agree. Schedule Coriolis re-zero at the next connection.",
          "constraints": "Do not silence either flow alarm. Kick-detection thresholds stay at their configured values.",
          "escalation": "Disagreement above 6%, or trip tank confirming a gain → treat the higher reading as true and flow-check.",
          "sop": "DM-05 Sensor Cross-validation",
          "owner": "Data Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "lc",
    "no": 2,
    "slug": "lc",
    "name": "2. Lost circulation & pressure-window",
    "description": "Operational classification and incident procedures for lost circulation & pressure-window incidents.",
    "typesCount": 10,
    "activeCount": 4,
    "criticalCount": 0,
    "warningCount": 2,
    "advisoryCount": 2,
    "incidentTypes": [
      {
        "id": "seepage-loss",
        "familyId": "lc",
        "name": "Seepage loss",
        "code": "DW-LC-01",
        "description": "Continue drilling. Add 6 lb/bbl of fine-sized calcium carbonate to the active system on the next circulation.",
        "record": {
          "id": "seepage-loss",
          "familyId": "lc",
          "code": "DW-LC-01",
          "name": "Seepage loss",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.74,
          "evidence": [
            "Loss rate 3.4 bbl/hr, steady over 40 min",
            "ECD 12.72 ppg",
            "no change in SPP or torque"
          ],
          "causes": [
            {
              "t": "Seepage into the 4,780 m permeable sand",
              "p": 0.61
            },
            {
              "t": "Filtration loss from elevated HPHT fluid loss",
              "p": 0.26
            },
            {
              "t": "Surface pit measurement error",
              "p": 0.13
            }
          ],
          "recommendedAction": "Continue drilling. Add 6 lb/bbl of fine-sized calcium carbonate to the active system on the next circulation.",
          "constraints": "Acceptable seepage below 5 bbl/hr. Do not reduce mud weight below 11.9 ppg to chase losses.",
          "escalation": "Loss rate above 10 bbl/hr, or a step change at constant ECD → stop drilling and reduce ECD.",
          "sop": "LC-01 Seepage & Wellbore Strengthening",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "partial-losses",
        "familyId": "lc",
        "name": "Partial losses",
        "code": "DW-LC-02",
        "description": "Maintain LCM concentration at 15 lb/bbl as a preventative. Keep an LCM pill ready in the reserve pit.",
        "record": {
          "id": "partial-losses",
          "familyId": "lc",
          "code": "DW-LC-02",
          "name": "Partial losses",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.8,
          "evidence": [
            "No step change in returns",
            "pit trend flat within ±0.3 bbl over the last stand"
          ],
          "causes": [
            {
              "t": "No active partial loss",
              "p": 0.8
            },
            {
              "t": "Loss masked by simultaneous ballooning",
              "p": 0.2
            }
          ],
          "recommendedAction": "Maintain LCM concentration at 15 lb/bbl as a preventative. Keep an LCM pill ready in the reserve pit.",
          "constraints": "LCM concentration must remain compatible with the MWD flow path — maximum 25 lb/bbl of medium-sized material.",
          "escalation": "Losses between 10 and 50 bbl/hr → reduce flow, drop ECD and spot an LCM pill.",
          "sop": "LC-02 Partial Loss Response",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "total-losses",
        "familyId": "lc",
        "name": "Total losses",
        "code": "DW-LC-03",
        "description": "No action. Keep 250 bbl of pre-mixed LCM slurry available while drilling the depleted interval.",
        "record": {
          "id": "total-losses",
          "familyId": "lc",
          "code": "DW-LC-03",
          "name": "Total losses",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.91,
          "evidence": [
            "Returns full at surface",
            "flow-out/flow-in ratio 0.996",
            "annular level stable"
          ],
          "causes": [
            {
              "t": "No loss zone encountered",
              "p": 0.91
            },
            {
              "t": "Loss zone healed by earlier LCM treatment",
              "p": 0.09
            }
          ],
          "recommendedAction": "No action. Keep 250 bbl of pre-mixed LCM slurry available while drilling the depleted interval.",
          "constraints": "Static kill mud volume of 1.5 times hole volume must be maintained on the rig.",
          "escalation": "Complete loss of returns → stop drilling, pull off bottom, fill the annulus and monitor for flow.",
          "sop": "LC-04 Total Loss & Well Security",
          "owner": "Supervisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "induced-fracture-formation-breakdown",
        "familyId": "lc",
        "name": "Induced fracture / formation breakdown",
        "code": "DW-LC-04",
        "description": "Reduce connection surge: break circulation in stages and slow the last 2 m of run-in. Hold flow at or below 560 gpm.",
        "record": {
          "id": "induced-fracture-formation-breakdown",
          "familyId": "lc",
          "code": "DW-LC-04",
          "name": "Induced fracture / formation breakdown",
          "state": "Monitoring",
          "severity": "warn",
          "confidence": 0.66,
          "evidence": [
            "ECD peaked 12.98 ppg during the last connection surge",
            "seepage began 12 min later",
            "fracture gradient at 2,915 m TVD 13.42 ppg"
          ],
          "causes": [
            {
              "t": "Near-wellbore breakdown from ECD spikes",
              "p": 0.54
            },
            {
              "t": "Natural fracture intersected at 4,780 m",
              "p": 0.31
            },
            {
              "t": "Pressure-model over-estimating ECD",
              "p": 0.15
            }
          ],
          "recommendedAction": "Reduce connection surge: break circulation in stages and slow the last 2 m of run-in. Hold flow at or below 560 gpm.",
          "constraints": "Peak dynamic ECD must stay below 12.95 ppg. Do not raise mud weight while losses are active.",
          "escalation": "Loss rate accelerating with each connection → stop drilling, circulate at reduced rate, spot a wellbore-strengthening pill.",
          "sop": "LC-05 Induced Fracture Management",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "lost-circulation-while-tripping",
        "familyId": "lc",
        "name": "Lost circulation while tripping",
        "code": "DW-LC-05",
        "description": "Maintain the current running-speed schedule and hole-fill discipline.",
        "record": {
          "id": "lost-circulation-while-tripping",
          "familyId": "lc",
          "code": "DW-LC-05",
          "name": "Lost circulation while tripping",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.77,
          "evidence": [
            "Last trip: hole took 101% of calculated fill",
            "no losses on the trip tank"
          ],
          "causes": [
            {
              "t": "No tripping losses",
              "p": 0.77
            },
            {
              "t": "Small surge losses within measurement noise",
              "p": 0.23
            }
          ],
          "recommendedAction": "Maintain the current running-speed schedule and hole-fill discipline.",
          "constraints": "Fill the hole every 5 stands, or every 3 stands below the shoe. Surge ECD ceiling 13.00 ppg.",
          "escalation": "Hole taking less than 95% of calculated fill → stop, circulate and investigate before continuing.",
          "sop": "LC-03 Surge Management",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "losses-while-cementing",
        "familyId": "lc",
        "name": "Losses while cementing",
        "code": "DW-LC-06",
        "description": "No action. Carry the loss risk forward into the 7\" liner cement design review.",
        "record": {
          "id": "losses-while-cementing",
          "familyId": "lc",
          "code": "DW-LC-06",
          "name": "Losses while cementing",
          "state": "Not active",
          "severity": "info",
          "confidence": 0.85,
          "evidence": [
            "No cementing operation in progress",
            "last job (9⅝\" shoe) returned full volume with 4 bbl excess"
          ],
          "causes": [
            {
              "t": "Not applicable in the current operation",
              "p": 0.85
            },
            {
              "t": "Retained for the 7\" liner job planning",
              "p": 0.15
            }
          ],
          "recommendedAction": "No action. Carry the loss risk forward into the 7\" liner cement design review.",
          "constraints": "Liner cement ECD must remain below 13.00 ppg at the 9⅝\" shoe.",
          "escalation": "Losses during the liner job → switch to the contingency light-weight lead slurry.",
          "sop": "CM-02 Cement Placement & Loss Control",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "narrow-mud-weight-window",
        "familyId": "lc",
        "name": "Narrow mud-weight window",
        "code": "DW-LC-07",
        "description": "Manage ECD, not mud weight. Keep flow below 580 gpm and control connection surges. Plan the 7\" liner point above the depleted sand.",
        "record": {
          "id": "narrow-mud-weight-window",
          "familyId": "lc",
          "code": "DW-LC-07",
          "name": "Narrow mud-weight window",
          "state": "Active",
          "severity": "warn",
          "confidence": 0.79,
          "evidence": [
            "Pore pressure 11.62 ppg EMW, fracture gradient 13.42 ppg, dynamic ECD 12.72 ppg — usable window 0.38 ppg above and 0.70 ppg below"
          ],
          "causes": [
            {
              "t": "Depleted sand reducing the fracture gradient",
              "p": 0.52
            },
            {
              "t": "Pore-pressure ramp raising the floor",
              "p": 0.33
            },
            {
              "t": "Model uncertainty inflating the apparent squeeze",
              "p": 0.15
            }
          ],
          "recommendedAction": "Manage ECD, not mud weight. Keep flow below 580 gpm and control connection surges. Plan the 7\" liner point above the depleted sand.",
          "constraints": "Static MW window 11.9–12.3 ppg. Dynamic ECD window 12.30–13.00 ppg. Do not exceed either boundary.",
          "escalation": "Window narrowing below 0.25 ppg → stop drilling and convene a pressure-window review with the operator.",
          "sop": "LC-06 Narrow Window Drilling",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "ecd-exceedance",
        "familyId": "lc",
        "name": "ECD exceedance",
        "code": "DW-LC-08",
        "description": "Circulate cuttings out before increasing flow. Reduce PV by dilution to widen the ECD margin.",
        "record": {
          "id": "ecd-exceedance",
          "familyId": "lc",
          "code": "DW-LC-08",
          "name": "ECD exceedance",
          "state": "Clear",
          "severity": "adv",
          "confidence": 0.83,
          "evidence": [
            "Current ECD 12.72 ppg against a 13.10 ppg maximum",
            "margin 0.38 ppg",
            "peak in the last hour 12.94 ppg during a connection"
          ],
          "causes": [
            {
              "t": "Cuttings loading raising annular density",
              "p": 0.58
            },
            {
              "t": "Elevated PV from solids build-up",
              "p": 0.27
            },
            {
              "t": "Barite sag altering the annular profile",
              "p": 0.15
            }
          ],
          "recommendedAction": "Circulate cuttings out before increasing flow. Reduce PV by dilution to widen the ECD margin.",
          "constraints": "Maximum ECD 13.10 ppg. Flow increases limited to 40 gpm steps, only if predicted ECD remains below 12.95 ppg.",
          "escalation": "ECD above 13.00 ppg → reduce flow and rotary immediately, stop drilling if it does not respond.",
          "sop": "HC-02 ECD Management",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "static-mud-weight-outside-window",
        "familyId": "lc",
        "name": "Static mud weight outside window",
        "code": "DW-LC-09",
        "description": "No action. Continue checking mud weight in and out every 30 min.",
        "record": {
          "id": "static-mud-weight-outside-window",
          "familyId": "lc",
          "code": "DW-LC-09",
          "name": "Static mud weight outside window",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.86,
          "evidence": [
            "Static MW 12.00 ppg",
            "window 11.90–12.30 ppg",
            "density-in 12.01 ppg, density-out 12.04 ppg"
          ],
          "causes": [
            {
              "t": "Mud weight on programme",
              "p": 0.86
            },
            {
              "t": "Slow weight-up from cuttings incorporation",
              "p": 0.14
            }
          ],
          "recommendedAction": "No action. Continue checking mud weight in and out every 30 min.",
          "constraints": "Do not deviate from 12.0 ppg ±0.1 without a written mud-weight change order.",
          "escalation": "Density-out exceeding density-in by more than 0.15 ppg → check for solids loading or an influx.",
          "sop": "MD-01 Mud Weight Control",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "pressure-model-uncertainty-spike",
        "familyId": "lc",
        "name": "Pressure-model uncertainty spike",
        "code": "DW-LC-10",
        "description": "Treat the model ECD as indicative only until the next rheology check. Weight decisions on the PWD reading where it is available.",
        "record": {
          "id": "pressure-model-uncertainty-spike",
          "familyId": "lc",
          "code": "DW-LC-10",
          "name": "Pressure-model uncertainty spike",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.61,
          "evidence": [
            "PWD-to-model ECD residual widened from ±0.03 to ±0.11 ppg over 25 min",
            "PWD telemetry gaps of 40 s present"
          ],
          "causes": [
            {
              "t": "Cuttings loading not represented in the hydraulic model",
              "p": 0.49
            },
            {
              "t": "PWD telemetry dropout degrading the fit",
              "p": 0.33
            },
            {
              "t": "Rheology sample older than 4 hours",
              "p": 0.18
            }
          ],
          "recommendedAction": "Treat the model ECD as indicative only until the next rheology check. Weight decisions on the PWD reading where it is available.",
          "constraints": "Widen the ECD safety margin to 0.20 ppg while the residual exceeds ±0.08 ppg.",
          "escalation": "Residual above ±0.15 ppg, or PWD lost entirely → revert to conservative flow limits and notify the engineer.",
          "sop": "DM-02 Hydraulic Model Assurance",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "hc",
    "no": 3,
    "slug": "hc",
    "name": "3. Hole cleaning, pack-off & stuck-pipe",
    "description": "Operational classification and incident procedures for hole cleaning, pack-off & stuck-pipe incidents.",
    "typesCount": 16,
    "activeCount": 11,
    "criticalCount": 1,
    "warningCount": 3,
    "advisoryCount": 7,
    "incidentTypes": [
      {
        "id": "developing-cuttings-bed-early-pack-off",
        "familyId": "hc",
        "name": "Developing cuttings bed / early pack-off",
        "code": "DW-HC-01",
        "description": "Do not increase WOB. Reduce ROP target by 10% to 37 m/hr. Increase flow by up to 40 gpm only if predicted ECD stays below 12.95 ppg. Run the rotate-and-circulate sequence from the hole-cleaning procedure at 120–130 rpm.",
        "record": {
          "id": "developing-cuttings-bed-early-pack-off",
          "familyId": "hc",
          "code": "DW-HC-01",
          "name": "Developing cuttings bed / early pack-off",
          "state": "Active — trending",
          "severity": "warn",
          "confidence": 0.81,
          "evidence": [
            "Surface torque +12% over 10 min (21,250 → 23,800 ft-lbf)",
            "SPP +8% over 10 min (3,462 → 3,740 psi)",
            "ROP −16% (40.7 → 34.2 m/hr)",
            "flow and WOB unchanged",
            "inclination 86.7°",
            "cuttings loading index 0.71"
          ],
          "causes": [
            {
              "t": "Insufficient annular transport in the horizontal section",
              "p": 0.63
            },
            {
              "t": "Cuttings avalanche from a bed formed in the 70–80° build",
              "p": 0.24
            },
            {
              "t": "Bit or stabiliser balling adding torque",
              "p": 0.13
            }
          ],
          "recommendedAction": "Do not increase WOB. Reduce ROP target by 10% to 37 m/hr. Increase flow by up to 40 gpm only if predicted ECD stays below 12.95 ppg. Run the rotate-and-circulate sequence from the hole-cleaning procedure at 120–130 rpm.",
          "constraints": "ECD margin 0.38 ppg; maximum ECD 13.10 ppg. Top-drive torque margin 15%; maximum torque 28,000 ft-lbf. Maximum flow 580 gpm at current PV.",
          "escalation": "Torque or SPP rising a further 5%, or flow-out diverging from flow-in → stop drilling and follow the approved pack-off / well-control procedure.",
          "sop": "HC-01 Hole Cleaning & Pack-off Response",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "poor-hole-cleaning",
        "familyId": "hc",
        "name": "Poor hole cleaning",
        "code": "DW-HC-02",
        "description": "Raise flow toward 570 gpm inside the ECD limit. Raise YP from 18 to 22 lb/100ft² on the next treatment. Circulate one bottoms-up before the next connection.",
        "record": {
          "id": "poor-hole-cleaning",
          "familyId": "hc",
          "code": "DW-HC-02",
          "name": "Poor hole cleaning",
          "state": "Active",
          "severity": "warn",
          "confidence": 0.76,
          "evidence": [
            "Cuttings return at shakers 62% of calculated volume",
            "cuttings loading index 0.71",
            "annular velocity 148 ft/min against a 180 ft/min target"
          ],
          "causes": [
            {
              "t": "Annular velocity below the transport threshold at 86.7°",
              "p": 0.58
            },
            {
              "t": "Low YP reducing carrying capacity",
              "p": 0.27
            },
            {
              "t": "Bed already deposited in the tangent",
              "p": 0.15
            }
          ],
          "recommendedAction": "Raise flow toward 570 gpm inside the ECD limit. Raise YP from 18 to 22 lb/100ft² on the next treatment. Circulate one bottoms-up before the next connection.",
          "constraints": "Annular velocity target 180 ft/min. ECD must remain below 12.95 ppg during any flow increase.",
          "escalation": "Cuttings return below 50% of calculated volume for two stands → stop drilling and dedicate a full circulating cycle.",
          "sop": "HC-01 Hole Cleaning & Pack-off Response",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "early-pack-off",
        "familyId": "hc",
        "name": "Early pack-off",
        "code": "DW-HC-03",
        "description": "Reduce ROP to 30 m/hr and maintain rotation. Do not stop rotating with the pump off. Pick up and ream the last stand before the next connection.",
        "record": {
          "id": "early-pack-off",
          "familyId": "hc",
          "code": "DW-HC-03",
          "name": "Early pack-off",
          "state": "Watch",
          "severity": "warn",
          "confidence": 0.68,
          "evidence": [
            "Two SPP micro-spikes of 90 and 120 psi in 8 min, each clearing within 15 s",
            "torque oscillation band widened from 900 to 1,900 ft-lbf"
          ],
          "causes": [
            {
              "t": "Cuttings slug passing a restriction",
              "p": 0.55
            },
            {
              "t": "Bed collapse in the 78° section",
              "p": 0.29
            },
            {
              "t": "Hole-cleaning sweep arriving at the BHA",
              "p": 0.16
            }
          ],
          "recommendedAction": "Reduce ROP to 30 m/hr and maintain rotation. Do not stop rotating with the pump off. Pick up and ream the last stand before the next connection.",
          "constraints": "Maximum permitted SPP 4,000 psi (warning) and 4,500 psi (hard). Do not exceed 580 gpm.",
          "escalation": "SPP spike above 250 psi that does not clear in 30 s → stop drilling, work the string, follow the pack-off procedure.",
          "sop": "HC-03 Pack-off Recognition & Release",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "full-pack-off",
        "familyId": "hc",
        "name": "Full pack-off",
        "code": "DW-HC-04",
        "description": "No action. Keep the pack-off response card at the driller's station.",
        "record": {
          "id": "full-pack-off",
          "familyId": "hc",
          "code": "DW-HC-04",
          "name": "Full pack-off",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.88,
          "evidence": [
            "No sustained SPP rise",
            "annulus taking full returns",
            "string free to rotate and reciprocate"
          ],
          "causes": [
            {
              "t": "No pack-off present",
              "p": 0.88
            },
            {
              "t": "Partial restriction below detection threshold",
              "p": 0.12
            }
          ],
          "recommendedAction": "No action. Keep the pack-off response card at the driller's station.",
          "constraints": "If a pack-off develops, do not exceed the maximum surface pressure of 4,500 psi while attempting to break circulation.",
          "escalation": "Complete loss of circulation with rising SPP → shut down pumps, do not bullhead, follow the procedure.",
          "sop": "HC-03 Pack-off Recognition & Release",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "mechanical-stuck-pipe",
        "familyId": "hc",
        "name": "Mechanical stuck pipe",
        "code": "DW-HC-05",
        "description": "No action. Continue trending pick-up, slack-off and rotating weight at every connection.",
        "record": {
          "id": "mechanical-stuck-pipe",
          "familyId": "hc",
          "code": "DW-HC-05",
          "name": "Mechanical stuck pipe",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.84,
          "evidence": [
            "String rotates freely at 118 rpm",
            "pick-up 236 klbf and slack-off 192 klbf both within 4% of the torque-and-drag model"
          ],
          "causes": [
            {
              "t": "String free",
              "p": 0.84
            },
            {
              "t": "Early tight-hole tendency below detection",
              "p": 0.16
            }
          ],
          "recommendedAction": "No action. Continue trending pick-up, slack-off and rotating weight at every connection.",
          "constraints": "Maximum permitted overpull 60 klbf over free rotating weight. Maximum make-up torque 32,000 ft-lbf.",
          "escalation": "Overpull above 40 klbf, or free rotation lost → stop, do not jar immediately, diagnose the sticking mechanism first.",
          "sop": "SP-01 Stuck Pipe Diagnosis",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "differential-sticking",
        "familyId": "hc",
        "name": "Differential sticking",
        "code": "DW-HC-06",
        "description": "Maintain full circulation. Apply torque and work the string within the make-up limit — do not jar up first. Reduce mud weight by 0.3 ppg to cut overbalance if the hole will tolerate it. Spot a 45 bbl oil-based release pill across the BHA and soak 60 min. Never stop the string for more than 2 min in this interval once free.",
        "record": {
          "id": "differential-sticking",
          "familyId": "hc",
          "code": "DW-HC-06",
          "name": "Differential sticking",
          "state": "Suspected — critical",
          "severity": "crit",
          "confidence": 0.88,
          "evidence": [
            "Pick-up overpull 31% above the torque-and-drag model",
            "pipe cannot be reciprocated",
            "rotation limited to 40% of normal torque capacity",
            "flow-in and flow-out stable",
            "SPP within +2% of expected",
            "estimated overbalance 950 psi",
            "stationary exposure 18 min across a depleted permeable sandstone at 3,218 m MD, 71° inclination"
          ],
          "causes": [
            {
              "t": "Differential sticking across the depleted sand at 3,180–3,240 m",
              "p": 0.72
            },
            {
              "t": "Mechanical key-seat at the 68° dogleg",
              "p": 0.16
            },
            {
              "t": "Cuttings bed packing around the BHA",
              "p": 0.12
            }
          ],
          "recommendedAction": "Maintain full circulation. Apply torque and work the string within the make-up limit — do not jar up first. Reduce mud weight by 0.3 ppg to cut overbalance if the hole will tolerate it. Spot a 45 bbl oil-based release pill across the BHA and soak 60 min. Never stop the string for more than 2 min in this interval once free.",
          "constraints": "Maximum overpull 60 klbf over free rotating weight. Maximum applied torque 32,000 ft-lbf (string make-up limit). Minimum mud weight for pore pressure 11.7 ppg — do not go below. Maximum pill soak 90 min.",
          "escalation": "No movement after 60 min of working plus one pill soak, or overpull reaching 60 klbf → stop, hold a stuck-pipe conference, prepare for back-off and fishing per procedure.",
          "sop": "SP-02 Differential Sticking & Spotting Fluid",
          "owner": "Supervisor",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "keyseat-sticking",
        "familyId": "hc",
        "name": "Keyseat sticking",
        "code": "DW-HC-07",
        "description": "Ream through 3,900–3,980 m at reduced speed on every trip. Use a string reamer on the next BHA to open the key-seat.",
        "record": {
          "id": "keyseat-sticking",
          "familyId": "hc",
          "code": "DW-HC-07",
          "name": "Keyseat sticking",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.57,
          "evidence": [
            "Overpull of 18 klbf repeatable at 3,940 m on the last two trips",
            "free below and above",
            "DLS at that depth 4.8°/30 m"
          ],
          "causes": [
            {
              "t": "Key-seat cut at the 4.8°/30 m dogleg",
              "p": 0.61
            },
            {
              "t": "Ledge at the shale–sand contact",
              "p": 0.26
            },
            {
              "t": "Under-gauge stabiliser hanging up",
              "p": 0.13
            }
          ],
          "recommendedAction": "Ream through 3,900–3,980 m at reduced speed on every trip. Use a string reamer on the next BHA to open the key-seat.",
          "constraints": "Do not pull through the tight spot with more than 30 klbf overpull. Rotate while reaming.",
          "escalation": "Overpull at the key-seat exceeding 30 klbf → stop pulling, rotate and ream down, then work through.",
          "sop": "SP-03 Key-seat & Ledge Management",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bridge-fill-tight-spot",
        "familyId": "hc",
        "name": "Bridge / fill / tight spot",
        "code": "DW-HC-08",
        "description": "Wash and ream the last 150 m before drilling ahead. Circulate bottoms-up before every trip out of the section.",
        "record": {
          "id": "bridge-fill-tight-spot",
          "familyId": "hc",
          "code": "DW-HC-08",
          "name": "Bridge / fill / tight spot",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.62,
          "evidence": [
            "12 m of fill on the last bottoms-up",
            "3 tight spots logged between 4,410 and 4,560 m on the last trip in"
          ],
          "causes": [
            {
              "t": "Cuttings settling in the tangent while stationary",
              "p": 0.57
            },
            {
              "t": "Sloughing shale at 4,470 m",
              "p": 0.28
            },
            {
              "t": "Ledging at the interbedded contacts",
              "p": 0.15
            }
          ],
          "recommendedAction": "Wash and ream the last 150 m before drilling ahead. Circulate bottoms-up before every trip out of the section.",
          "constraints": "Maximum reaming speed 6 m/min with full rotation and flow. Do not ream with the pumps off.",
          "escalation": "Fill exceeding 20 m, or a tight spot needing more than 25 klbf to pass → stop and dedicate a cleaning cycle.",
          "sop": "HC-04 Wiper Trips & Hole Conditioning",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "shale-swelling-gumbo",
        "familyId": "hc",
        "name": "Shale swelling / gumbo",
        "code": "DW-HC-09",
        "description": "Raise the water-phase salinity to 24% CaCl₂ equivalent. Increase the shaker screen cut and dilute to hold PV below 26 cP.",
        "record": {
          "id": "shale-swelling-gumbo",
          "familyId": "hc",
          "code": "DW-HC-09",
          "name": "Shale swelling / gumbo",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.59,
          "evidence": [
            "Cavings at the shakers 14% of returned solids, splintered morphology",
            "MBT 18 lb/bbl, up from 12",
            "PV rising 4 cP over 6 hours"
          ],
          "causes": [
            {
              "t": "Reactive shale hydrating at 4,690 m",
              "p": 0.54
            },
            {
              "t": "Insufficient shale inhibition in the SBM",
              "p": 0.31
            },
            {
              "t": "Mechanical instability, not chemical",
              "p": 0.15
            }
          ],
          "recommendedAction": "Raise the water-phase salinity to 24% CaCl₂ equivalent. Increase the shaker screen cut and dilute to hold PV below 26 cP.",
          "constraints": "MBT ceiling 25 lb/bbl. PV ceiling 28 cP before the ECD margin is consumed.",
          "escalation": "Cavings exceeding 25% of returns, or a hole-fill trend developing → stop drilling and condition the hole.",
          "sop": "MD-04 Shale Inhibition & Wellbore Stability",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "salt-creep-salt-closure",
        "familyId": "hc",
        "name": "Salt creep / salt closure",
        "code": "DW-HC-10",
        "description": "No action. Retained for the fleet template.",
        "record": {
          "id": "salt-creep-salt-closure",
          "familyId": "hc",
          "code": "DW-HC-10",
          "name": "Salt creep / salt closure",
          "state": "Not applicable",
          "severity": "info",
          "confidence": 0.92,
          "evidence": [
            "No salt section in the well plan",
            "nearest evaporite is 41 km updip"
          ],
          "causes": [
            {
              "t": "Not applicable to this well",
              "p": 0.92
            },
            {
              "t": "Thin stringer below seismic resolution",
              "p": 0.08
            }
          ],
          "recommendedAction": "No action. Retained for the fleet template.",
          "constraints": "Not applicable in the current section.",
          "escalation": "Reactivate if the well is deepened into the Hith evaporite.",
          "sop": "SP-05 Mobile Formation Management",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "hole-collapse-sloughing-shale",
        "familyId": "hc",
        "name": "Hole collapse / sloughing shale",
        "code": "DW-HC-11",
        "description": "Hold mud weight at 12.0 ppg — collapse gradient at this inclination is 11.85 ppg. Minimise open-hole exposure time. Avoid ECD swings.",
        "record": {
          "id": "hole-collapse-sloughing-shale",
          "familyId": "hc",
          "code": "DW-HC-11",
          "name": "Hole collapse / sloughing shale",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.63,
          "evidence": [
            "Cavings volume 1.6× the drilled-cuttings estimate",
            "angular blocky morphology",
            "hole enlargement 8% on the caliper log"
          ],
          "causes": [
            {
              "t": "Wellbore stress exceeding shale strength at 86.7°",
              "p": 0.55
            },
            {
              "t": "Mud weight below the collapse gradient",
              "p": 0.3
            },
            {
              "t": "Time-dependent weakening after 26 hours of exposure",
              "p": 0.15
            }
          ],
          "recommendedAction": "Hold mud weight at 12.0 ppg — collapse gradient at this inclination is 11.85 ppg. Minimise open-hole exposure time. Avoid ECD swings.",
          "constraints": "Collapse gradient 11.85 ppg — do not reduce mud weight below 11.9 ppg. Maximum open-hole exposure 72 hours.",
          "escalation": "Cavings volume doubling, or overpull developing over the sloughing interval → circulate, condition and consider setting the liner early.",
          "sop": "SP-06 Wellbore Stability Management",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "unconsolidated-formation-washout",
        "familyId": "hc",
        "name": "Unconsolidated formation washout",
        "code": "DW-HC-12",
        "description": "Reduce flow while passing the washed-out interval. Accept a lower annular velocity there and compensate with rotation.",
        "record": {
          "id": "unconsolidated-formation-washout",
          "familyId": "hc",
          "code": "DW-HC-12",
          "name": "Unconsolidated formation washout",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.54,
          "evidence": [
            "Caliper shows 9.6\" average against an 8.5\" bit in 4,320–4,380 m",
            "annular velocity falls to 118 ft/min across the washout"
          ],
          "causes": [
            {
              "t": "Poorly consolidated sand eroding under jet impact",
              "p": 0.58
            },
            {
              "t": "Excessive flow rate across a weak interval",
              "p": 0.27
            },
            {
              "t": "Chemical incompatibility with the sand cement",
              "p": 0.15
            }
          ],
          "recommendedAction": "Reduce flow while passing the washed-out interval. Accept a lower annular velocity there and compensate with rotation.",
          "constraints": "Do not exceed 560 gpm across 4,320–4,380 m. Hydraulic impact force ceiling 780 lbf.",
          "escalation": "Washout exceeding 11\" or bridging above it → plan a dedicated cleaning cycle before running the liner.",
          "sop": "HC-05 Washout & Enlarged Hole Cleaning",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "formation-bridge",
        "familyId": "hc",
        "name": "Formation bridge",
        "code": "DW-HC-13",
        "description": "No action. Keep the wash-and-ream schedule as planned.",
        "record": {
          "id": "formation-bridge",
          "familyId": "hc",
          "code": "DW-HC-13",
          "name": "Formation bridge",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.81,
          "evidence": [
            "No bridging indications",
            "last trip in reached bottom without resistance"
          ],
          "causes": [
            {
              "t": "No bridge present",
              "p": 0.81
            },
            {
              "t": "Soft bridge cleared by circulation",
              "p": 0.19
            }
          ],
          "recommendedAction": "No action. Keep the wash-and-ream schedule as planned.",
          "constraints": "Do not run in faster than 15 m/min below the shoe.",
          "escalation": "Hard bridge encountered → stop, circulate, ream through with rotation, never wash blind.",
          "sop": "HC-04 Wiper Trips & Hole Conditioning",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "junk-in-hole",
        "familyId": "hc",
        "name": "Junk in hole",
        "code": "DW-HC-14",
        "description": "No action. Continue ditch-magnet checks every 4 hours.",
        "record": {
          "id": "junk-in-hole",
          "familyId": "hc",
          "code": "DW-HC-14",
          "name": "Junk in hole",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.87,
          "evidence": [
            "No metal at the shakers",
            "ditch magnets clean at the last two checks",
            "torque signature free of impact spikes"
          ],
          "causes": [
            {
              "t": "No junk present",
              "p": 0.87
            },
            {
              "t": "Fine metal below magnet detection",
              "p": 0.13
            }
          ],
          "recommendedAction": "No action. Continue ditch-magnet checks every 4 hours.",
          "constraints": "All handling tools to be tethered over the hole; hole covers in place when the string is out.",
          "escalation": "Metal recovered at the shakers, or an unexplained torque spike with ROP loss → stop and consider a junk basket run.",
          "sop": "RE-08 Dropped Object & Junk Prevention",
          "owner": "Toolpusher",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "wellbore-tortuosity",
        "familyId": "hc",
        "name": "Wellbore tortuosity",
        "code": "DW-HC-15",
        "description": "Reduce slide length and increase rotary steerable proportional gain. Ream each slide interval before drilling ahead.",
        "record": {
          "id": "wellbore-tortuosity",
          "familyId": "hc",
          "code": "DW-HC-15",
          "name": "Wellbore tortuosity",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.7,
          "evidence": [
            "Survey-derived tortuosity index 1.34 (offset P50 1.10)",
            "6 micro-doglegs above 3°/30 m between 4,100 and 4,600 m"
          ],
          "causes": [
            {
              "t": "Slide-rotate alternation creating micro-doglegs",
              "p": 0.61
            },
            {
              "t": "RSS steering oscillation",
              "p": 0.24
            },
            {
              "t": "Survey noise inflating the index",
              "p": 0.15
            }
          ],
          "recommendedAction": "Reduce slide length and increase rotary steerable proportional gain. Ream each slide interval before drilling ahead.",
          "constraints": "Casing-running drag budget allows a tortuosity index of 1.50 — above that the liner may not reach TD.",
          "escalation": "Tortuosity index exceeding 1.50 → run a torque-and-drag re-forecast for the liner before drilling ahead.",
          "sop": "DD-04 Trajectory Smoothness",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "excessive-overpull",
        "familyId": "hc",
        "name": "Excessive overpull",
        "code": "DW-HC-16",
        "description": "Re-calibrate the friction factor on the next connection. Treat the trend, not the absolute value, as the signal.",
        "record": {
          "id": "excessive-overpull",
          "familyId": "hc",
          "code": "DW-HC-16",
          "name": "Excessive overpull",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.66,
          "evidence": [
            "Pick-up 236 klbf against a modelled 227 klbf — 4% over model, rising from 1% six hours ago"
          ],
          "causes": [
            {
              "t": "Cuttings bed increasing drag",
              "p": 0.57
            },
            {
              "t": "Wellbore tortuosity adding side force",
              "p": 0.28
            },
            {
              "t": "Torque-and-drag friction factor stale",
              "p": 0.15
            }
          ],
          "recommendedAction": "Re-calibrate the friction factor on the next connection. Treat the trend, not the absolute value, as the signal.",
          "constraints": "Overpull alarm at 40 klbf; maximum permitted overpull 60 klbf over free rotating weight.",
          "escalation": "Overpull above 40 klbf, or 15% above model → stop, circulate and diagnose before pulling further.",
          "sop": "SP-01 Stuck Pipe Diagnosis",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "bha",
    "no": 4,
    "slug": "bha",
    "name": "4. Bit, BHA, drilling-mechanics & vibration",
    "description": "Operational classification and incident procedures for bit, bha, drilling-mechanics & vibration incidents.",
    "typesCount": 20,
    "activeCount": 11,
    "criticalCount": 0,
    "warningCount": 1,
    "advisoryCount": 10,
    "incidentTypes": [
      {
        "id": "bit-balling",
        "familyId": "bha",
        "name": "Bit balling",
        "code": "DW-BHA-01",
        "description": "Perform a bit-balling test: lift off bottom, rotate at 140 rpm for 2 min at full flow, then re-establish WOB in steps. Compare MSE before and after.",
        "record": {
          "id": "bit-balling",
          "familyId": "bha",
          "code": "DW-BHA-01",
          "name": "Bit balling",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.58,
          "evidence": [
            "MSE 16,800 psi against a 14,500 psi formation-normalised value",
            "ROP falling with WOB held",
            "SPP steady — no nozzle restriction"
          ],
          "causes": [
            {
              "t": "Shale packing the PDC cutter face",
              "p": 0.52
            },
            {
              "t": "Cuttings bed contribution mistaken for balling",
              "p": 0.33
            },
            {
              "t": "Bit wear raising MSE",
              "p": 0.15
            }
          ],
          "recommendedAction": "Perform a bit-balling test: lift off bottom, rotate at 140 rpm for 2 min at full flow, then re-establish WOB in steps. Compare MSE before and after.",
          "constraints": "Do not exceed 24 klbf WOB while diagnosing. Hold flow at or below 580 gpm.",
          "escalation": "MSE unchanged after the cleaning test and ROP still falling → treat as bit wear and plan a trip.",
          "sop": "BT-01 Bit Balling Diagnosis",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bottomhole-bha-balling",
        "familyId": "bha",
        "name": "Bottomhole / BHA balling",
        "code": "DW-BHA-02",
        "description": "Increase rotary to 130 rpm for one full bottoms-up. Add a low-viscosity sweep ahead of the next connection.",
        "record": {
          "id": "bottomhole-bha-balling",
          "familyId": "bha",
          "code": "DW-BHA-02",
          "name": "Bottomhole / BHA balling",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.52,
          "evidence": [
            "Torque baseline drifted up 900 ft-lbf with unchanged WOB",
            "stabiliser-passing signature dampened on the downhole accelerometer"
          ],
          "causes": [
            {
              "t": "Cuttings accreting on stabiliser blades",
              "p": 0.49
            },
            {
              "t": "Cuttings bed contact along the BHA",
              "p": 0.36
            },
            {
              "t": "Downhole sensor drift",
              "p": 0.15
            }
          ],
          "recommendedAction": "Increase rotary to 130 rpm for one full bottoms-up. Add a low-viscosity sweep ahead of the next connection.",
          "constraints": "Rotary ceiling 150 rpm on this BHA. Sweep volume 30 bbl maximum to protect the ECD margin.",
          "escalation": "Torque baseline rising a further 1,500 ft-lbf → stop drilling and dedicate a cleaning cycle.",
          "sop": "BT-02 BHA Cleaning",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bit-dulling-cutter-wear",
        "familyId": "bha",
        "name": "Bit dulling / cutter wear",
        "code": "DW-BHA-03",
        "description": "Continue with reduced ROP expectation. Prepare the trip plan for the 7\" liner point; there is no benefit in forcing WOB on a dull bit.",
        "record": {
          "id": "bit-dulling-cutter-wear",
          "familyId": "bha",
          "code": "DW-BHA-03",
          "name": "Bit dulling / cutter wear",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.61,
          "evidence": [
            "Cumulative drilling hours 48.2",
            "MSE up 18% at constant WOB and RPM",
            "ROP down 21% over 12 hours",
            "depth of cut 3.1 mm/rev, down from 4.4"
          ],
          "causes": [
            {
              "t": "Progressive PDC cutter wear in the abrasive sand",
              "p": 0.56
            },
            {
              "t": "Interbedded hard stringers accelerating wear",
              "p": 0.29
            },
            {
              "t": "Hydraulic inefficiency masking true bit condition",
              "p": 0.15
            }
          ],
          "recommendedAction": "Continue with reduced ROP expectation. Prepare the trip plan for the 7\" liner point; there is no benefit in forcing WOB on a dull bit.",
          "constraints": "Do not exceed 24 klbf WOB to compensate for wear — that risks cutter breakage and vibration.",
          "escalation": "MSE exceeding 19,000 psi with no ROP response, or an abrupt torque drop → pull for a bit change.",
          "sop": "BT-03 Bit Wear & Trip Decision",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bit-damage-broken-cutters",
        "familyId": "bha",
        "name": "Bit damage / broken cutters",
        "code": "DW-BHA-04",
        "description": "No action. Keep the vibration monitor at the driller's station in view.",
        "record": {
          "id": "bit-damage-broken-cutters",
          "familyId": "bha",
          "code": "DW-BHA-04",
          "name": "Bit damage / broken cutters",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.72,
          "evidence": [
            "No high-frequency torque signature",
            "lateral vibration RMS 0.6 g, within normal band",
            "no metal at the shakers"
          ],
          "causes": [
            {
              "t": "Bit intact",
              "p": 0.72
            },
            {
              "t": "Early cutter chipping below detection",
              "p": 0.28
            }
          ],
          "recommendedAction": "No action. Keep the vibration monitor at the driller's station in view.",
          "constraints": "Lateral vibration must stay below 2.5 g RMS; sustained exceedance damages cutters.",
          "escalation": "Abrupt torque drop with an ROP drop, or a step change in the vibration signature → pull and inspect.",
          "sop": "BT-04 Bit Damage Response",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bit-nozzle-plugging",
        "familyId": "bha",
        "name": "Bit nozzle plugging",
        "code": "DW-BHA-05",
        "description": "No action. Note that the SPP rise is correctly attributed to the annulus, not the bit.",
        "record": {
          "id": "bit-nozzle-plugging",
          "familyId": "bha",
          "code": "DW-BHA-05",
          "name": "Bit nozzle plugging",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.79,
          "evidence": [
            "SPP rise of 8% is accompanied by a torque rise — annular signature, not a nozzle signature",
            "TFA-derived pressure drop unchanged at 1,180 psi"
          ],
          "causes": [
            {
              "t": "No nozzle plugging",
              "p": 0.79
            },
            {
              "t": "Partial plug offset by flow-path change",
              "p": 0.21
            }
          ],
          "recommendedAction": "No action. Note that the SPP rise is correctly attributed to the annulus, not the bit.",
          "constraints": "LCM sizing must remain compatible with 12/32\" nozzles — no coarse material.",
          "escalation": "SPP step change above 300 psi without a torque change → suspect a nozzle plug and pull to check.",
          "sop": "HY-03 Standpipe Pressure Diagnostics",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bit-whirl",
        "familyId": "bha",
        "name": "Bit whirl",
        "code": "DW-BHA-06",
        "description": "Shift rotary off the resonance band: move from 118 to 96 rpm and raise WOB by 1 klbf to keep the bit engaged.",
        "record": {
          "id": "bit-whirl",
          "familyId": "bha",
          "code": "DW-BHA-06",
          "name": "Bit whirl",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.55,
          "evidence": [
            "Lateral vibration 1.8 g RMS with a 1.4× rotary-speed frequency component",
            "MSE elevated",
            "borehole slightly over-gauge"
          ],
          "causes": [
            {
              "t": "Backward whirl from cutter imbalance",
              "p": 0.51
            },
            {
              "t": "Under-gauge stabilisation allowing lateral movement",
              "p": 0.34
            },
            {
              "t": "Formation heterogeneity exciting the BHA",
              "p": 0.15
            }
          ],
          "recommendedAction": "Shift rotary off the resonance band: move from 118 to 96 rpm and raise WOB by 1 klbf to keep the bit engaged.",
          "constraints": "Do not exceed 24 klbf WOB. Lateral vibration ceiling 2.5 g RMS.",
          "escalation": "Lateral vibration exceeding 3.5 g RMS for more than 2 min → stop rotation, lift off bottom and restart at a different rpm.",
          "sop": "VB-01 Vibration Mitigation",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "stick-slip",
        "familyId": "bha",
        "name": "Stick-slip",
        "code": "DW-BHA-07",
        "description": "Raise surface rpm to 135 and reduce WOB to 20 klbf. Engage the top-drive soft-torque control loop.",
        "record": {
          "id": "stick-slip",
          "familyId": "bha",
          "code": "DW-BHA-07",
          "name": "Stick-slip",
          "state": "Active",
          "severity": "warn",
          "confidence": 0.74,
          "evidence": [
            "Downhole rpm oscillating 40–190 against a surface 118",
            "stick-slip severity index 0.63",
            "torque oscillation band 1,900 ft-lbf"
          ],
          "causes": [
            {
              "t": "High friction along the horizontal section",
              "p": 0.55
            },
            {
              "t": "Aggressive depth of cut on a worn bit",
              "p": 0.28
            },
            {
              "t": "Insufficient rotary inertia at the current rpm",
              "p": 0.17
            }
          ],
          "recommendedAction": "Raise surface rpm to 135 and reduce WOB to 20 klbf. Engage the top-drive soft-torque control loop.",
          "constraints": "Rotary ceiling 150 rpm. Torque hard limit 28,000 ft-lbf. WOB floor 18 klbf to keep steering authority.",
          "escalation": "Severity index above 0.80, or downhole rotation stalling → stop drilling, lift off bottom and re-establish rotation.",
          "sop": "VB-02 Stick-slip Control",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bit-bounce",
        "familyId": "bha",
        "name": "Bit bounce",
        "code": "DW-BHA-08",
        "description": "No action. Axial signature is normal for this BHA and formation.",
        "record": {
          "id": "bit-bounce",
          "familyId": "bha",
          "code": "DW-BHA-08",
          "name": "Bit bounce",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.76,
          "evidence": [
            "Axial vibration 0.5 g RMS",
            "WOB oscillation band 1.8 klbf — within the normal range for a PDC bit"
          ],
          "causes": [
            {
              "t": "No axial resonance present",
              "p": 0.76
            },
            {
              "t": "Low-level bounce masked by the shock sub",
              "p": 0.24
            }
          ],
          "recommendedAction": "No action. Axial signature is normal for this BHA and formation.",
          "constraints": "Axial vibration ceiling 2.0 g RMS.",
          "escalation": "Axial vibration above 2.0 g RMS with WOB fluctuation over 4 klbf → reduce WOB and change rpm.",
          "sop": "VB-01 Vibration Mitigation",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "lateral-shock-whirl",
        "familyId": "bha",
        "name": "Lateral shock / whirl",
        "code": "DW-BHA-09",
        "description": "Reduce rpm to 96 and hold WOB. If shocks persist, reduce ROP rather than adding weight.",
        "record": {
          "id": "lateral-shock-whirl",
          "familyId": "bha",
          "code": "DW-BHA-09",
          "name": "Lateral shock / whirl",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.57,
          "evidence": [
            "Shock counts 42/min in the 50–100 g band, up from 11/min",
            "downhole lateral 1.8 g RMS"
          ],
          "causes": [
            {
              "t": "Interbedded stringers exciting lateral modes",
              "p": 0.53
            },
            {
              "t": "BHA under-stabilised for this hole size",
              "p": 0.32
            },
            {
              "t": "Whirl developing at the bit",
              "p": 0.15
            }
          ],
          "recommendedAction": "Reduce rpm to 96 and hold WOB. If shocks persist, reduce ROP rather than adding weight.",
          "constraints": "Shock-count ceiling 100/min before cumulative tool damage is assumed.",
          "escalation": "Shock counts above 150/min for 5 min → stop drilling and change the rpm/WOB combination.",
          "sop": "VB-03 Shock & Vibration Limits",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "torsional-vibration",
        "familyId": "bha",
        "name": "Torsional vibration",
        "code": "DW-BHA-10",
        "description": "Engage soft-torque. Raise rpm out of the resonance band. Do not attempt to control it with WOB alone.",
        "record": {
          "id": "torsional-vibration",
          "familyId": "bha",
          "code": "DW-BHA-10",
          "name": "Torsional vibration",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.68,
          "evidence": [
            "Torsional oscillation amplitude 2,100 ft-lbf at 0.42 Hz",
            "correlates with the stick-slip signature"
          ],
          "causes": [
            {
              "t": "Stick-slip torsional mode",
              "p": 0.62
            },
            {
              "t": "Drill-string torsional resonance at current rpm",
              "p": 0.24
            },
            {
              "t": "Top-drive control loop interaction",
              "p": 0.14
            }
          ],
          "recommendedAction": "Engage soft-torque. Raise rpm out of the resonance band. Do not attempt to control it with WOB alone.",
          "constraints": "Torque hard limit 28,000 ft-lbf. Do not disable soft-torque without the engineer's approval.",
          "escalation": "Amplitude exceeding 3,500 ft-lbf → stop drilling and lift off bottom.",
          "sop": "VB-02 Stick-slip Control",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "axial-vibration",
        "familyId": "bha",
        "name": "Axial vibration",
        "code": "DW-BHA-11",
        "description": "No action.",
        "record": {
          "id": "axial-vibration",
          "familyId": "bha",
          "code": "DW-BHA-11",
          "name": "Axial vibration",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.74,
          "evidence": [
            "Axial RMS 0.5 g",
            "no dominant frequency at the bit-cutter passing rate"
          ],
          "causes": [
            {
              "t": "No axial excitation",
              "p": 0.74
            },
            {
              "t": "Damped by the horizontal section",
              "p": 0.26
            }
          ],
          "recommendedAction": "No action.",
          "constraints": "Axial vibration ceiling 2.0 g RMS.",
          "escalation": "Axial RMS above 2.0 g → reduce WOB in 2 klbf steps.",
          "sop": "VB-01 Vibration Mitigation",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bha-whirl-instability",
        "familyId": "bha",
        "name": "BHA whirl / instability",
        "code": "DW-BHA-12",
        "description": "Change the rpm/WOB combination away from the whirl band. Plan a stabiliser gauge check on the next trip.",
        "record": {
          "id": "bha-whirl-instability",
          "familyId": "bha",
          "code": "DW-BHA-12",
          "name": "BHA whirl / instability",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.51,
          "evidence": [
            "Backward-whirl indicator present for 90 s intervals",
            "stabiliser wear model predicts 18% gauge loss"
          ],
          "causes": [
            {
              "t": "Under-gauge stabilisers at 4,880 m",
              "p": 0.48
            },
            {
              "t": "Whirl propagating up from the bit",
              "p": 0.35
            },
            {
              "t": "Hole enlargement reducing BHA support",
              "p": 0.17
            }
          ],
          "recommendedAction": "Change the rpm/WOB combination away from the whirl band. Plan a stabiliser gauge check on the next trip.",
          "constraints": "Do not run rpm in the 105–125 band while the whirl indicator is active.",
          "escalation": "Whirl indicator persisting after two rpm changes → pull and inspect the BHA.",
          "sop": "VB-04 BHA Dynamics",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "motor-stall",
        "familyId": "bha",
        "name": "Motor stall",
        "code": "DW-BHA-13",
        "description": "No action.",
        "record": {
          "id": "motor-stall",
          "familyId": "bha",
          "code": "DW-BHA-13",
          "name": "Motor stall",
          "state": "Not applicable",
          "severity": "info",
          "confidence": 0.94,
          "evidence": [
            "Rotary steerable system in use",
            "no positive-displacement motor in the BHA"
          ],
          "causes": [
            {
              "t": "No motor in the string",
              "p": 0.94
            },
            {
              "t": "Reference entry only",
              "p": 0.06
            }
          ],
          "recommendedAction": "No action.",
          "constraints": "Not applicable to the current BHA.",
          "escalation": "Reactivate if a motor BHA is run for the sidetrack contingency.",
          "sop": "BT-06 Motor Operating Limits",
          "owner": "Directional Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "turbine-or-rss-dysfunction",
        "familyId": "bha",
        "name": "Turbine or RSS dysfunction",
        "code": "DW-BHA-14",
        "description": "Increase steering demand to compensate and survey every 15 m. Plan an RSS change at the next bit trip.",
        "record": {
          "id": "turbine-or-rss-dysfunction",
          "familyId": "bha",
          "code": "DW-BHA-14",
          "name": "Turbine or RSS dysfunction",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.53,
          "evidence": [
            "Steering response 78% of commanded over the last 3 surveys",
            "toolface scatter ±14°",
            "RSS actuator current elevated 12%"
          ],
          "causes": [
            {
              "t": "Actuator wear reducing pad force",
              "p": 0.46
            },
            {
              "t": "Cuttings interference at the pads",
              "p": 0.34
            },
            {
              "t": "Formation hardness limiting side-cutting",
              "p": 0.2
            }
          ],
          "recommendedAction": "Increase steering demand to compensate and survey every 15 m. Plan an RSS change at the next bit trip.",
          "constraints": "Do not exceed the RSS maximum DLS of 6°/30 m in this hole size.",
          "escalation": "Steering response below 60%, or toolface control lost → stop steering, evaluate trajectory and plan a trip.",
          "sop": "DD-02 RSS Performance Management",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "mwd-lwd-tool-failure",
        "familyId": "bha",
        "name": "MWD / LWD tool failure",
        "code": "DW-BHA-15",
        "description": "No action. Continue monitoring the decode success rate.",
        "record": {
          "id": "mwd-lwd-tool-failure",
          "familyId": "bha",
          "code": "DW-BHA-15",
          "name": "MWD / LWD tool failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "All MWD channels decoding",
            "survey success rate 100% over the last 20 surveys",
            "telemetry quality 94%"
          ],
          "causes": [
            {
              "t": "Tools healthy",
              "p": 0.9
            },
            {
              "t": "Intermittent decode below alarm threshold",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. Continue monitoring the decode success rate.",
          "constraints": "Survey acceptance requires a decode quality above 85%.",
          "escalation": "Two consecutive failed surveys, or telemetry loss over 10 min → stop drilling and troubleshoot.",
          "sop": "DM-06 Downhole Telemetry Assurance",
          "owner": "Directional Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "toolface-control-failure",
        "familyId": "bha",
        "name": "Toolface-control failure",
        "code": "DW-BHA-16",
        "description": "No action while rotating.",
        "record": {
          "id": "toolface-control-failure",
          "familyId": "bha",
          "code": "DW-BHA-16",
          "name": "Toolface-control failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.83,
          "evidence": [
            "Rotary drilling — no sliding in progress",
            "last slide held toolface within ±12°"
          ],
          "causes": [
            {
              "t": "Not sliding",
              "p": 0.83
            },
            {
              "t": "Reference entry only",
              "p": 0.17
            }
          ],
          "recommendedAction": "No action while rotating.",
          "constraints": "Toolface control tolerance ±15° during slides.",
          "escalation": "Toolface scatter above ±25° during a slide → stop, re-orient and re-establish before continuing.",
          "sop": "DD-03 Slide Drilling Control",
          "owner": "Directional Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "drillstring-buckling",
        "familyId": "bha",
        "name": "Drillstring buckling",
        "code": "DW-BHA-17",
        "description": "Plan for a friction-reduction sweep and consider a drilling agent before 4,940 m. Do not add WOB to force ROP.",
        "record": {
          "id": "drillstring-buckling",
          "familyId": "bha",
          "code": "DW-BHA-17",
          "name": "Drillstring buckling",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.49,
          "evidence": [
            "Torque-and-drag model shows sinusoidal buckling onset at 4,940 m for the current WOB",
            "54 m of margin remaining"
          ],
          "causes": [
            {
              "t": "Weight transfer limit approaching in the horizontal",
              "p": 0.58
            },
            {
              "t": "Friction factor higher than modelled",
              "p": 0.27
            },
            {
              "t": "Model tension profile stale",
              "p": 0.15
            }
          ],
          "recommendedAction": "Plan for a friction-reduction sweep and consider a drilling agent before 4,940 m. Do not add WOB to force ROP.",
          "constraints": "Sinusoidal buckling limit 24.6 klbf WOB at current depth; helical limit 31 klbf. Do not exceed 24 klbf.",
          "escalation": "Measured WOB transfer falling below 80% of applied → stop, re-model and reduce the drilling parameters.",
          "sop": "TD-02 Buckling & Weight Transfer",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "twist-off-drillstring-failure-risk",
        "familyId": "bha",
        "name": "Twist-off / drillstring failure risk",
        "code": "DW-BHA-18",
        "description": "Manage stick-slip to reduce torsional cycling. Schedule an inspection of the joints that have passed the dogleg most often.",
        "record": {
          "id": "twist-off-drillstring-failure-risk",
          "familyId": "bha",
          "code": "DW-BHA-18",
          "name": "Twist-off / drillstring failure risk",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.47,
          "evidence": [
            "Cumulative fatigue index 0.34 for the 5⅞\" HWDP at the 4.8°/30 m dogleg",
            "62 rotating hours accumulated in that dogleg"
          ],
          "causes": [
            {
              "t": "Cyclic bending fatigue at the dogleg",
              "p": 0.57
            },
            {
              "t": "Torsional overload during stick-slip",
              "p": 0.28
            },
            {
              "t": "Corrosion pitting in the SBM",
              "p": 0.15
            }
          ],
          "recommendedAction": "Manage stick-slip to reduce torsional cycling. Schedule an inspection of the joints that have passed the dogleg most often.",
          "constraints": "Fatigue index limit 0.70 before mandatory inspection. Maximum torque 28,000 ft-lbf.",
          "escalation": "Fatigue index above 0.60, or an unexplained torque/SPP drop → stop and pull for inspection.",
          "sop": "TD-03 Drillstring Fatigue Management",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "washout-leak-in-drillstring",
        "familyId": "bha",
        "name": "Washout / leak in drillstring",
        "code": "DW-BHA-19",
        "description": "No action. The SPP trend is attributed to the annulus, not the string.",
        "record": {
          "id": "washout-leak-in-drillstring",
          "familyId": "bha",
          "code": "DW-BHA-19",
          "name": "Washout / leak in drillstring",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.82,
          "evidence": [
            "SPP rise, not a fall",
            "pressure/flow ratio consistent with the annulus",
            "no drop in the pressure-drop signature"
          ],
          "causes": [
            {
              "t": "No string washout",
              "p": 0.82
            },
            {
              "t": "Early pinhole below detection",
              "p": 0.18
            }
          ],
          "recommendedAction": "No action. The SPP trend is attributed to the annulus, not the string.",
          "constraints": "A washout is indicated by a falling SPP at constant flow — the opposite of the current trend.",
          "escalation": "SPP falling more than 200 psi at constant flow → stop, pull and inspect for a washout.",
          "sop": "HY-03 Standpipe Pressure Diagnostics",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "connection-failure-back-off-risk",
        "familyId": "bha",
        "name": "Connection failure / back-off risk",
        "code": "DW-BHA-20",
        "description": "No action. Continue logging make-up torque for every connection.",
        "record": {
          "id": "connection-failure-back-off-risk",
          "familyId": "bha",
          "code": "DW-BHA-20",
          "name": "Connection failure / back-off risk",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.86,
          "evidence": [
            "All connections made up within the torque window",
            "no make-up torque anomalies logged in the last 30 stands"
          ],
          "causes": [
            {
              "t": "Connections sound",
              "p": 0.86
            },
            {
              "t": "Under-torqued joint below detection",
              "p": 0.14
            }
          ],
          "recommendedAction": "No action. Continue logging make-up torque for every connection.",
          "constraints": "Make-up torque window 28,000–32,000 ft-lbf for 5⅞\" connections. Never exceed 32,000 ft-lbf.",
          "escalation": "Any connection outside the torque window, or a back-off indication → stop and re-make the connection.",
          "sop": "RE-03 Connection Make-up Control",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "rop",
    "no": 5,
    "slug": "rop",
    "name": "5. ROP, MSE & formation-transition",
    "description": "Operational classification and incident procedures for rop, mse & formation-transition incidents.",
    "typesCount": 11,
    "activeCount": 6,
    "criticalCount": 0,
    "warningCount": 2,
    "advisoryCount": 4,
    "incidentTypes": [
      {
        "id": "unexpected-rop-reduction",
        "familyId": "rop",
        "name": "Unexpected ROP reduction",
        "code": "DW-ROP-01",
        "description": "Treat the hole-cleaning advisory first — do not chase ROP with WOB. Re-assess ROP after one clean bottoms-up.",
        "record": {
          "id": "unexpected-rop-reduction",
          "familyId": "rop",
          "code": "DW-ROP-01",
          "name": "Unexpected ROP reduction",
          "state": "Active",
          "severity": "warn",
          "confidence": 0.78,
          "evidence": [
            "ROP 34.2 m/hr against a 42.0 m/hr target, −16% in 10 min",
            "WOB and RPM unchanged",
            "torque and SPP rising together"
          ],
          "causes": [
            {
              "t": "Cuttings loading absorbing hydraulic and mechanical energy",
              "p": 0.61
            },
            {
              "t": "Progressive bit wear",
              "p": 0.24
            },
            {
              "t": "Harder interbedded stringer",
              "p": 0.15
            }
          ],
          "recommendedAction": "Treat the hole-cleaning advisory first — do not chase ROP with WOB. Re-assess ROP after one clean bottoms-up.",
          "constraints": "WOB ceiling 24 klbf. ROP target reduced to 37 m/hr while the hole-cleaning advisory is open.",
          "escalation": "ROP falling below 25 m/hr with rising MSE → stop drilling and run a full parameter-stepping test.",
          "sop": "PF-01 ROP Optimisation & Diagnosis",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "unexpected-rop-surge",
        "familyId": "rop",
        "name": "Unexpected ROP surge",
        "code": "DW-ROP-02",
        "description": "No action. Drilling-break detection is armed at +40% over 3 m.",
        "record": {
          "id": "unexpected-rop-surge",
          "familyId": "rop",
          "code": "DW-ROP-02",
          "name": "Unexpected ROP surge",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.8,
          "evidence": [
            "No ROP spike in the last 4 hours",
            "drilling-break threshold set at +40% over a 3 m rolling window"
          ],
          "causes": [
            {
              "t": "No drilling break",
              "p": 0.8
            },
            {
              "t": "Small break within noise band",
              "p": 0.2
            }
          ],
          "recommendedAction": "No action. Drilling-break detection is armed at +40% over 3 m.",
          "constraints": "Any drilling break requires a flow-check before drilling more than 5 m of new formation.",
          "escalation": "ROP increasing more than 40% over 3 m → stop, flow-check for 10 min before continuing.",
          "sop": "WC-02 Pore Pressure Surveillance",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "mse-increase",
        "familyId": "rop",
        "name": "MSE increase",
        "code": "DW-ROP-03",
        "description": "Run a controlled parameter-stepping test after the hole is clean: WOB 20/22/24 klbf at 118 rpm, then rpm 100/118/135 at best WOB.",
        "record": {
          "id": "mse-increase",
          "familyId": "rop",
          "code": "DW-ROP-03",
          "name": "MSE increase",
          "state": "Active",
          "severity": "warn",
          "confidence": 0.75,
          "evidence": [
            "MSE 16,800 psi against a 14,000–16,000 psi target",
            "mechanical efficiency 0.31, down from 0.42 six hours ago"
          ],
          "causes": [
            {
              "t": "Energy lost to the cuttings bed and friction",
              "p": 0.55
            },
            {
              "t": "Bit wear reducing cutting efficiency",
              "p": 0.3
            },
            {
              "t": "Vibration dissipating energy",
              "p": 0.15
            }
          ],
          "recommendedAction": "Run a controlled parameter-stepping test after the hole is clean: WOB 20/22/24 klbf at 118 rpm, then rpm 100/118/135 at best WOB.",
          "constraints": "Test steps must stay inside the envelope: WOB below 24 klbf, rpm below 135, torque below 25,200 ft-lbf.",
          "escalation": "MSE above 19,000 psi → stop drilling; continuing destroys the bit without making hole.",
          "sop": "PF-02 MSE Surveillance",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "mse-collapse",
        "familyId": "rop",
        "name": "MSE collapse",
        "code": "DW-ROP-04",
        "description": "No action. An MSE collapse would suggest a soft stringer or a pressure transition.",
        "record": {
          "id": "mse-collapse",
          "familyId": "rop",
          "code": "DW-ROP-04",
          "name": "MSE collapse",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.84,
          "evidence": [
            "No abrupt MSE drop",
            "the trend is upward — the opposite signature"
          ],
          "causes": [
            {
              "t": "No MSE collapse",
              "p": 0.84
            },
            {
              "t": "Soft stringer masked by the rising trend",
              "p": 0.16
            }
          ],
          "recommendedAction": "No action. An MSE collapse would suggest a soft stringer or a pressure transition.",
          "constraints": "A sudden MSE fall requires a flow-check before drilling ahead.",
          "escalation": "MSE dropping more than 30% within 3 m → flow-check and confirm pore pressure.",
          "sop": "PF-02 MSE Surveillance",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "hard-stringer-encounter",
        "familyId": "rop",
        "name": "Hard stringer encounter",
        "code": "DW-ROP-05",
        "description": "Reduce WOB to 18 klbf and raise rpm to 130 through the stringer, then restore parameters. Do not force weight into it.",
        "record": {
          "id": "hard-stringer-encounter",
          "familyId": "rop",
          "code": "DW-ROP-05",
          "name": "Hard stringer encounter",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.6,
          "evidence": [
            "Two 0.6 m intervals with ROP below 12 m/hr and torque spikes of 2,400 ft-lbf in the last 40 m",
            "gamma dropping to 22 API at each"
          ],
          "causes": [
            {
              "t": "Cemented sand stringers in the interbedded sequence",
              "p": 0.66
            },
            {
              "t": "Carbonate nodule bands",
              "p": 0.22
            },
            {
              "t": "Bit damage causing local slow drilling",
              "p": 0.12
            }
          ],
          "recommendedAction": "Reduce WOB to 18 klbf and raise rpm to 130 through the stringer, then restore parameters. Do not force weight into it.",
          "constraints": "Torque spike ceiling 25,200 ft-lbf. Do not exceed 24 klbf WOB in a stringer — this is where cutters break.",
          "escalation": "Torque spikes exceeding 26,000 ft-lbf, or shock counts above 150/min → stop, lift off bottom and re-enter slowly.",
          "sop": "PF-03 Stringer & Transition Drilling",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "abrasive-formation-transition",
        "familyId": "rop",
        "name": "Abrasive formation transition",
        "code": "DW-ROP-06",
        "description": "Accept a lower ROP target. Reduce rpm to limit cutter temperature; abrasion scales with rotational distance, not weight.",
        "record": {
          "id": "abrasive-formation-transition",
          "familyId": "rop",
          "code": "DW-ROP-06",
          "name": "Abrasive formation transition",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.57,
          "evidence": [
            "Cuttings quartz content up from 38% to 61%",
            "abrasion index 0.72",
            "bit wear rate doubled over the last 8 hours"
          ],
          "causes": [
            {
              "t": "Entering the abrasive sand member",
              "p": 0.63
            },
            {
              "t": "Higher silt content in the shale",
              "p": 0.22
            },
            {
              "t": "Under-gauge stabilisers grinding",
              "p": 0.15
            }
          ],
          "recommendedAction": "Accept a lower ROP target. Reduce rpm to limit cutter temperature; abrasion scales with rotational distance, not weight.",
          "constraints": "Rotary ceiling 135 rpm in the abrasive interval to control cutter wear.",
          "escalation": "Bit wear model reaching 60% dull → plan the trip rather than drilling into a failure.",
          "sop": "BT-03 Bit Wear & Trip Decision",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "formation-pressure-transition",
        "familyId": "rop",
        "name": "Formation pressure transition",
        "code": "DW-ROP-07",
        "description": "Increase pressure-surveillance frequency to every stand. Pre-mix a 0.2 ppg weight-up. Do not raise mud weight before the trend is confirmed by two independent indicators.",
        "record": {
          "id": "formation-pressure-transition",
          "familyId": "rop",
          "code": "DW-ROP-07",
          "name": "Formation pressure transition",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.64,
          "evidence": [
            "d-exponent trending below the normal-compaction line since 4,760 m",
            "connection gas rising 42 → 74 units",
            "shale density falling"
          ],
          "causes": [
            {
              "t": "Entering a mildly overpressured sand",
              "p": 0.58
            },
            {
              "t": "Undercompaction in the shale package",
              "p": 0.27
            },
            {
              "t": "Gas effect on the d-exponent",
              "p": 0.15
            }
          ],
          "recommendedAction": "Increase pressure-surveillance frequency to every stand. Pre-mix a 0.2 ppg weight-up. Do not raise mud weight before the trend is confirmed by two independent indicators.",
          "constraints": "Overbalance floor 0.30 ppg; ECD ceiling 13.10 ppg — the window will not tolerate a large weight-up.",
          "escalation": "Two independent indicators confirming a ramp → stop drilling, circulate bottoms-up and weight up in a controlled step.",
          "sop": "WC-02 Pore Pressure Surveillance",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "pore-pressure-ramp",
        "familyId": "rop",
        "name": "Pore-pressure ramp",
        "code": "DW-ROP-08",
        "description": "Track overbalance every stand. Prepare the weight-up plan; execute only against confirmed indicators.",
        "record": {
          "id": "pore-pressure-ramp",
          "familyId": "rop",
          "code": "DW-ROP-08",
          "name": "Pore-pressure ramp",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.61,
          "evidence": [
            "PP model 11.62 ppg EMW, rising 0.04 ppg per 100 m over the last 300 m",
            "overbalance now 0.38 ppg"
          ],
          "causes": [
            {
              "t": "Regional pressure ramp toward the sand",
              "p": 0.6
            },
            {
              "t": "Model drift from a stale offset correlation",
              "p": 0.25
            },
            {
              "t": "Temperature correction error",
              "p": 0.15
            }
          ],
          "recommendedAction": "Track overbalance every stand. Prepare the weight-up plan; execute only against confirmed indicators.",
          "constraints": "Weight-up limited to 12.3 ppg — offset AD-04 took losses at 12.85 ppg equivalent ECD.",
          "escalation": "Overbalance below 0.20 ppg → stop drilling and weight up before continuing.",
          "sop": "WC-02 Pore Pressure Surveillance",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "depleted-zone-encounter",
        "familyId": "rop",
        "name": "Depleted-zone encounter",
        "code": "DW-ROP-09",
        "description": "Reduce ECD before entering the sand. Pre-treat the mud with sized calcium carbonate for wellbore strengthening.",
        "record": {
          "id": "depleted-zone-encounter",
          "familyId": "rop",
          "code": "DW-ROP-09",
          "name": "Depleted-zone encounter",
          "state": "Anticipated",
          "severity": "adv",
          "confidence": 0.71,
          "evidence": [
            "Offset production history shows 380 psi depletion in the target sand",
            "predicted fracture gradient falls to 12.90 ppg on entry"
          ],
          "causes": [
            {
              "t": "Producing sand depleted by 12 years of offtake",
              "p": 0.74
            },
            {
              "t": "Partial pressure support from injection",
              "p": 0.16
            },
            {
              "t": "Depletion over-estimated",
              "p": 0.1
            }
          ],
          "recommendedAction": "Reduce ECD before entering the sand. Pre-treat the mud with sized calcium carbonate for wellbore strengthening.",
          "constraints": "ECD ceiling drops to 12.80 ppg on entering the depleted sand at 4,940 m — 0.30 ppg below the current limit.",
          "escalation": "Losses on entry → stop, pull above the sand, spot a strengthening pill and re-enter with reduced ECD.",
          "sop": "LC-06 Narrow Window Drilling",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "h-s-bearing-formation",
        "familyId": "rop",
        "name": "H₂S-bearing formation",
        "code": "DW-ROP-10",
        "description": "No action. Maintain the H₂S scavenger at 2 lb/bbl and continue detector checks each tour.",
        "record": {
          "id": "h-s-bearing-formation",
          "familyId": "rop",
          "code": "DW-ROP-10",
          "name": "H₂S-bearing formation",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.88,
          "evidence": [
            "H₂S monitors reading 0 ppm at all locations",
            "formation H₂S risk rated low from offset data"
          ],
          "causes": [
            {
              "t": "No H₂S in the section",
              "p": 0.88
            },
            {
              "t": "Scavenger masking a low concentration",
              "p": 0.12
            }
          ],
          "recommendedAction": "No action. Maintain the H₂S scavenger at 2 lb/bbl and continue detector checks each tour.",
          "constraints": "H₂S alarm at 10 ppm; evacuation threshold 20 ppm. Scavenger floor 2 lb/bbl.",
          "escalation": "Any H₂S reading above 10 ppm → don breathing apparatus, muster and follow the H₂S contingency plan.",
          "sop": "HS-01 H₂S Contingency",
          "owner": "HSE Advisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "unexpected-formation-fluid-water-flow",
        "familyId": "rop",
        "name": "Unexpected formation fluid / water flow",
        "code": "DW-ROP-11",
        "description": "No action. Continue retort and chloride checks every 4 hours.",
        "record": {
          "id": "unexpected-formation-fluid-water-flow",
          "familyId": "rop",
          "code": "DW-ROP-11",
          "name": "Unexpected formation fluid / water flow",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.82,
          "evidence": [
            "Chlorides stable at 28,400 mg/L",
            "no water-phase increase in the SBM",
            "mud retort showing 71/29 oil-water ratio on programme"
          ],
          "causes": [
            {
              "t": "No water influx",
              "p": 0.82
            },
            {
              "t": "Small influx buffered by the SBM",
              "p": 0.18
            }
          ],
          "recommendedAction": "No action. Continue retort and chloride checks every 4 hours.",
          "constraints": "Oil-water ratio must stay within 70/30 ±3 to preserve rheology and ECD behaviour.",
          "escalation": "Chlorides rising more than 15%, or the water phase increasing → treat as an influx and flow-check.",
          "sop": "MD-02 Mud Contamination Monitoring",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "dd",
    "no": 6,
    "slug": "dd",
    "name": "6. Directional drilling & trajectory",
    "description": "Operational classification and incident procedures for directional drilling & trajectory incidents.",
    "typesCount": 10,
    "activeCount": 9,
    "criticalCount": 0,
    "warningCount": 1,
    "advisoryCount": 8,
    "incidentTypes": [
      {
        "id": "high-dogleg-severity",
        "familyId": "dd",
        "name": "High dogleg severity",
        "code": "DW-DD-01",
        "description": "Hold current steering demand. Plan the liner-running torque-and-drag with the actual, not planned, dogleg profile.",
        "record": {
          "id": "high-dogleg-severity",
          "familyId": "dd",
          "code": "DW-DD-01",
          "name": "High dogleg severity",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.65,
          "evidence": [
            "Maximum DLS 4.8°/30 m at 3,940 m against a 3.0°/30 m plan",
            "current DLS 1.4°/30 m"
          ],
          "causes": [
            {
              "t": "Correction run after a trajectory excursion",
              "p": 0.62
            },
            {
              "t": "RSS over-steering during the build",
              "p": 0.24
            },
            {
              "t": "Survey noise inflating the calculated DLS",
              "p": 0.14
            }
          ],
          "recommendedAction": "Hold current steering demand. Plan the liner-running torque-and-drag with the actual, not planned, dogleg profile.",
          "constraints": "Casing DLS limit for the 7\" liner is 5.5°/30 m. Fatigue limit for the drillstring is 6.0°/30 m.",
          "escalation": "DLS above 5.5°/30 m → stop steering, re-plan the trajectory and re-run the liner drag model.",
          "sop": "DD-01 Trajectory Control",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "microdoglegs-tortuosity",
        "familyId": "dd",
        "name": "Microdoglegs / tortuosity",
        "code": "DW-DD-02",
        "description": "Reduce the number of short slides. Ream each steered interval before drilling ahead.",
        "record": {
          "id": "microdoglegs-tortuosity",
          "familyId": "dd",
          "code": "DW-DD-02",
          "name": "Microdoglegs / tortuosity",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.7,
          "evidence": [
            "Tortuosity index 1.34 against an offset P50 of 1.10",
            "6 micro-doglegs above 3°/30 m in the last 500 m"
          ],
          "causes": [
            {
              "t": "Slide-rotate alternation",
              "p": 0.61
            },
            {
              "t": "RSS steering oscillation",
              "p": 0.24
            },
            {
              "t": "Survey station spacing hiding true curvature",
              "p": 0.15
            }
          ],
          "recommendedAction": "Reduce the number of short slides. Ream each steered interval before drilling ahead.",
          "constraints": "Tortuosity budget for the liner run is 1.50 — beyond that the liner may not reach TD.",
          "escalation": "Tortuosity index above 1.50 → re-forecast the liner run before drilling ahead.",
          "sop": "DD-04 Trajectory Smoothness",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "wellbore-departure-from-plan",
        "familyId": "dd",
        "name": "Wellbore departure from plan",
        "code": "DW-DD-03",
        "description": "Apply a 0.8°/30 m left correction over the next 3 stands. Do not correct aggressively — that adds tortuosity.",
        "record": {
          "id": "wellbore-departure-from-plan",
          "familyId": "dd",
          "code": "DW-DD-03",
          "name": "Wellbore departure from plan",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.68,
          "evidence": [
            "Current position 11.4 m right and 3.2 m high of plan at 4,886 m MD",
            "ellipse of uncertainty 8.9 m at 2σ"
          ],
          "causes": [
            {
              "t": "Accumulated steering bias to the right",
              "p": 0.58
            },
            {
              "t": "Formation dip pushing the bit updip",
              "p": 0.27
            },
            {
              "t": "Survey correction not yet applied",
              "p": 0.15
            }
          ],
          "recommendedAction": "Apply a 0.8°/30 m left correction over the next 3 stands. Do not correct aggressively — that adds tortuosity.",
          "constraints": "Target window at TD is ±15 m radius. Maximum correction DLS 3.0°/30 m to protect the liner run.",
          "escalation": "Departure exceeding 15 m, or moving outside the target window → stop and re-plan with the geosteering team.",
          "sop": "DD-01 Trajectory Control",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "anti-collision-proximity",
        "familyId": "dd",
        "name": "Anti-collision proximity",
        "code": "DW-DD-04",
        "description": "Maintain the planned trajectory — the separation factor is above minimum but the margin is thin. Survey every 15 m through the proximity interval.",
        "record": {
          "id": "anti-collision-proximity",
          "familyId": "dd",
          "code": "DW-DD-04",
          "name": "Anti-collision proximity",
          "state": "Watch",
          "severity": "warn",
          "confidence": 0.73,
          "evidence": [
            "Closest approach to AD-05 injector is 42 m centre-to-centre at 3,760 m MD",
            "separation factor 1.62 against a 1.50 minimum"
          ],
          "causes": [
            {
              "t": "Converging trajectories in the shallow build",
              "p": 0.64
            },
            {
              "t": "Survey uncertainty overlap between wells",
              "p": 0.26
            },
            {
              "t": "Reference-well survey quality unknown",
              "p": 0.1
            }
          ],
          "recommendedAction": "Maintain the planned trajectory — the separation factor is above minimum but the margin is thin. Survey every 15 m through the proximity interval.",
          "constraints": "Minimum separation factor 1.50. No steering that reduces separation without a written anti-collision review.",
          "escalation": "Separation factor below 1.50 → stop drilling, notify the well-planning team and do not proceed without a formal review.",
          "sop": "DD-05 Anti-collision Management",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "toolface-instability",
        "familyId": "dd",
        "name": "Toolface instability",
        "code": "DW-DD-05",
        "description": "No action while rotating.",
        "record": {
          "id": "toolface-instability",
          "familyId": "dd",
          "code": "DW-DD-05",
          "name": "Toolface instability",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.81,
          "evidence": [
            "Rotary drilling in progress — no toolface control required",
            "last slide held ±12°"
          ],
          "causes": [
            {
              "t": "Not sliding",
              "p": 0.81
            },
            {
              "t": "Reference entry",
              "p": 0.19
            }
          ],
          "recommendedAction": "No action while rotating.",
          "constraints": "Toolface tolerance ±15° during sliding.",
          "escalation": "Toolface scatter above ±25° during a slide → stop and re-orient.",
          "sop": "DD-03 Slide Drilling Control",
          "owner": "Directional Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "low-slide-efficiency",
        "familyId": "dd",
        "name": "Low slide efficiency",
        "code": "DW-DD-06",
        "description": "Use a friction-reduction sweep before the next slide. Rock the string to transfer weight rather than adding surface WOB.",
        "record": {
          "id": "low-slide-efficiency",
          "familyId": "dd",
          "code": "DW-DD-06",
          "name": "Low slide efficiency",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.59,
          "evidence": [
            "Last slide achieved 64% of the planned build rate",
            "slide ROP 11.2 m/hr against 34.2 m/hr rotating"
          ],
          "causes": [
            {
              "t": "Weight transfer lost to friction in the horizontal",
              "p": 0.6
            },
            {
              "t": "Toolface walking during the slide",
              "p": 0.25
            },
            {
              "t": "Formation resisting side-cutting",
              "p": 0.15
            }
          ],
          "recommendedAction": "Use a friction-reduction sweep before the next slide. Rock the string to transfer weight rather than adding surface WOB.",
          "constraints": "Do not exceed 24 klbf surface WOB during a slide — it buckles rather than transfers.",
          "escalation": "Slide efficiency below 50% → switch to rotary steerable correction or plan a motor BHA.",
          "sop": "DD-03 Slide Drilling Control",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "excessive-sliding",
        "familyId": "dd",
        "name": "Excessive sliding",
        "code": "DW-DD-07",
        "description": "Consolidate corrections into fewer, longer slides. Re-tune the RSS steering ratio to reduce the need to slide.",
        "record": {
          "id": "excessive-sliding",
          "familyId": "dd",
          "code": "DW-DD-07",
          "name": "Excessive sliding",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.56,
          "evidence": [
            "Slide footage 18% of the last 300 m against a 10% plan",
            "each slide adds a micro-dogleg"
          ],
          "causes": [
            {
              "t": "Trajectory corrections accumulating",
              "p": 0.57
            },
            {
              "t": "RSS steering authority reduced",
              "p": 0.28
            },
            {
              "t": "Plan too tight for the formation tendency",
              "p": 0.15
            }
          ],
          "recommendedAction": "Consolidate corrections into fewer, longer slides. Re-tune the RSS steering ratio to reduce the need to slide.",
          "constraints": "Slide footage budget 12% of section to hold tortuosity within the liner-run limit.",
          "escalation": "Slide footage above 25% of the section → re-plan the trajectory rather than continuing to correct.",
          "sop": "DD-04 Trajectory Smoothness",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "poor-steerability-in-hard-formation",
        "familyId": "dd",
        "name": "Poor steerability in hard formation",
        "code": "DW-DD-08",
        "description": "Increase steering demand through the stringers only; return to normal demand in the shale to avoid overshoot.",
        "record": {
          "id": "poor-steerability-in-hard-formation",
          "familyId": "dd",
          "code": "DW-DD-08",
          "name": "Poor steerability in hard formation",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.54,
          "evidence": [
            "Steering response 78% of commanded in the cemented stringers",
            "build rate 1.1°/30 m against a 1.6°/30 m demand"
          ],
          "causes": [
            {
              "t": "Hard stringer resisting side-cutting",
              "p": 0.59
            },
            {
              "t": "RSS pad force reduced",
              "p": 0.26
            },
            {
              "t": "Bit gauge design limiting side-cutting",
              "p": 0.15
            }
          ],
          "recommendedAction": "Increase steering demand through the stringers only; return to normal demand in the shale to avoid overshoot.",
          "constraints": "Do not exceed 6°/30 m demanded DLS — that is the RSS limit for this hole size.",
          "escalation": "Build rate below 50% of demand over two stands → plan a more aggressive BHA at the next trip.",
          "sop": "DD-02 RSS Performance Management",
          "owner": "Directional Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "casing-running-risk-from-tortuosity",
        "familyId": "dd",
        "name": "Casing-running risk from tortuosity",
        "code": "DW-DD-09",
        "description": "Ream the tortuous intervals before pulling out. Plan a dedicated conditioning trip before running the liner.",
        "record": {
          "id": "casing-running-risk-from-tortuosity",
          "familyId": "dd",
          "code": "DW-DD-09",
          "name": "Casing-running risk from tortuosity",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.63,
          "evidence": [
            "Liner-running model predicts 62 klbf of hook-load margin at TD with the actual tortuosity — down from 104 klbf on the planned profile"
          ],
          "causes": [
            {
              "t": "Accumulated micro-doglegs raising drag",
              "p": 0.64
            },
            {
              "t": "Cuttings beds adding running friction",
              "p": 0.24
            },
            {
              "t": "Friction factor assumption optimistic",
              "p": 0.12
            }
          ],
          "recommendedAction": "Ream the tortuous intervals before pulling out. Plan a dedicated conditioning trip before running the liner.",
          "constraints": "Minimum hook-load margin for the liner run is 40 klbf. Below that, rotation or flotation is required.",
          "escalation": "Predicted margin below 40 klbf → re-plan with a rotating liner hanger or a flotation collar.",
          "sop": "CS-01 Casing Running Feasibility",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "collision-risk-from-survey-uncertainty",
        "familyId": "dd",
        "name": "Collision risk from survey uncertainty",
        "code": "DW-DD-10",
        "description": "Apply MWD sag correction at this inclination. Run a gyro survey through the proximity interval on the next trip.",
        "record": {
          "id": "collision-risk-from-survey-uncertainty",
          "familyId": "dd",
          "code": "DW-DD-10",
          "name": "Collision risk from survey uncertainty",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.58,
          "evidence": [
            "Ellipse of uncertainty 8.9 m at 2σ",
            "reference well AD-05 surveyed with a 1980s gyro of unknown error model"
          ],
          "causes": [
            {
              "t": "Legacy survey with a poor error model",
              "p": 0.61
            },
            {
              "t": "MWD sag correction not applied at 86.7°",
              "p": 0.24
            },
            {
              "t": "Magnetic interference near the casing",
              "p": 0.15
            }
          ],
          "recommendedAction": "Apply MWD sag correction at this inclination. Run a gyro survey through the proximity interval on the next trip.",
          "constraints": "Minimum separation factor 1.50 must be met using the pessimistic error model, not the optimistic one.",
          "escalation": "Separation factor below 1.50 under any accepted error model → stop and escalate to well planning.",
          "sop": "DD-05 Anti-collision Management",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "mud",
    "no": 7,
    "slug": "mud",
    "name": "7. Mud-system & solids-control",
    "description": "Operational classification and incident procedures for mud-system & solids-control incidents.",
    "typesCount": 11,
    "activeCount": 6,
    "criticalCount": 0,
    "warningCount": 1,
    "advisoryCount": 5,
    "incidentTypes": [
      {
        "id": "mud-weight-drift",
        "familyId": "mud",
        "name": "Mud-weight drift",
        "code": "DW-MUD-01",
        "description": "Increase dilution rate and centrifuge throughput. Check the pit density profile at three depths per pit.",
        "record": {
          "id": "mud-weight-drift",
          "familyId": "mud",
          "code": "DW-MUD-01",
          "name": "Mud-weight drift",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.62,
          "evidence": [
            "Density-in 12.01 ppg, density-out 12.06 ppg — a 0.05 ppg differential sustained over 3 hours"
          ],
          "causes": [
            {
              "t": "Cuttings incorporation raising returns density",
              "p": 0.63
            },
            {
              "t": "Barite settling in the suction pit",
              "p": 0.22
            },
            {
              "t": "Densitometer calibration offset",
              "p": 0.15
            }
          ],
          "recommendedAction": "Increase dilution rate and centrifuge throughput. Check the pit density profile at three depths per pit.",
          "constraints": "Mud weight tolerance 12.0 ppg ±0.1. Do not correct with barite while the differential is unexplained.",
          "escalation": "Differential above 0.15 ppg → stop drilling and investigate solids loading or an influx.",
          "sop": "MD-01 Mud Weight Control",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "barite-sag",
        "familyId": "mud",
        "name": "Barite sag",
        "code": "DW-MUD-02",
        "description": "Raise the 6 rpm Fann reading from 9 to 12. Do not leave the string static without rotation in this section. Circulate and rotate before any extended stationary period.",
        "record": {
          "id": "barite-sag",
          "familyId": "mud",
          "code": "DW-MUD-02",
          "name": "Barite sag",
          "state": "Watch",
          "severity": "warn",
          "confidence": 0.66,
          "evidence": [
            "Sag factor 0.54 after the last static period",
            "density-out varied 0.18 ppg over a bottoms-up following a 40 min stationary period",
            "inclination 86.7° is the worst case for sag"
          ],
          "causes": [
            {
              "t": "Static settling in the 60–90° window",
              "p": 0.68
            },
            {
              "t": "Low low-shear-rate viscosity",
              "p": 0.2
            },
            {
              "t": "Barite particle size distribution too coarse",
              "p": 0.12
            }
          ],
          "recommendedAction": "Raise the 6 rpm Fann reading from 9 to 12. Do not leave the string static without rotation in this section. Circulate and rotate before any extended stationary period.",
          "constraints": "Sag factor limit 0.53 — above that a sag-induced density variation can breach the ECD window. Minimum 6 rpm reading 11.",
          "escalation": "Density-out varying more than 0.25 ppg over a bottoms-up → stop, condition the mud and do not trip.",
          "sop": "MD-03 Barite Sag Prevention",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "gas-cut-mud",
        "familyId": "mud",
        "name": "Gas-cut mud",
        "code": "DW-MUD-03",
        "description": "No action. Keep the degasser lined up and continue trending connection gas.",
        "record": {
          "id": "gas-cut-mud",
          "familyId": "mud",
          "code": "DW-MUD-03",
          "name": "Gas-cut mud",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.79,
          "evidence": [
            "Density-out reduction of 0.02 ppg on connections",
            "degasser online",
            "total gas 38 units"
          ],
          "causes": [
            {
              "t": "Normal connection gas",
              "p": 0.79
            },
            {
              "t": "Trip gas from swabbed volume",
              "p": 0.21
            }
          ],
          "recommendedAction": "No action. Keep the degasser lined up and continue trending connection gas.",
          "constraints": "Gas-cut density reduction above 0.3 ppg requires a flow-check.",
          "escalation": "Density-out falling more than 0.3 ppg, or gas above 250 units → flow-check.",
          "sop": "WC-04 Gas Monitoring & Trending",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "high-pv-high-ecd",
        "familyId": "mud",
        "name": "High PV / high ECD",
        "code": "DW-MUD-04",
        "description": "Increase dilution by 40 bbl/hr and run both centrifuges. Reducing PV is the cheapest available ECD margin.",
        "record": {
          "id": "high-pv-high-ecd",
          "familyId": "mud",
          "code": "DW-MUD-04",
          "name": "High PV / high ECD",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.72,
          "evidence": [
            "PV 26 cP against a 22 cP target",
            "YP 18 lb/100ft²",
            "low-gravity solids 7.2% against a 6% ceiling"
          ],
          "causes": [
            {
              "t": "Drilled solids accumulating in the active system",
              "p": 0.66
            },
            {
              "t": "Insufficient centrifuge capacity",
              "p": 0.22
            },
            {
              "t": "Emulsion tightening with temperature",
              "p": 0.12
            }
          ],
          "recommendedAction": "Increase dilution by 40 bbl/hr and run both centrifuges. Reducing PV is the cheapest available ECD margin.",
          "constraints": "PV ceiling 28 cP. Low-gravity solids ceiling 6%. ECD ceiling 13.10 ppg.",
          "escalation": "PV above 30 cP, or LGS above 8% → stop drilling and dedicate a conditioning cycle.",
          "sop": "MD-05 Solids Control & Dilution",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "low-yp-poor-carrying-capacity",
        "familyId": "mud",
        "name": "Low YP / poor carrying capacity",
        "code": "DW-MUD-05",
        "description": "Add organophilic clay to raise the 6 rpm reading to 12 and YP to 22. This is the primary fix for the hole-cleaning advisory.",
        "record": {
          "id": "low-yp-poor-carrying-capacity",
          "familyId": "mud",
          "code": "DW-MUD-05",
          "name": "Low YP / poor carrying capacity",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.69,
          "evidence": [
            "YP 18 lb/100ft² against a 22–26 target for 86.7° hole",
            "6 rpm reading 9 against an 11 minimum"
          ],
          "causes": [
            {
              "t": "Emulsifier depletion reducing gel structure",
              "p": 0.55
            },
            {
              "t": "Dilution outpacing viscosifier addition",
              "p": 0.31
            },
            {
              "t": "Temperature thinning at 118 °C bottomhole",
              "p": 0.14
            }
          ],
          "recommendedAction": "Add organophilic clay to raise the 6 rpm reading to 12 and YP to 22. This is the primary fix for the hole-cleaning advisory.",
          "constraints": "Raise YP in steps of 2 lb/100ft² and re-check ECD after each — viscosity raises ECD as well as carrying capacity.",
          "escalation": "6 rpm reading below 8 with cuttings return falling → stop drilling and treat the mud before continuing.",
          "sop": "MD-06 Rheology Management",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "high-gels-surge-swab-risk",
        "familyId": "mud",
        "name": "High gels / surge-swab risk",
        "code": "DW-MUD-06",
        "description": "No action. Break circulation in stages before running in below the shoe.",
        "record": {
          "id": "high-gels-surge-swab-risk",
          "familyId": "mud",
          "code": "DW-MUD-06",
          "name": "High gels / surge-swab risk",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.77,
          "evidence": [
            "10 s / 10 min gels 8/14 lb/100ft² — progressive, not flat",
            "break-circulation pressure modelled at 620 psi"
          ],
          "causes": [
            {
              "t": "Gel structure within design",
              "p": 0.77
            },
            {
              "t": "Gels rising with solids loading",
              "p": 0.23
            }
          ],
          "recommendedAction": "No action. Break circulation in stages before running in below the shoe.",
          "constraints": "Break-circulation pressure ceiling 900 psi. 10 min gel ceiling 22 lb/100ft².",
          "escalation": "10 min gels above 22 lb/100ft² → treat before tripping to avoid surge and swab excursions.",
          "sop": "MD-06 Rheology Management",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "fluid-loss-control-failure",
        "familyId": "mud",
        "name": "Fluid loss-control failure",
        "code": "DW-MUD-07",
        "description": "Add filtration-control additive to bring HPHT loss below 3.5 mL. A thick cake is the precondition for differential sticking.",
        "record": {
          "id": "fluid-loss-control-failure",
          "familyId": "mud",
          "code": "DW-MUD-07",
          "name": "Fluid loss-control failure",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.58,
          "evidence": [
            "HPHT fluid loss 4.8 mL/30 min against a 3.0 mL target",
            "filter cake 2.4 mm, thicker than the 1.5 mm design"
          ],
          "causes": [
            {
              "t": "Filtration additive depleted",
              "p": 0.6
            },
            {
              "t": "Solids distribution degraded by shearing",
              "p": 0.26
            },
            {
              "t": "Temperature exceeding additive stability",
              "p": 0.14
            }
          ],
          "recommendedAction": "Add filtration-control additive to bring HPHT loss below 3.5 mL. A thick cake is the precondition for differential sticking.",
          "constraints": "HPHT fluid loss ceiling 5.0 mL/30 min. Filter cake ceiling 2.0 mm across permeable sands.",
          "escalation": "HPHT loss above 6 mL, or cake thicker than 3 mm → stop drilling before entering the permeable sand.",
          "sop": "MD-07 Filtration Control",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "mud-contamination",
        "familyId": "mud",
        "name": "Mud contamination",
        "code": "DW-MUD-08",
        "description": "No action. Continue the standard mud check schedule every 4 hours.",
        "record": {
          "id": "mud-contamination",
          "familyId": "mud",
          "code": "DW-MUD-08",
          "name": "Mud contamination",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.84,
          "evidence": [
            "Chlorides 28,400 mg/L stable",
            "calcium 420 mg/L",
            "no cement or water contamination indicators"
          ],
          "causes": [
            {
              "t": "System clean",
              "p": 0.84
            },
            {
              "t": "Low-level contamination below detection",
              "p": 0.16
            }
          ],
          "recommendedAction": "No action. Continue the standard mud check schedule every 4 hours.",
          "constraints": "Calcium ceiling 800 mg/L before emulsion stability is affected.",
          "escalation": "A step change in chlorides, calcium or pH → stop and identify the contaminant before treating.",
          "sop": "MD-02 Mud Contamination Monitoring",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "solids-overload",
        "familyId": "mud",
        "name": "Solids overload",
        "code": "DW-MUD-09",
        "description": "Change to finer shaker screens and raise centrifuge feed rate. Increase dilution 40 bbl/hr.",
        "record": {
          "id": "solids-overload",
          "familyId": "mud",
          "code": "DW-MUD-09",
          "name": "Solids overload",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.71,
          "evidence": [
            "Low-gravity solids 7.2% against a 6.0% ceiling",
            "total solids 24.1%",
            "shaker screen loading 88%"
          ],
          "causes": [
            {
              "t": "Drilled solids not removed at the shakers",
              "p": 0.62
            },
            {
              "t": "Screen mesh too coarse for the cuttings size",
              "p": 0.24
            },
            {
              "t": "Centrifuge underfeeding",
              "p": 0.14
            }
          ],
          "recommendedAction": "Change to finer shaker screens and raise centrifuge feed rate. Increase dilution 40 bbl/hr.",
          "constraints": "LGS ceiling 6%. Do not raise dilution beyond available mixing and storage capacity.",
          "escalation": "LGS above 9% → stop drilling; the mud can no longer be conditioned while making hole.",
          "sop": "MD-05 Solids Control & Dilution",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "shaker-centrifuge-failure",
        "familyId": "mud",
        "name": "Shaker / centrifuge failure",
        "code": "DW-MUD-10",
        "description": "No action. Continue equipment checks each tour.",
        "record": {
          "id": "shaker-centrifuge-failure",
          "familyId": "mud",
          "code": "DW-MUD-10",
          "name": "Shaker / centrifuge failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.86,
          "evidence": [
            "4 of 4 shakers online",
            "both centrifuges running",
            "screen differential pressure normal"
          ],
          "causes": [
            {
              "t": "Solids-control equipment healthy",
              "p": 0.86
            },
            {
              "t": "Degraded performance below alarm",
              "p": 0.14
            }
          ],
          "recommendedAction": "No action. Continue equipment checks each tour.",
          "constraints": "Minimum 3 shakers online to sustain the current flow rate at this ROP.",
          "escalation": "Falling below 3 shakers online → reduce ROP to match the remaining solids-removal capacity.",
          "sop": "RE-06 Solids Control Equipment",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "mud-cooling-heating-anomaly",
        "familyId": "mud",
        "name": "Mud cooling / heating anomaly",
        "code": "DW-MUD-11",
        "description": "No action. Continue trending flow-line temperature against depth.",
        "record": {
          "id": "mud-cooling-heating-anomaly",
          "familyId": "mud",
          "code": "DW-MUD-11",
          "name": "Mud cooling / heating anomaly",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.8,
          "evidence": [
            "Flow-line temperature 62 °C, in-line 44 °C",
            "both within the 8-hour trend band"
          ],
          "causes": [
            {
              "t": "Normal thermal behaviour",
              "p": 0.8
            },
            {
              "t": "Cooler fouling starting",
              "p": 0.2
            }
          ],
          "recommendedAction": "No action. Continue trending flow-line temperature against depth.",
          "constraints": "Flow-line ceiling 75 °C for SBM additive stability.",
          "escalation": "Flow-line temperature above 75 °C → reduce circulation temperature; additive degradation follows.",
          "sop": "MD-08 Mud Temperature Management",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "hyd",
    "no": 8,
    "slug": "hyd",
    "name": "8. Hydraulics, pumps & circulation",
    "description": "Operational classification and incident procedures for hydraulics, pumps & circulation incidents.",
    "typesCount": 9,
    "activeCount": 6,
    "criticalCount": 0,
    "warningCount": 2,
    "advisoryCount": 4,
    "incidentTypes": [
      {
        "id": "standpipe-pressure-high",
        "familyId": "hyd",
        "name": "Standpipe pressure high",
        "code": "DW-HYD-01",
        "description": "Do not raise flow to overcome it — that raises ECD into the restriction. Address hole cleaning first, then re-evaluate.",
        "record": {
          "id": "standpipe-pressure-high",
          "familyId": "hyd",
          "code": "DW-HYD-01",
          "name": "Standpipe pressure high",
          "state": "Active",
          "severity": "warn",
          "confidence": 0.8,
          "evidence": [
            "SPP 3,740 psi, +8% in 10 min at an unchanged 540 gpm",
            "system pressure loss up 278 psi",
            "bit pressure drop unchanged at 1,180 psi"
          ],
          "causes": [
            {
              "t": "Annular restriction from cuttings loading",
              "p": 0.66
            },
            {
              "t": "Rising PV increasing frictional loss",
              "p": 0.21
            },
            {
              "t": "Partial nozzle restriction",
              "p": 0.13
            }
          ],
          "recommendedAction": "Do not raise flow to overcome it — that raises ECD into the restriction. Address hole cleaning first, then re-evaluate.",
          "constraints": "SPP warning 4,000 psi; hard limit 4,500 psi. Pump relief valve set at 5,000 psi.",
          "escalation": "SPP above 4,000 psi, or a further 5% rise → stop drilling and follow the pack-off procedure.",
          "sop": "HY-03 Standpipe Pressure Diagnostics",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "standpipe-pressure-low",
        "familyId": "hyd",
        "name": "Standpipe pressure low",
        "code": "DW-HYD-02",
        "description": "No action. A falling SPP would indicate a washout, a dropped nozzle or a pump problem.",
        "record": {
          "id": "standpipe-pressure-low",
          "familyId": "hyd",
          "code": "DW-HYD-02",
          "name": "Standpipe pressure low",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.85,
          "evidence": [
            "SPP is rising, not falling",
            "pump efficiency 96%",
            "no washout signature"
          ],
          "causes": [
            {
              "t": "No low-pressure condition",
              "p": 0.85
            },
            {
              "t": "Small leak masked by the rising annular loss",
              "p": 0.15
            }
          ],
          "recommendedAction": "No action. A falling SPP would indicate a washout, a dropped nozzle or a pump problem.",
          "constraints": "A 200 psi fall at constant flow is the washout threshold.",
          "escalation": "SPP falling more than 200 psi at constant flow → stop and investigate a string washout.",
          "sop": "HY-03 Standpipe Pressure Diagnostics",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "flow-in-loss",
        "familyId": "hyd",
        "name": "Flow-in loss",
        "code": "DW-HYD-03",
        "description": "No action. Keep pump 3 lined up and ready.",
        "record": {
          "id": "flow-in-loss",
          "familyId": "hyd",
          "code": "DW-HYD-03",
          "name": "Flow-in loss",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.88,
          "evidence": [
            "Flow-in steady at 540 gpm",
            "pumps 1 and 2 online, pump 3 on standby",
            "stroke rate stable"
          ],
          "causes": [
            {
              "t": "Pump system healthy",
              "p": 0.88
            },
            {
              "t": "Small stroke-counter error",
              "p": 0.12
            }
          ],
          "recommendedAction": "No action. Keep pump 3 lined up and ready.",
          "constraints": "Minimum flow for hole cleaning at this angle is 520 gpm. Below that, stop drilling.",
          "escalation": "Flow-in falling below 520 gpm → stop drilling; the hole cannot be cleaned at that rate.",
          "sop": "HY-01 Circulating System Management",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "flow-out-mismatch",
        "familyId": "hyd",
        "name": "Flow-out mismatch",
        "code": "DW-HYD-04",
        "description": "Flow-check at the next connection. Use the trip tank as the arbiter until the flow sensors agree.",
        "record": {
          "id": "flow-out-mismatch",
          "familyId": "hyd",
          "code": "DW-HYD-04",
          "name": "Flow-out mismatch",
          "state": "Monitoring",
          "severity": "adv",
          "confidence": 0.67,
          "evidence": [
            "Flow-out 4.1% above flow-in over 6 min",
            "trip tank agrees with paddle, not with the Coriolis"
          ],
          "causes": [
            {
              "t": "Coriolis calibration drift",
              "p": 0.51
            },
            {
              "t": "Small influx",
              "p": 0.29
            },
            {
              "t": "Wellbore ballooning",
              "p": 0.2
            }
          ],
          "recommendedAction": "Flow-check at the next connection. Use the trip tank as the arbiter until the flow sensors agree.",
          "constraints": "Never silence a flow alarm to clear a nuisance. Kick-detection thresholds remain as configured.",
          "escalation": "Mismatch above 6%, or a pit gain confirmed on the trip tank → hard shut-in per procedure.",
          "sop": "WC-01 Flow-check & Hard Shut-in",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "pump-failure-degraded-efficiency",
        "familyId": "hyd",
        "name": "Pump failure / degraded efficiency",
        "code": "DW-HYD-05",
        "description": "Rotate pump 1 to standby and bring pump 3 online at the next connection. Inspect valves and seats.",
        "record": {
          "id": "pump-failure-degraded-efficiency",
          "familyId": "hyd",
          "code": "DW-HYD-05",
          "name": "Pump failure / degraded efficiency",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.55,
          "evidence": [
            "Pump 1 volumetric efficiency 92%, down from 97% over 12 hours",
            "discharge pressure fluctuation band widened 40 psi"
          ],
          "causes": [
            {
              "t": "Valve or seat wear on pump 1",
              "p": 0.62
            },
            {
              "t": "Liner wear",
              "p": 0.23
            },
            {
              "t": "Suction starvation at the current rate",
              "p": 0.15
            }
          ],
          "recommendedAction": "Rotate pump 1 to standby and bring pump 3 online at the next connection. Inspect valves and seats.",
          "constraints": "Two pumps must remain available at all times while drilling. Do not exceed 95% of rated pump pressure.",
          "escalation": "Efficiency below 88%, or losing a second pump → reduce ROP to the flow the remaining pumps can sustain.",
          "sop": "RE-05 Mud Pump Maintenance",
          "owner": "Toolpusher",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "pulse-dampener-issue",
        "familyId": "hyd",
        "name": "Pulse dampener issue",
        "code": "DW-HYD-06",
        "description": "No action. Continue monitoring the MWD decode quality as a secondary indicator.",
        "record": {
          "id": "pulse-dampener-issue",
          "familyId": "hyd",
          "code": "DW-HYD-06",
          "name": "Pulse dampener issue",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.83,
          "evidence": [
            "Discharge pressure ripple 42 psi peak-to-peak, within the 60 psi limit",
            "MWD decode quality 94%"
          ],
          "causes": [
            {
              "t": "Dampeners charged correctly",
              "p": 0.83
            },
            {
              "t": "Slow charge loss below threshold",
              "p": 0.17
            }
          ],
          "recommendedAction": "No action. Continue monitoring the MWD decode quality as a secondary indicator.",
          "constraints": "Pressure ripple ceiling 60 psi peak-to-peak to preserve MWD telemetry.",
          "escalation": "Ripple above 60 psi, or decode quality below 85% → check the dampener charge before losing telemetry.",
          "sop": "RE-05 Mud Pump Maintenance",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "hydraulic-horsepower-mismatch",
        "familyId": "hyd",
        "name": "Hydraulic horsepower mismatch",
        "code": "DW-HYD-07",
        "description": "Plan a smaller total flow area on the next bit to recover bit hydraulics without raising surface pressure.",
        "record": {
          "id": "hydraulic-horsepower-mismatch",
          "familyId": "hyd",
          "code": "DW-HYD-07",
          "name": "Hydraulic horsepower mismatch",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.6,
          "evidence": [
            "Hydraulic horsepower per square inch at the bit 2.1 against a 2.8–3.5 target",
            "jet impact force 640 lbf"
          ],
          "causes": [
            {
              "t": "Flow rate below the design point for this TFA",
              "p": 0.64
            },
            {
              "t": "Nozzle area too large for the available pressure",
              "p": 0.24
            },
            {
              "t": "Pressure budget consumed by the annulus",
              "p": 0.12
            }
          ],
          "recommendedAction": "Plan a smaller total flow area on the next bit to recover bit hydraulics without raising surface pressure.",
          "constraints": "Available surface pressure is capped at 4,000 psi (warning). Do not close TFA beyond what the pumps can deliver.",
          "escalation": "HSI below 1.5 with the cuttings-loading index rising → cleaning at the bit face is inadequate; plan a bit change.",
          "sop": "HY-02 Hydraulics Optimisation",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "plugged-annulus-restricted-returns",
        "familyId": "hyd",
        "name": "Plugged annulus / restricted returns",
        "code": "DW-HYD-08",
        "description": "Maintain rotation and circulation. Do not stop the pumps with the string on bottom. Work the string over the last stand.",
        "record": {
          "id": "plugged-annulus-restricted-returns",
          "familyId": "hyd",
          "code": "DW-HYD-08",
          "name": "Plugged annulus / restricted returns",
          "state": "Watch",
          "severity": "warn",
          "confidence": 0.64,
          "evidence": [
            "SPP and torque rising together at constant flow",
            "two SPP micro-spikes cleared within 15 s"
          ],
          "causes": [
            {
              "t": "Cuttings bed narrowing the annulus",
              "p": 0.68
            },
            {
              "t": "Cavings accumulating at a washout shoulder",
              "p": 0.2
            },
            {
              "t": "Balled stabilisers restricting flow",
              "p": 0.12
            }
          ],
          "recommendedAction": "Maintain rotation and circulation. Do not stop the pumps with the string on bottom. Work the string over the last stand.",
          "constraints": "Maximum permitted SPP 4,500 psi. Do not attempt to pressure through a restriction.",
          "escalation": "A sustained SPP rise that does not clear → stop drilling and follow the pack-off procedure.",
          "sop": "HC-03 Pack-off Recognition & Release",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "washout-induced-false-ecd-estimate",
        "familyId": "hyd",
        "name": "Washout-induced false ECD estimate",
        "code": "DW-HYD-09",
        "description": "Use the PWD reading, not the model, for ECD decisions across the enlarged interval. Update the model geometry from the caliper.",
        "record": {
          "id": "washout-induced-false-ecd-estimate",
          "familyId": "hyd",
          "code": "DW-HYD-09",
          "name": "Washout-induced false ECD estimate",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.53,
          "evidence": [
            "Model ECD 12.72 ppg against a PWD reading of 12.68 ppg",
            "residual widened to 0.09 ppg where the caliper shows 9.6\""
          ],
          "causes": [
            {
              "t": "Hole enlargement not represented in the model geometry",
              "p": 0.61
            },
            {
              "t": "Cuttings loading unmodelled",
              "p": 0.24
            },
            {
              "t": "PWD sensor drift",
              "p": 0.15
            }
          ],
          "recommendedAction": "Use the PWD reading, not the model, for ECD decisions across the enlarged interval. Update the model geometry from the caliper.",
          "constraints": "Where model and PWD disagree by more than 0.08 ppg, apply the more conservative value.",
          "escalation": "Residual above 0.15 ppg, or PWD lost → revert to conservative flow limits.",
          "sop": "DM-02 Hydraulic Model Assurance",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "trip",
    "no": 9,
    "slug": "trip",
    "name": "9. Tripping, connection & handling",
    "description": "Operational classification and incident procedures for tripping, connection & handling incidents.",
    "typesCount": 9,
    "activeCount": 3,
    "criticalCount": 0,
    "warningCount": 0,
    "advisoryCount": 3,
    "incidentTypes": [
      {
        "id": "swab-during-trip-out",
        "familyId": "trip",
        "name": "Swab during trip out",
        "code": "DW-TRIP-01",
        "description": "No action. Maintain the current trip schedule and break circulation every 10 stands.",
        "record": {
          "id": "swab-during-trip-out",
          "familyId": "trip",
          "code": "DW-TRIP-01",
          "name": "Swab during trip out",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.78,
          "evidence": [
            "Last trip out: modelled swab 62 psi against a 180 psi allowance",
            "hole took 96% of calculated fill"
          ],
          "causes": [
            {
              "t": "Trip speed within schedule",
              "p": 0.78
            },
            {
              "t": "Gels contributing more swab than modelled",
              "p": 0.22
            }
          ],
          "recommendedAction": "No action. Maintain the current trip schedule and break circulation every 10 stands.",
          "constraints": "Maximum trip-out speed 25 m/min above 4,200 m; swab margin below 150 psi.",
          "escalation": "Hole taking less than 95% of fill on two checks → stop and circulate bottoms-up.",
          "sop": "WC-06 Tripping & Swab Control",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "surge-during-trip-in",
        "familyId": "trip",
        "name": "Surge during trip in",
        "code": "DW-TRIP-02",
        "description": "No action. Break circulation before entering open hole; limit speed to 15 m/min below the shoe.",
        "record": {
          "id": "surge-during-trip-in",
          "familyId": "trip",
          "code": "DW-TRIP-02",
          "name": "Surge during trip in",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.76,
          "evidence": [
            "Modelled surge on the last run-in 0.19 ppg equivalent, peak ECD 12.94 ppg against a 13.10 ppg limit"
          ],
          "causes": [
            {
              "t": "Running speed within schedule",
              "p": 0.76
            },
            {
              "t": "Gels not fully broken before RIH",
              "p": 0.24
            }
          ],
          "recommendedAction": "No action. Break circulation before entering open hole; limit speed to 15 m/min below the shoe.",
          "constraints": "Peak surge ECD ceiling 13.00 ppg.",
          "escalation": "Losses observed while running in → stop, pull back above the loss zone and circulate.",
          "sop": "LC-03 Surge Management",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "insufficient-hole-fill",
        "familyId": "trip",
        "name": "Insufficient hole fill",
        "code": "DW-TRIP-03",
        "description": "No action. Continue filling every 5 stands and recording against calculation.",
        "record": {
          "id": "insufficient-hole-fill",
          "familyId": "trip",
          "code": "DW-TRIP-03",
          "name": "Insufficient hole fill",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.84,
          "evidence": [
            "Trip tank fill 96–101% of calculated across the last trip",
            "no unexplained deficits"
          ],
          "causes": [
            {
              "t": "Hole filling correctly",
              "p": 0.84
            },
            {
              "t": "Small trip-tank measurement error",
              "p": 0.16
            }
          ],
          "recommendedAction": "No action. Continue filling every 5 stands and recording against calculation.",
          "constraints": "Hole fill must be within 5% of calculated volume at every check.",
          "escalation": "Fill below 95% of calculated on two consecutive checks → stop tripping and flow-check.",
          "sop": "WC-06 Tripping & Swab Control",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "stuck-while-tripping",
        "familyId": "trip",
        "name": "Stuck while tripping",
        "code": "DW-TRIP-04",
        "description": "No action. Ream the known tight interval at 3,900–3,980 m on every trip.",
        "record": {
          "id": "stuck-while-tripping",
          "familyId": "trip",
          "code": "DW-TRIP-04",
          "name": "Stuck while tripping",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.8,
          "evidence": [
            "String free on the last trip",
            "no tight spots requiring more than 18 klbf overpull"
          ],
          "causes": [
            {
              "t": "Hole in good condition",
              "p": 0.8
            },
            {
              "t": "Tight spots developing since the last trip",
              "p": 0.2
            }
          ],
          "recommendedAction": "No action. Ream the known tight interval at 3,900–3,980 m on every trip.",
          "constraints": "Maximum overpull 60 klbf. Never exceed 30 klbf pulling through a known tight spot.",
          "escalation": "Overpull above 30 klbf at a tight spot → stop, rotate and ream down rather than pulling through.",
          "sop": "SP-01 Stuck Pipe Diagnosis",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "excessive-reaming-backreaming",
        "familyId": "trip",
        "name": "Excessive reaming / backreaming",
        "code": "DW-TRIP-05",
        "description": "Circulate clean before pulling instead of backreaming through cuttings. Backreaming a loaded annulus can pack off the BHA.",
        "record": {
          "id": "excessive-reaming-backreaming",
          "familyId": "trip",
          "code": "DW-TRIP-05",
          "name": "Excessive reaming / backreaming",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.57,
          "evidence": [
            "Backreaming time 14% of the last trip against a 6% plan",
            "each backream episode adds cuttings to suspension"
          ],
          "causes": [
            {
              "t": "Poor hole condition requiring repeated passes",
              "p": 0.61
            },
            {
              "t": "Backreaming used instead of circulating clean",
              "p": 0.26
            },
            {
              "t": "Ledges at the interbedded contacts",
              "p": 0.13
            }
          ],
          "recommendedAction": "Circulate clean before pulling instead of backreaming through cuttings. Backreaming a loaded annulus can pack off the BHA.",
          "constraints": "Do not backream faster than 6 m/min. Maintain full flow and rotation while backreaming.",
          "escalation": "Torque or SPP rising while backreaming → stop, circulate at that depth and clear the annulus first.",
          "sop": "HC-04 Wiper Trips & Hole Conditioning",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "connection-related-pressure-transient",
        "familyId": "trip",
        "name": "Connection-related pressure transient",
        "code": "DW-TRIP-06",
        "description": "Ramp pumps in three stages over 45 s. Slow the last 2 m before setting weight. Rotate before applying flow.",
        "record": {
          "id": "connection-related-pressure-transient",
          "familyId": "trip",
          "code": "DW-TRIP-06",
          "name": "Connection-related pressure transient",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.66,
          "evidence": [
            "ECD swing of 0.22 ppg per connection: 12.72 dynamic to 12.50 static, peaking at 12.94 on restart"
          ],
          "causes": [
            {
              "t": "Gel breaking and pump ramp-up too fast",
              "p": 0.58
            },
            {
              "t": "Cuttings settling and re-suspension",
              "p": 0.28
            },
            {
              "t": "Surge from the last 2 m of run-in",
              "p": 0.14
            }
          ],
          "recommendedAction": "Ramp pumps in three stages over 45 s. Slow the last 2 m before setting weight. Rotate before applying flow.",
          "constraints": "Peak connection ECD ceiling 12.95 ppg. Do not exceed 13.10 ppg at any point.",
          "escalation": "Connection ECD peak above 13.00 ppg → change the connection practice before drilling ahead.",
          "sop": "HC-02 ECD Management",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "connection-gas-anomaly",
        "familyId": "trip",
        "name": "Connection gas anomaly",
        "code": "DW-TRIP-07",
        "description": "Log connection gas at every connection and plot against offset P50/P90. Minimise connection time.",
        "record": {
          "id": "connection-gas-anomaly",
          "familyId": "trip",
          "code": "DW-TRIP-07",
          "name": "Connection gas anomaly",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.61,
          "evidence": [
            "Connection gas 74 units against an offset P50 of 46",
            "rising over the last four connections"
          ],
          "causes": [
            {
              "t": "Swabbed gas from a slightly underbalanced sand",
              "p": 0.52
            },
            {
              "t": "Formation gas increasing with depth",
              "p": 0.33
            },
            {
              "t": "Longer connection time allowing more diffusion",
              "p": 0.15
            }
          ],
          "recommendedAction": "Log connection gas at every connection and plot against offset P50/P90. Minimise connection time.",
          "constraints": "Connection gas above the offset P90 of 140 units requires a flow-check.",
          "escalation": "Connection gas doubling stand-on-stand, or exceeding 140 units → flow-check before drilling ahead.",
          "sop": "WC-04 Gas Monitoring & Trending",
          "owner": "Mud Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "pipe-handling-dropped-object-risk",
        "familyId": "trip",
        "name": "Pipe handling / dropped object risk",
        "code": "DW-TRIP-08",
        "description": "No action. Maintain exclusion zones during automated handling.",
        "record": {
          "id": "pipe-handling-dropped-object-risk",
          "familyId": "trip",
          "code": "DW-TRIP-08",
          "name": "Pipe handling / dropped object risk",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.87,
          "evidence": [
            "Automated pipe handling in use",
            "no handling incidents this tour",
            "dropped-object survey completed 6 days ago"
          ],
          "causes": [
            {
              "t": "Handling system operating normally",
              "p": 0.87
            },
            {
              "t": "Latent securing defect",
              "p": 0.13
            }
          ],
          "recommendedAction": "No action. Maintain exclusion zones during automated handling.",
          "constraints": "No personnel in the red zone during automated pipe movement.",
          "escalation": "Any dropped object or near-miss → stop operations and complete a dropped-object investigation.",
          "sop": "HS-04 Dropped Object Prevention",
          "owner": "Toolpusher",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "incorrect-tubular-tally-depth-mismatch",
        "familyId": "trip",
        "name": "Incorrect tubular tally / depth mismatch",
        "code": "DW-TRIP-09",
        "description": "No action. Re-tag the shoe on the next trip to re-validate.",
        "record": {
          "id": "incorrect-tubular-tally-depth-mismatch",
          "familyId": "trip",
          "code": "DW-TRIP-09",
          "name": "Incorrect tubular tally / depth mismatch",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.82,
          "evidence": [
            "Driller's depth and MWD-derived depth agree within 0.4 m",
            "tally verified at the last casing shoe tag"
          ],
          "causes": [
            {
              "t": "Tally correct",
              "p": 0.82
            },
            {
              "t": "Small stretch-correction error",
              "p": 0.18
            }
          ],
          "recommendedAction": "No action. Re-tag the shoe on the next trip to re-validate.",
          "constraints": "Depth discrepancy above 1.0 m requires a tally re-check before drilling ahead.",
          "escalation": "Discrepancy above 1.0 m → stop, re-tally and correct the depth reference before continuing.",
          "sop": "RE-04 Depth Reference Control",
          "owner": "Driller",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "rig",
    "no": 10,
    "slug": "rig",
    "name": "10. Rig equipment & surface-system",
    "description": "Operational classification and incident procedures for rig equipment & surface-system incidents.",
    "typesCount": 12,
    "activeCount": 1,
    "criticalCount": 0,
    "warningCount": 1,
    "advisoryCount": 0,
    "incidentTypes": [
      {
        "id": "top-drive-torque-overload",
        "familyId": "rig",
        "name": "Top-drive torque overload",
        "code": "DW-RIG-01",
        "description": "Do not raise WOB or rpm. Reduce ROP to arrest the torque trend. Engage soft-torque to clip peaks.",
        "record": {
          "id": "top-drive-torque-overload",
          "familyId": "rig",
          "code": "DW-RIG-01",
          "name": "Top-drive torque overload",
          "state": "Watch",
          "severity": "warn",
          "confidence": 0.7,
          "evidence": [
            "Surface torque 23,800 ft-lbf against a 28,000 ft-lbf limit — 15% margin, down from 24% ten minutes ago"
          ],
          "causes": [
            {
              "t": "Cuttings bed increasing rotational drag",
              "p": 0.64
            },
            {
              "t": "Stick-slip peaks approaching the limit",
              "p": 0.24
            },
            {
              "t": "Torque sensor calibration offset",
              "p": 0.12
            }
          ],
          "recommendedAction": "Do not raise WOB or rpm. Reduce ROP to arrest the torque trend. Engage soft-torque to clip peaks.",
          "constraints": "Continuous torque limit 28,000 ft-lbf; top-drive trip at 30,000 ft-lbf. Drillstring make-up limit 32,000 ft-lbf.",
          "escalation": "Torque above 25,200 ft-lbf, or margin below 8% → stop drilling and work the string.",
          "sop": "RE-01 Top-drive Operating Limits",
          "owner": "Driller",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "top-drive-failure",
        "familyId": "rig",
        "name": "Top-drive failure",
        "code": "DW-RIG-02",
        "description": "No action. Continue trending motor current against torque.",
        "record": {
          "id": "top-drive-failure",
          "familyId": "rig",
          "code": "DW-RIG-02",
          "name": "Top-drive failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "Motor current, temperature and lubrication pressure all in band",
            "no fault codes in the last 24 hours"
          ],
          "causes": [
            {
              "t": "Top drive healthy",
              "p": 0.9
            },
            {
              "t": "Early bearing degradation below detection",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. Continue trending motor current against torque.",
          "constraints": "Motor temperature ceiling 95 °C; alarm at 88 °C.",
          "escalation": "A fault code or a temperature above 88 °C → stop drilling, secure the well and troubleshoot.",
          "sop": "RE-01 Top-drive Operating Limits",
          "owner": "Toolpusher",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "drawworks-brake-anomaly",
        "familyId": "rig",
        "name": "Drawworks / brake anomaly",
        "code": "DW-RIG-03",
        "description": "No action. Continue the daily brake inspection.",
        "record": {
          "id": "drawworks-brake-anomaly",
          "familyId": "rig",
          "code": "DW-RIG-03",
          "name": "Drawworks / brake anomaly",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.88,
          "evidence": [
            "Brake temperature 68 °C",
            "hoisting current normal",
            "no drift on the auto-driller hold"
          ],
          "causes": [
            {
              "t": "Drawworks healthy",
              "p": 0.88
            },
            {
              "t": "Slow brake wear below alarm",
              "p": 0.12
            }
          ],
          "recommendedAction": "No action. Continue the daily brake inspection.",
          "constraints": "Brake temperature ceiling 120 °C. Hook-load limit 500 klbf.",
          "escalation": "Brake temperature above 120 °C, or any drift on the brake hold → stop hoisting and inspect.",
          "sop": "RE-02 Hoisting System Assurance",
          "owner": "Toolpusher",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "hookload-sensor-failure",
        "familyId": "rig",
        "name": "Hookload sensor failure",
        "code": "DW-RIG-04",
        "description": "No action. Re-zero the hookload sensor at the next connection with the string in slips.",
        "record": {
          "id": "hookload-sensor-failure",
          "familyId": "rig",
          "code": "DW-RIG-04",
          "name": "Hookload sensor failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.86,
          "evidence": [
            "Hookload 214 klbf",
            "deadline sensor agrees with the calculated string weight within 1.8%"
          ],
          "causes": [
            {
              "t": "Sensor healthy",
              "p": 0.86
            },
            {
              "t": "Slow zero drift",
              "p": 0.14
            }
          ],
          "recommendedAction": "No action. Re-zero the hookload sensor at the next connection with the string in slips.",
          "constraints": "Hookload is a primary stuck-pipe indicator — do not drill with a failed hookload sensor.",
          "escalation": "Sensor disagreement above 5% of calculated string weight → stop and re-calibrate before tripping.",
          "sop": "DM-05 Sensor Cross-validation",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "rotary-table-or-slips-issue",
        "familyId": "rig",
        "name": "Rotary-table or slips issue",
        "code": "DW-RIG-05",
        "description": "No action. Inspect slip dies at the next bit trip.",
        "record": {
          "id": "rotary-table-or-slips-issue",
          "familyId": "rig",
          "code": "DW-RIG-05",
          "name": "Rotary-table or slips issue",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.89,
          "evidence": [
            "Automated slips cycling within normal time",
            "no slip-crushing indications on the pipe tally"
          ],
          "causes": [
            {
              "t": "Handling system healthy",
              "p": 0.89
            },
            {
              "t": "Slip die wear below detection",
              "p": 0.11
            }
          ],
          "recommendedAction": "No action. Inspect slip dies at the next bit trip.",
          "constraints": "Slip-crushing load limit is set by the pipe grade — do not exceed the hanging weight rating.",
          "escalation": "Slip marks on pulled pipe, or a failed cycle → stop and inspect before continuing to trip.",
          "sop": "RE-07 Pipe Handling Equipment",
          "owner": "Toolpusher",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "pump-drive-failure",
        "familyId": "rig",
        "name": "Pump drive failure",
        "code": "DW-RIG-06",
        "description": "No action beyond the pump-1 efficiency watch already open.",
        "record": {
          "id": "pump-drive-failure",
          "familyId": "rig",
          "code": "DW-RIG-06",
          "name": "Pump drive failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.87,
          "evidence": [
            "Pumps 1 and 2 online with normal drive current",
            "pump 3 on standby and tested this tour"
          ],
          "causes": [
            {
              "t": "Drives healthy",
              "p": 0.87
            },
            {
              "t": "Pump 1 valve wear developing",
              "p": 0.13
            }
          ],
          "recommendedAction": "No action beyond the pump-1 efficiency watch already open.",
          "constraints": "Two pumps must remain available while drilling.",
          "escalation": "Losing a second pump → reduce ROP to the flow the remaining pump can sustain, or stop drilling.",
          "sop": "RE-05 Mud Pump Maintenance",
          "owner": "Toolpusher",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "power-generation-loss",
        "familyId": "rig",
        "name": "Power-generation loss",
        "code": "DW-RIG-07",
        "description": "No action. Maintain at least one spare generator online while drilling.",
        "record": {
          "id": "power-generation-loss",
          "familyId": "rig",
          "code": "DW-RIG-07",
          "name": "Power-generation loss",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.91,
          "evidence": [
            "5 of 6 generators online, 68% load",
            "blackout-recovery test passed 9 days ago"
          ],
          "causes": [
            {
              "t": "Power plant healthy",
              "p": 0.91
            },
            {
              "t": "Single-generator trip risk",
              "p": 0.09
            }
          ],
          "recommendedAction": "No action. Maintain at least one spare generator online while drilling.",
          "constraints": "Maximum sustained load 85% of installed capacity. DP operations require full redundancy.",
          "escalation": "Load above 85%, or losing a second generator → shed non-essential load and suspend drilling.",
          "sop": "RE-09 Power Management",
          "owner": "Chief Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "compressor-hydraulic-failure",
        "familyId": "rig",
        "name": "Compressor / hydraulic failure",
        "code": "DW-RIG-08",
        "description": "No action. Continue routine checks.",
        "record": {
          "id": "compressor-hydraulic-failure",
          "familyId": "rig",
          "code": "DW-RIG-08",
          "name": "Compressor / hydraulic failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.85,
          "evidence": [
            "Rig air 118 psi",
            "HPU pressure 2,940 psi",
            "no low-pressure alarms"
          ],
          "causes": [
            {
              "t": "Systems healthy",
              "p": 0.85
            },
            {
              "t": "Slow accumulator leak",
              "p": 0.15
            }
          ],
          "recommendedAction": "No action. Continue routine checks.",
          "constraints": "Rig air floor 100 psi; HPU floor 2,600 psi for BOP function.",
          "escalation": "Pressure below floor on either system → suspend operations that depend on it.",
          "sop": "RE-10 Utility Systems",
          "owner": "Chief Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "sensor-plc-network-outage",
        "familyId": "rig",
        "name": "Sensor / PLC / network outage",
        "code": "DW-RIG-09",
        "description": "No action. The advisory engine bridged the gap and flagged the affected window as interpolated.",
        "record": {
          "id": "sensor-plc-network-outage",
          "familyId": "rig",
          "code": "DW-RIG-09",
          "name": "Sensor / PLC / network outage",
          "state": "Recovered",
          "severity": "info",
          "confidence": 0.92,
          "evidence": [
            "12-second gap on the WITS aggregator at 11:42",
            "all channels restored",
            "no data lost from the historian"
          ],
          "causes": [
            {
              "t": "Network switch failover",
              "p": 0.68
            },
            {
              "t": "Aggregator service restart",
              "p": 0.22
            },
            {
              "t": "Transient PLC comms fault",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. The advisory engine bridged the gap and flagged the affected window as interpolated.",
          "constraints": "Advisories are suppressed on channels with data older than 30 s. Do not act on interpolated values.",
          "escalation": "A gap longer than 60 s, or a channel not returning → suppress dependent advisories and notify the data engineer.",
          "sop": "DM-03 Data Availability & Gaps",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "time-synchronisation-failure",
        "familyId": "rig",
        "name": "Time synchronisation failure",
        "code": "DW-RIG-10",
        "description": "No action. Time alignment is a precondition for cross-channel evidence.",
        "record": {
          "id": "time-synchronisation-failure",
          "familyId": "rig",
          "code": "DW-RIG-10",
          "name": "Time synchronisation failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.93,
          "evidence": [
            "All sources within 180 ms of rig NTP",
            "MWD, surface and mud-logging clocks aligned"
          ],
          "causes": [
            {
              "t": "Time sync healthy",
              "p": 0.93
            },
            {
              "t": "Drift on the mud-logging unit",
              "p": 0.07
            }
          ],
          "recommendedAction": "No action. Time alignment is a precondition for cross-channel evidence.",
          "constraints": "Maximum permitted clock skew 1 s between systems used for evidence correlation.",
          "escalation": "Skew above 1 s → suppress cross-channel advisories until it is corrected.",
          "sop": "DM-04 Time Alignment",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "bad-tag-mapping-unit-mismatch",
        "familyId": "rig",
        "name": "Bad tag mapping / unit mismatch",
        "code": "DW-RIG-11",
        "description": "No action. Every configuration change re-runs the unit-validation test automatically.",
        "record": {
          "id": "bad-tag-mapping-unit-mismatch",
          "familyId": "rig",
          "code": "DW-RIG-11",
          "name": "Bad tag mapping / unit mismatch",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "All 214 mapped tags validated against the unit registry at the last configuration change"
          ],
          "causes": [
            {
              "t": "Mapping correct",
              "p": 0.9
            },
            {
              "t": "Unvalidated tag added since",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. Every configuration change re-runs the unit-validation test automatically.",
          "constraints": "No tag may enter an advisory calculation without a validated unit and range.",
          "escalation": "A tag failing validation → remove it from advisory calculations until it is corrected.",
          "sop": "DM-07 Tag & Unit Governance",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "cybersecurity-data-integrity-anomaly",
        "familyId": "rig",
        "name": "Cybersecurity / data-integrity anomaly",
        "code": "DW-RIG-12",
        "description": "No action. DrillWise reads rig data and writes no setpoints — there is no control path from this system.",
        "record": {
          "id": "cybersecurity-data-integrity-anomaly",
          "familyId": "rig",
          "code": "DW-RIG-12",
          "name": "Cybersecurity / data-integrity anomaly",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.94,
          "evidence": [
            "No unauthorised write attempts to the control network",
            "advisory system is read-only by design"
          ],
          "causes": [
            {
              "t": "No anomaly",
              "p": 0.94
            },
            {
              "t": "Unlogged access attempt",
              "p": 0.06
            }
          ],
          "recommendedAction": "No action. DrillWise reads rig data and writes no setpoints — there is no control path from this system.",
          "constraints": "The advisory system must remain read-only. No automated writes to any rig control system, ever.",
          "escalation": "Any write attempt from the advisory network → isolate the interface and notify the OIM and IT security.",
          "sop": "DM-08 Advisory System Boundary",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "csg",
    "no": 11,
    "slug": "csg",
    "name": "11. Casing, cementing & well-integrity",
    "description": "Operational classification and incident procedures for casing, cementing & well-integrity incidents.",
    "typesCount": 9,
    "activeCount": 0,
    "criticalCount": 0,
    "warningCount": 0,
    "advisoryCount": 0,
    "incidentTypes": [
      {
        "id": "casing-cannot-reach-planned-depth",
        "familyId": "csg",
        "name": "Casing cannot reach planned depth",
        "code": "DW-CSG-01",
        "description": "Condition the hole with a dedicated cleaning trip before running. Plan a rotating liner hanger as contingency.",
        "record": {
          "id": "casing-cannot-reach-planned-depth",
          "familyId": "csg",
          "code": "DW-CSG-01",
          "name": "Casing cannot reach planned depth",
          "state": "Anticipated",
          "severity": "adv",
          "confidence": 0.63,
          "evidence": [
            "Liner-running model predicts 62 klbf of hook-load margin at TD against a 40 klbf minimum, using the actual tortuosity profile"
          ],
          "causes": [
            {
              "t": "Accumulated tortuosity and micro-doglegs",
              "p": 0.62
            },
            {
              "t": "Cuttings beds in the horizontal",
              "p": 0.26
            },
            {
              "t": "Optimistic friction factor",
              "p": 0.12
            }
          ],
          "recommendedAction": "Condition the hole with a dedicated cleaning trip before running. Plan a rotating liner hanger as contingency.",
          "constraints": "Minimum hook-load margin 40 klbf. Maximum liner rotation 40 rpm at 12,000 ft-lbf.",
          "escalation": "Predicted margin below 40 klbf → re-plan with rotation or flotation before pulling out of hole.",
          "sop": "CS-01 Casing Running Feasibility",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "casing-stuck",
        "familyId": "csg",
        "name": "Casing stuck",
        "code": "DW-CSG-02",
        "description": "No action. Differential-sticking risk across the depleted sand is carried into the liner-running plan.",
        "record": {
          "id": "casing-stuck",
          "familyId": "csg",
          "code": "DW-CSG-02",
          "name": "Casing stuck",
          "state": "Not active",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "No casing in the hole",
            "the 7\" liner is scheduled after the current section"
          ],
          "causes": [
            {
              "t": "Not applicable",
              "p": 0.9
            },
            {
              "t": "Planning reference",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. Differential-sticking risk across the depleted sand is carried into the liner-running plan.",
          "constraints": "Do not leave the liner stationary across the depleted sand for more than 5 min.",
          "escalation": "Reactivate when the liner enters open hole.",
          "sop": "CS-02 Casing Stuck Response",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "casing-running-losses",
        "familyId": "csg",
        "name": "Casing running losses",
        "code": "DW-CSG-03",
        "description": "No action. Fit the liner with an auto-fill float to reduce surge on the run.",
        "record": {
          "id": "casing-running-losses",
          "familyId": "csg",
          "code": "DW-CSG-03",
          "name": "Casing running losses",
          "state": "Not active",
          "severity": "info",
          "confidence": 0.88,
          "evidence": [
            "No casing running",
            "surge model for the liner predicts a 0.26 ppg equivalent peak"
          ],
          "causes": [
            {
              "t": "Not applicable",
              "p": 0.88
            },
            {
              "t": "Planning reference",
              "p": 0.12
            }
          ],
          "recommendedAction": "No action. Fit the liner with an auto-fill float to reduce surge on the run.",
          "constraints": "Peak surge ECD during the liner run must stay below 12.90 ppg at the depleted sand.",
          "escalation": "Reactivate at the start of the liner run.",
          "sop": "LC-03 Surge Management",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "cement-losses",
        "familyId": "csg",
        "name": "Cement losses",
        "code": "DW-CSG-04",
        "description": "No action. Carry the loss risk into the liner cement design.",
        "record": {
          "id": "cement-losses",
          "familyId": "csg",
          "code": "DW-CSG-04",
          "name": "Cement losses",
          "state": "Not active",
          "severity": "info",
          "confidence": 0.87,
          "evidence": [
            "No cementing in progress",
            "last shoe job returned full volume"
          ],
          "causes": [
            {
              "t": "Not applicable",
              "p": 0.87
            },
            {
              "t": "Planning reference",
              "p": 0.13
            }
          ],
          "recommendedAction": "No action. Carry the loss risk into the liner cement design.",
          "constraints": "Liner cement ECD ceiling 13.00 ppg at the 9⅝\" shoe.",
          "escalation": "Reactivate at the start of the cement job.",
          "sop": "CM-02 Cement Placement & Loss Control",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "poor-cement-displacement",
        "familyId": "csg",
        "name": "Poor cement displacement",
        "code": "DW-CSG-05",
        "description": "No action. Centraliser spacing for the liner is designed for 72% standoff in the horizontal.",
        "record": {
          "id": "poor-cement-displacement",
          "familyId": "csg",
          "code": "DW-CSG-05",
          "name": "Poor cement displacement",
          "state": "Not active",
          "severity": "info",
          "confidence": 0.85,
          "evidence": [
            "No cementing in progress",
            "the last job achieved 94% modelled displacement efficiency"
          ],
          "causes": [
            {
              "t": "Not applicable",
              "p": 0.85
            },
            {
              "t": "Planning reference",
              "p": 0.15
            }
          ],
          "recommendedAction": "No action. Centraliser spacing for the liner is designed for 72% standoff in the horizontal.",
          "constraints": "Minimum standoff 67% for acceptable displacement in the horizontal section.",
          "escalation": "Reactivate at the start of the cement job.",
          "sop": "CM-01 Cement Job Design",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "casing-shoe-integrity-concern",
        "familyId": "csg",
        "name": "Casing-shoe integrity concern",
        "code": "DW-CSG-06",
        "description": "No action. Keep ECD at the shoe below 13.20 ppg to preserve the integrity margin.",
        "record": {
          "id": "casing-shoe-integrity-concern",
          "familyId": "csg",
          "code": "DW-CSG-06",
          "name": "Casing-shoe integrity concern",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.86,
          "evidence": [
            "9⅝\" shoe FIT 13.42 ppg equivalent",
            "no shoe-integrity indications",
            "ECD at the shoe 12.61 ppg"
          ],
          "causes": [
            {
              "t": "Shoe intact",
              "p": 0.86
            },
            {
              "t": "Micro-fracture near the shoe",
              "p": 0.14
            }
          ],
          "recommendedAction": "No action. Keep ECD at the shoe below 13.20 ppg to preserve the integrity margin.",
          "constraints": "Shoe FIT 13.42 ppg. Do not exceed 13.20 ppg ECD at the shoe.",
          "escalation": "Losses at the shoe, or a fall in the leak-off value on re-test → stop and re-evaluate the casing point.",
          "sop": "CS-03 Shoe Integrity Management",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "annular-pressure-buildup",
        "familyId": "csg",
        "name": "Annular pressure buildup",
        "code": "DW-CSG-07",
        "description": "No action. APB risk is a production-phase concern for this well.",
        "record": {
          "id": "annular-pressure-buildup",
          "familyId": "csg",
          "code": "DW-CSG-07",
          "name": "Annular pressure buildup",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.89,
          "evidence": [
            "A-annulus 0 psi",
            "B-annulus 0 psi",
            "no thermal buildup expected while drilling"
          ],
          "causes": [
            {
              "t": "No APB",
              "p": 0.89
            },
            {
              "t": "Trapped annulus not yet warmed",
              "p": 0.11
            }
          ],
          "recommendedAction": "No action. APB risk is a production-phase concern for this well.",
          "constraints": "Annulus pressure alarm at 200 psi.",
          "escalation": "Any sustained annulus pressure → stop and evaluate barrier integrity.",
          "sop": "WI-01 Annulus Pressure Management",
          "owner": "Supervisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "sustained-casing-pressure",
        "familyId": "csg",
        "name": "Sustained casing pressure",
        "code": "DW-CSG-08",
        "description": "No action. Continue daily annulus pressure recording.",
        "record": {
          "id": "sustained-casing-pressure",
          "familyId": "csg",
          "code": "DW-CSG-08",
          "name": "Sustained casing pressure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "No casing pressure recorded on any annulus"
          ],
          "causes": [
            {
              "t": "No SCP",
              "p": 0.9
            },
            {
              "t": "Gauge isolation valve closed",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. Continue daily annulus pressure recording.",
          "constraints": "Any sustained casing pressure must be diagnosed before the well is handed to production.",
          "escalation": "Pressure that rebuilds after bleed-down → classify as SCP and raise a well-integrity case.",
          "sop": "WI-02 Sustained Casing Pressure",
          "owner": "Supervisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "barrier-failure",
        "familyId": "csg",
        "name": "Barrier failure",
        "code": "DW-CSG-09",
        "description": "No action. Two verified barriers are in place for the current operation.",
        "record": {
          "id": "barrier-failure",
          "familyId": "csg",
          "code": "DW-CSG-09",
          "name": "Barrier failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.92,
          "evidence": [
            "Two independent barriers verified: mud column at 12.0 ppg and the tested BOP stack"
          ],
          "causes": [
            {
              "t": "Barriers intact",
              "p": 0.92
            },
            {
              "t": "Undetected degradation",
              "p": 0.08
            }
          ],
          "recommendedAction": "No action. Two verified barriers are in place for the current operation.",
          "constraints": "Two independent tested barriers required at all times. No operation may reduce this to one.",
          "escalation": "Loss of either barrier → stop operations and restore two barriers before continuing.",
          "sop": "WI-03 Two-Barrier Policy",
          "owner": "Supervisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "off",
    "no": 12,
    "slug": "off",
    "name": "12. Offshore & marine-specific",
    "description": "Operational classification and incident procedures for offshore & marine-specific incidents.",
    "typesCount": 9,
    "activeCount": 1,
    "criticalCount": 0,
    "warningCount": 0,
    "advisoryCount": 1,
    "incidentTypes": [
      {
        "id": "riser-gas-gas-in-riser-concern",
        "familyId": "off",
        "name": "Riser gas / gas-in-riser concern",
        "code": "DW-OFF-01",
        "description": "No action. Keep the riser gas handling system armed while drilling with gas shows.",
        "record": {
          "id": "riser-gas-gas-in-riser-concern",
          "familyId": "off",
          "code": "DW-OFF-01",
          "name": "Riser gas / gas-in-riser concern",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.87,
          "evidence": [
            "No gas above the subsea BOP",
            "riser gas handling system armed",
            "MPD-ready diverter tested"
          ],
          "causes": [
            {
              "t": "No gas in riser",
              "p": 0.87
            },
            {
              "t": "Small volume below detection",
              "p": 0.13
            }
          ],
          "recommendedAction": "No action. Keep the riser gas handling system armed while drilling with gas shows.",
          "constraints": "Any gas above the BOP is diverted, never circulated to the rig floor.",
          "escalation": "Gas detected in the riser → activate the riser gas handling procedure and prepare to disconnect.",
          "sop": "OF-01 Riser Gas Handling",
          "owner": "Supervisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "riser-disconnect-risk",
        "familyId": "off",
        "name": "Riser disconnect risk",
        "code": "DW-OFF-02",
        "description": "No action. Maintain the EDS drill schedule and keep the disconnect sequence briefed.",
        "record": {
          "id": "riser-disconnect-risk",
          "familyId": "off",
          "code": "DW-OFF-02",
          "name": "Riser disconnect risk",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.91,
          "evidence": [
            "Vessel position within the green watch circle",
            "riser angle 0.8°",
            "no disconnect precursors"
          ],
          "causes": [
            {
              "t": "Station-keeping normal",
              "p": 0.91
            },
            {
              "t": "Weather deteriorating within forecast",
              "p": 0.09
            }
          ],
          "recommendedAction": "No action. Maintain the EDS drill schedule and keep the disconnect sequence briefed.",
          "constraints": "Yellow alert at 3.5° riser angle; red alert and EDS at 5.0°.",
          "escalation": "Riser angle above 3.5°, or a DP yellow alert → suspend drilling and prepare to hang off.",
          "sop": "OF-02 Emergency Disconnect Readiness",
          "owner": "OIM",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "dynamic-positioning-excursion",
        "familyId": "off",
        "name": "Dynamic positioning excursion",
        "code": "DW-OFF-03",
        "description": "No action. Continue DP watch-circle monitoring.",
        "record": {
          "id": "dynamic-positioning-excursion",
          "familyId": "off",
          "code": "DW-OFF-03",
          "name": "Dynamic positioning excursion",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "Position error 0.9 m against a 3.0 m green limit",
            "6 of 6 thrusters online",
            "DP class 3 configuration intact"
          ],
          "causes": [
            {
              "t": "Station-keeping normal",
              "p": 0.9
            },
            {
              "t": "Thruster degradation below alarm",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. Continue DP watch-circle monitoring.",
          "constraints": "Green 3 m, yellow 5 m, red 7 m. DP class 3 redundancy must be maintained while drilling.",
          "escalation": "Position error above 5 m, or loss of DP redundancy → suspend drilling and prepare to hang off.",
          "sop": "OF-03 DP Operations",
          "owner": "DPO",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "heave-compensation-anomaly",
        "familyId": "off",
        "name": "Heave-compensation anomaly",
        "code": "DW-OFF-04",
        "description": "No action. WOB variation from heave is within the tolerance for the auto-driller.",
        "record": {
          "id": "heave-compensation-anomaly",
          "familyId": "off",
          "code": "DW-OFF-04",
          "name": "Heave-compensation anomaly",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.88,
          "evidence": [
            "Compensator stroke 42% of range",
            "WOB variation from heave 1.2 klbf",
            "significant wave height 2.1 m"
          ],
          "causes": [
            {
              "t": "Compensator performing normally",
              "p": 0.88
            },
            {
              "t": "Accumulator charge drifting",
              "p": 0.12
            }
          ],
          "recommendedAction": "No action. WOB variation from heave is within the tolerance for the auto-driller.",
          "constraints": "Compensator stroke must stay between 20% and 80% of range. WOB heave variation ceiling 4 klbf.",
          "escalation": "Stroke outside 20–80%, or WOB variation above 4 klbf → suspend drilling and re-set the compensator.",
          "sop": "OF-04 Heave Compensation",
          "owner": "Toolpusher",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "riser-tension-limit-approach",
        "familyId": "off",
        "name": "Riser tension limit approach",
        "code": "DW-OFF-05",
        "description": "No action. Re-check tension if mud weight is increased — riser tension scales with mud weight.",
        "record": {
          "id": "riser-tension-limit-approach",
          "familyId": "off",
          "code": "DW-OFF-05",
          "name": "Riser tension limit approach",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.89,
          "evidence": [
            "Riser tension 1.42 MN against a 1.85 MN limit",
            "top tension ratio 1.31"
          ],
          "causes": [
            {
              "t": "Tension within design",
              "p": 0.89
            },
            {
              "t": "Marine growth adding drag",
              "p": 0.11
            }
          ],
          "recommendedAction": "No action. Re-check tension if mud weight is increased — riser tension scales with mud weight.",
          "constraints": "Maximum riser tension 1.85 MN. Minimum top tension ratio 1.20.",
          "escalation": "Tension above 1.75 MN, or ratio below 1.20 → suspend and re-calculate the tension requirement.",
          "sop": "OF-05 Riser Tension Management",
          "owner": "Barge Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "marine-riser-pressure-loss-choke-kill-issue",
        "familyId": "off",
        "name": "Marine riser pressure loss / choke-kill issue",
        "code": "DW-OFF-06",
        "description": "No action. Next line test due in 3 days.",
        "record": {
          "id": "marine-riser-pressure-loss-choke-kill-issue",
          "familyId": "off",
          "code": "DW-OFF-06",
          "name": "Marine riser pressure loss / choke-kill issue",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "Choke and kill lines tested to 5,000 psi 4 days ago",
            "no pressure loss indications"
          ],
          "causes": [
            {
              "t": "Lines intact",
              "p": 0.9
            },
            {
              "t": "Slow seal degradation",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. Next line test due in 3 days.",
          "constraints": "Choke and kill line integrity is a well-control barrier — no operations with a failed line.",
          "escalation": "Any pressure loss on test → stop and repair before continuing to drill.",
          "sop": "OF-06 Choke & Kill Integrity",
          "owner": "Subsea Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "subsea-bop-communication-failure",
        "familyId": "off",
        "name": "Subsea BOP communication failure",
        "code": "DW-OFF-07",
        "description": "No action. Continue daily pod response checks.",
        "record": {
          "id": "subsea-bop-communication-failure",
          "familyId": "off",
          "code": "DW-OFF-07",
          "name": "Subsea BOP communication failure",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.92,
          "evidence": [
            "Both pods responding",
            "blue-pod response 3.2 s, yellow-pod 3.4 s, both within spec"
          ],
          "causes": [
            {
              "t": "Communications healthy",
              "p": 0.92
            },
            {
              "t": "Intermittent MUX fault",
              "p": 0.08
            }
          ],
          "recommendedAction": "No action. Continue daily pod response checks.",
          "constraints": "Both pods must be functional for drilling operations to continue.",
          "escalation": "Loss of a pod → suspend drilling, secure the well and troubleshoot before continuing.",
          "sop": "OF-07 Subsea Control System",
          "owner": "Subsea Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "riserless-return-anomaly",
        "familyId": "off",
        "name": "Riserless return anomaly",
        "code": "DW-OFF-08",
        "description": "No action.",
        "record": {
          "id": "riserless-return-anomaly",
          "familyId": "off",
          "code": "DW-OFF-08",
          "name": "Riserless return anomaly",
          "state": "Not applicable",
          "severity": "info",
          "confidence": 0.93,
          "evidence": [
            "Section is drilled with the riser connected",
            "no riserless operations in progress"
          ],
          "causes": [
            {
              "t": "Not applicable",
              "p": 0.93
            },
            {
              "t": "Reference entry",
              "p": 0.07
            }
          ],
          "recommendedAction": "No action.",
          "constraints": "Not applicable in the current section.",
          "escalation": "Reactivate for any riserless tophole operation.",
          "sop": "OF-08 Riserless Drilling",
          "owner": "Drilling Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "weather-limit-exceedance",
        "familyId": "off",
        "name": "Weather-limit exceedance",
        "code": "DW-OFF-09",
        "description": "Plan to reach a securable point before the weather arrives. Do not start the liner run inside the weather window.",
        "record": {
          "id": "weather-limit-exceedance",
          "familyId": "off",
          "code": "DW-OFF-09",
          "name": "Weather-limit exceedance",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.58,
          "evidence": [
            "Significant wave height 2.1 m rising to a forecast 3.4 m in 14 hours",
            "wind 24 kn",
            "operating limit 4.5 m"
          ],
          "causes": [
            {
              "t": "Approaching weather system",
              "p": 0.72
            },
            {
              "t": "Forecast uncertainty at 14 hours",
              "p": 0.28
            }
          ],
          "recommendedAction": "Plan to reach a securable point before the weather arrives. Do not start the liner run inside the weather window.",
          "constraints": "Drilling limit Hs 4.5 m; disconnect planning threshold Hs 5.5 m.",
          "escalation": "Hs above 4.5 m, or a deteriorating forecast inside 6 hours → suspend drilling and secure the well.",
          "sop": "OF-09 Weather & Operating Limits",
          "owner": "OIM",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "hse",
    "no": 13,
    "slug": "hse",
    "name": "13. HSE & environmental",
    "description": "Operational classification and incident procedures for hse & environmental incidents.",
    "typesCount": 9,
    "activeCount": 2,
    "criticalCount": 0,
    "warningCount": 0,
    "advisoryCount": 1,
    "incidentTypes": [
      {
        "id": "h-s-release",
        "familyId": "hse",
        "name": "H₂S release",
        "code": "DW-HSE-01",
        "description": "No action. Maintain scavenger treatment and detector checks.",
        "record": {
          "id": "h-s-release",
          "familyId": "hse",
          "code": "DW-HSE-01",
          "name": "H₂S release",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.94,
          "evidence": [
            "All fixed detectors reading 0 ppm",
            "last bump test 2 days ago",
            "scavenger at 2 lb/bbl"
          ],
          "causes": [
            {
              "t": "No H₂S present",
              "p": 0.94
            },
            {
              "t": "Detector fault",
              "p": 0.06
            }
          ],
          "recommendedAction": "No action. Maintain scavenger treatment and detector checks.",
          "constraints": "Alarm 10 ppm; muster 20 ppm. Breathing apparatus staged at all work areas.",
          "escalation": "Any reading above 10 ppm → don breathing apparatus, muster and follow the H₂S contingency plan.",
          "sop": "HS-01 H₂S Contingency",
          "owner": "HSE Advisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "hydrocarbon-release",
        "familyId": "hse",
        "name": "Hydrocarbon release",
        "code": "DW-HSE-02",
        "description": "No action. Continue gas-detection monitoring.",
        "record": {
          "id": "hydrocarbon-release",
          "familyId": "hse",
          "code": "DW-HSE-02",
          "name": "Hydrocarbon release",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.93,
          "evidence": [
            "No gas detection in any classified area",
            "flow line and shaker house detectors at 0% LEL"
          ],
          "causes": [
            {
              "t": "No release",
              "p": 0.93
            },
            {
              "t": "Detector fault",
              "p": 0.07
            }
          ],
          "recommendedAction": "No action. Continue gas-detection monitoring.",
          "constraints": "Alarm at 20% LEL; ESD at 60% LEL.",
          "escalation": "Detection above 20% LEL → stop hot work, muster non-essential personnel and investigate.",
          "sop": "HS-02 Hydrocarbon Release Response",
          "owner": "HSE Advisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "fire-or-explosion-indicator",
        "familyId": "hse",
        "name": "Fire or explosion indicator",
        "code": "DW-HSE-03",
        "description": "No action. F&G system self-tests every 24 hours.",
        "record": {
          "id": "fire-or-explosion-indicator",
          "familyId": "hse",
          "code": "DW-HSE-03",
          "name": "Fire or explosion indicator",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.95,
          "evidence": [
            "No fire or smoke detection",
            "F&G system healthy on the last self-test"
          ],
          "causes": [
            {
              "t": "No indication",
              "p": 0.95
            },
            {
              "t": "Detector fault",
              "p": 0.05
            }
          ],
          "recommendedAction": "No action. F&G system self-tests every 24 hours.",
          "constraints": "Any confirmed fire triggers general alarm and muster — no exceptions.",
          "escalation": "Any fire or smoke detection → general alarm, muster and emergency response.",
          "sop": "HS-03 Emergency Response",
          "owner": "OIM",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "mud-spill-environmental-release",
        "familyId": "hse",
        "name": "Mud spill / environmental release",
        "code": "DW-HSE-04",
        "description": "No action. SBM discharge is prohibited — all cuttings are shipped to shore.",
        "record": {
          "id": "mud-spill-environmental-release",
          "familyId": "hse",
          "code": "DW-HSE-04",
          "name": "Mud spill / environmental release",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.91,
          "evidence": [
            "No overboard discharge",
            "SBM is fully contained",
            "cuttings routed to skips for shipment"
          ],
          "causes": [
            {
              "t": "No release",
              "p": 0.91
            },
            {
              "t": "Minor deck spill contained",
              "p": 0.09
            }
          ],
          "recommendedAction": "No action. SBM discharge is prohibited — all cuttings are shipped to shore.",
          "constraints": "Zero discharge of synthetic-based mud. Deck drains isolated to the slop tank while handling SBM.",
          "escalation": "Any overboard release → stop, contain, and report to the regulator within the statutory window.",
          "sop": "EN-01 Discharge Control",
          "owner": "HSE Advisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "chemical-exposure-event",
        "familyId": "hse",
        "name": "Chemical exposure event",
        "code": "DW-HSE-05",
        "description": "No action. Continue PPE checks at the mud-mixing area.",
        "record": {
          "id": "chemical-exposure-event",
          "familyId": "hse",
          "code": "DW-HSE-05",
          "name": "Chemical exposure event",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.92,
          "evidence": [
            "No exposure reported",
            "mud-mixing area ventilation operating",
            "PPE compliance verified this tour"
          ],
          "causes": [
            {
              "t": "No exposure",
              "p": 0.92
            },
            {
              "t": "Unreported minor exposure",
              "p": 0.08
            }
          ],
          "recommendedAction": "No action. Continue PPE checks at the mud-mixing area.",
          "constraints": "Respiratory protection required for all dry-additive handling.",
          "escalation": "Any exposure → medic assessment, incident report and a review of the handling procedure.",
          "sop": "HS-05 Chemical Handling",
          "owner": "HSE Advisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "dropped-object",
        "familyId": "hse",
        "name": "Dropped object",
        "code": "DW-HSE-06",
        "description": "No action. Maintain exclusion zones under all overhead work.",
        "record": {
          "id": "dropped-object",
          "familyId": "hse",
          "code": "DW-HSE-06",
          "name": "Dropped object",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "No dropped objects this tour",
            "last DROPS survey 6 days ago with all findings closed"
          ],
          "causes": [
            {
              "t": "No incident",
              "p": 0.9
            },
            {
              "t": "Latent securing defect",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. Maintain exclusion zones under all overhead work.",
          "constraints": "No personnel under suspended loads. Derrick DROPS survey every 7 days.",
          "escalation": "Any dropped object → stop the job, secure the area and investigate before resuming.",
          "sop": "HS-04 Dropped Object Prevention",
          "owner": "HSE Advisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "confined-space-personnel-alarm",
        "familyId": "hse",
        "name": "Confined-space / personnel alarm",
        "code": "DW-HSE-07",
        "description": "No action. Confined-space entry requires a permit and a standby person.",
        "record": {
          "id": "confined-space-personnel-alarm",
          "familyId": "hse",
          "code": "DW-HSE-07",
          "name": "Confined-space / personnel alarm",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.94,
          "evidence": [
            "No confined-space entries in progress",
            "all POB accounted for at the last muster check"
          ],
          "causes": [
            {
              "t": "No entries active",
              "p": 0.94
            },
            {
              "t": "Permit not yet logged",
              "p": 0.06
            }
          ],
          "recommendedAction": "No action. Confined-space entry requires a permit and a standby person.",
          "constraints": "No entry without gas testing, a permit and continuous attendance.",
          "escalation": "A personnel alarm or an unaccounted entrant → general alarm and rescue response.",
          "sop": "HS-06 Confined Space Entry",
          "owner": "HSE Advisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "noise-vibration-exposure",
        "familyId": "hse",
        "name": "Noise / vibration exposure",
        "code": "DW-HSE-08",
        "description": "Maintain double hearing protection in the shaker house and limit continuous occupancy to 30 min.",
        "record": {
          "id": "noise-vibration-exposure",
          "familyId": "hse",
          "code": "DW-HSE-08",
          "name": "Noise / vibration exposure",
          "state": "Watch",
          "severity": "info",
          "confidence": 0.66,
          "evidence": [
            "Shaker-house noise 96 dB(A)",
            "daily exposure for the mud crew estimated at 84 dB(A) over 12 hours"
          ],
          "causes": [
            {
              "t": "Shaker screens loaded and running hard",
              "p": 0.58
            },
            {
              "t": "Ventilation fan noise",
              "p": 0.27
            },
            {
              "t": "Measurement position bias",
              "p": 0.15
            }
          ],
          "recommendedAction": "Maintain double hearing protection in the shaker house and limit continuous occupancy to 30 min.",
          "constraints": "Exposure limit 85 dB(A) over 12 hours. Hearing protection mandatory above 85 dB(A).",
          "escalation": "Daily exposure above 87 dB(A) → rotate personnel and review the noise-control plan.",
          "sop": "HS-07 Noise Exposure",
          "owner": "HSE Advisor",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "fatigue-human-factor-risk",
        "familyId": "hse",
        "name": "Fatigue / human-factor risk",
        "code": "DW-HSE-09",
        "description": "Reduce advisory noise: group the hole-cleaning advisories into a single card. Brief the oncoming tour on the open pack-off watch.",
        "record": {
          "id": "fatigue-human-factor-risk",
          "familyId": "hse",
          "code": "DW-HSE-09",
          "name": "Fatigue / human-factor risk",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.57,
          "evidence": [
            "Current crew is 9.5 hours into a 12-hour tour",
            "3 open advisories on the driller's station",
            "14 alerts in the last hour"
          ],
          "causes": [
            {
              "t": "Extended tour with a high alert rate",
              "p": 0.55
            },
            {
              "t": "Alert fatigue reducing response quality",
              "p": 0.31
            },
            {
              "t": "Crew change disruption",
              "p": 0.14
            }
          ],
          "recommendedAction": "Reduce advisory noise: group the hole-cleaning advisories into a single card. Brief the oncoming tour on the open pack-off watch.",
          "constraints": "No safety-critical alert may be suppressed for fatigue reasons — only grouped and prioritised.",
          "escalation": "Acknowledgement latency above 5 min on a Warning, or a missed Critical → notify the supervisor and review crew loading.",
          "sop": "HS-08 Fatigue & Human Factors",
          "owner": "Supervisor",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  },
  {
    "id": "dm",
    "no": 14,
    "slug": "dm",
    "name": "14. Data, model & advisory-system",
    "description": "Operational classification and incident procedures for data, model & advisory-system incidents.",
    "typesCount": 13,
    "activeCount": 6,
    "criticalCount": 0,
    "warningCount": 1,
    "advisoryCount": 5,
    "incidentTypes": [
      {
        "id": "sensor-drift",
        "familyId": "dm",
        "name": "Sensor drift",
        "code": "DW-DM-01",
        "description": "Re-zero the Coriolis at the next connection. Until then, use the trip tank as the arbiter for flow-based decisions.",
        "record": {
          "id": "sensor-drift",
          "familyId": "dm",
          "code": "DW-DM-01",
          "name": "Sensor drift",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.69,
          "evidence": [
            "Coriolis flow-out reads 4.1% above the paddle and trip tank",
            "drift accumulating 0.6% per day since the last calibration"
          ],
          "causes": [
            {
              "t": "Zero drift since the last calibration",
              "p": 0.57
            },
            {
              "t": "Fouling on the sensing element",
              "p": 0.28
            },
            {
              "t": "Genuine flow difference",
              "p": 0.15
            }
          ],
          "recommendedAction": "Re-zero the Coriolis at the next connection. Until then, use the trip tank as the arbiter for flow-based decisions.",
          "constraints": "Do not adjust or suppress the kick-detection thresholds to accommodate the drift.",
          "escalation": "Drift above 6%, or a second flow channel disagreeing → suppress the affected channel and escalate.",
          "sop": "DM-05 Sensor Cross-validation",
          "owner": "Data Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "sensor-dropout",
        "familyId": "dm",
        "name": "Sensor dropout",
        "code": "DW-DM-02",
        "description": "No action. Advisories that depended on the affected window were suppressed and re-evaluated after recovery.",
        "record": {
          "id": "sensor-dropout",
          "familyId": "dm",
          "code": "DW-DM-02",
          "name": "Sensor dropout",
          "state": "Recovered",
          "severity": "info",
          "confidence": 0.92,
          "evidence": [
            "12-second dropout on the WITS aggregator at 11:42",
            "all channels restored",
            "the affected window is flagged as interpolated"
          ],
          "causes": [
            {
              "t": "Network switch failover",
              "p": 0.68
            },
            {
              "t": "Aggregator restart",
              "p": 0.22
            },
            {
              "t": "PLC comms transient",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. Advisories that depended on the affected window were suppressed and re-evaluated after recovery.",
          "constraints": "Advisories are suppressed on any channel with data older than 30 s.",
          "escalation": "A dropout longer than 60 s → suppress dependent advisories and notify the data engineer.",
          "sop": "DM-03 Data Availability & Gaps",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "outlier-burst",
        "familyId": "dm",
        "name": "Outlier burst",
        "code": "DW-DM-03",
        "description": "No action. The samples were rejected by the range filter and did not enter any advisory calculation.",
        "record": {
          "id": "outlier-burst",
          "familyId": "dm",
          "code": "DW-DM-03",
          "name": "Outlier burst",
          "state": "Cleared",
          "severity": "info",
          "confidence": 0.85,
          "evidence": [
            "9 out-of-range samples on the torque channel in a 4-second window at 11:41, coincident with the network event"
          ],
          "causes": [
            {
              "t": "Transmission corruption during failover",
              "p": 0.71
            },
            {
              "t": "Genuine torque transient",
              "p": 0.19
            },
            {
              "t": "Filter threshold too tight",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. The samples were rejected by the range filter and did not enter any advisory calculation.",
          "constraints": "Rejected samples are logged, never silently discarded — the audit trail records every rejection.",
          "escalation": "Outlier rate above 2% of samples on any channel → suspend that channel from advisory use.",
          "sop": "DM-01 Data Quality Gating",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "model-drift",
        "familyId": "dm",
        "name": "Model drift",
        "code": "DW-DM-04",
        "description": "Continue using the model but weight the physics term higher in the blend. Queue this section for re-labelling and retraining.",
        "record": {
          "id": "model-drift",
          "familyId": "dm",
          "code": "DW-DM-04",
          "name": "Model drift",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.63,
          "evidence": [
            "Hole-cleaning model precision on this rig has fallen from 0.81 to 0.74 over 30 days",
            "recall steady at 0.88"
          ],
          "causes": [
            {
              "t": "Formation mix outside the training distribution",
              "p": 0.52
            },
            {
              "t": "SBM rheology regime under-represented",
              "p": 0.31
            },
            {
              "t": "Label quality degrading in recent events",
              "p": 0.17
            }
          ],
          "recommendedAction": "Continue using the model but weight the physics term higher in the blend. Queue this section for re-labelling and retraining.",
          "constraints": "Advisories are downgraded from Warning to Advisory automatically when precision falls below 0.70.",
          "escalation": "Precision below 0.70 → suspend the model, fall back to physics-only advisories and notify the model owner.",
          "sop": "DM-09 Model Monitoring & Drift",
          "owner": "Data Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "offset-well-mismatch",
        "familyId": "dm",
        "name": "Offset-well mismatch",
        "code": "DW-DM-05",
        "description": "Re-weight the offset set toward SBM wells before treating the P75 exceedance as an anomaly.",
        "record": {
          "id": "offset-well-mismatch",
          "familyId": "dm",
          "code": "DW-DM-05",
          "name": "Offset-well mismatch",
          "state": "Watch",
          "severity": "adv",
          "confidence": 0.6,
          "evidence": [
            "Torque is tracking above the offset P75 band",
            "the three reference wells were drilled with water-based mud, not SBM"
          ],
          "causes": [
            {
              "t": "Fluid-system mismatch in the offset set",
              "p": 0.61
            },
            {
              "t": "Different BHA configuration",
              "p": 0.24
            },
            {
              "t": "Genuinely worse hole condition",
              "p": 0.15
            }
          ],
          "recommendedAction": "Re-weight the offset set toward SBM wells before treating the P75 exceedance as an anomaly.",
          "constraints": "Offset comparison is advisory context only — it never overrides a measured constraint.",
          "escalation": "Offset similarity score below 0.60 for all references → suppress offset-based advisories.",
          "sop": "OA-01 Offset Set Curation",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "physics-ml-disagreement",
        "familyId": "dm",
        "name": "Physics–ML disagreement",
        "code": "DW-DM-06",
        "description": "Present both values with the blend, never a single unexplained number. Act on the more conservative of the two.",
        "record": {
          "id": "physics-ml-disagreement",
          "familyId": "dm",
          "code": "DW-DM-06",
          "name": "Physics–ML disagreement",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.66,
          "evidence": [
            "Physics hydraulics model gives a cuttings-loading index of 0.63",
            "the ML model gives 0.78",
            "the blended value is 0.71"
          ],
          "causes": [
            {
              "t": "Cuttings bed geometry unmodelled in the physics term",
              "p": 0.54
            },
            {
              "t": "ML over-fitting to the torque trend",
              "p": 0.31
            },
            {
              "t": "Both correct at different length scales",
              "p": 0.15
            }
          ],
          "recommendedAction": "Present both values with the blend, never a single unexplained number. Act on the more conservative of the two.",
          "constraints": "When physics and ML disagree by more than 0.15, the advisory severity is capped at Warning and requires human confirmation.",
          "escalation": "Disagreement above 0.25 → suppress the automated severity and route the incident for engineering review.",
          "sop": "DM-10 Physics–ML Blending",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "configuration-error",
        "familyId": "dm",
        "name": "Configuration error",
        "code": "DW-DM-07",
        "description": "No action. Every limit change requires a named approver and is recorded in the audit trail.",
        "record": {
          "id": "configuration-error",
          "familyId": "dm",
          "code": "DW-DM-07",
          "name": "Configuration error",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.91,
          "evidence": [
            "Last configuration change 6 days ago (ECD limit updated to 13.10 ppg)",
            "change approved and unit-validated"
          ],
          "causes": [
            {
              "t": "Configuration correct",
              "p": 0.91
            },
            {
              "t": "Unvalidated change since",
              "p": 0.09
            }
          ],
          "recommendedAction": "No action. Every limit change requires a named approver and is recorded in the audit trail.",
          "constraints": "No advisory limit may be changed without an approver and a recorded reason.",
          "escalation": "A limit changed without an approver → revert to the last approved configuration and raise an audit finding.",
          "sop": "DM-07 Tag & Unit Governance",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "unit-conversion-error",
        "familyId": "dm",
        "name": "Unit conversion error",
        "code": "DW-DM-08",
        "description": "No action. Depth in metres, pressure in psi, density in ppg, torque in ft-lbf throughout.",
        "record": {
          "id": "unit-conversion-error",
          "familyId": "dm",
          "code": "DW-DM-08",
          "name": "Unit conversion error",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.93,
          "evidence": [
            "All 214 tags carry validated units",
            "the last unit-validation run passed with no findings"
          ],
          "causes": [
            {
              "t": "Units correct",
              "p": 0.93
            },
            {
              "t": "Unvalidated tag added",
              "p": 0.07
            }
          ],
          "recommendedAction": "No action. Depth in metres, pressure in psi, density in ppg, torque in ft-lbf throughout.",
          "constraints": "Mixed-unit displays are prohibited. Every numeric value carries its unit on screen.",
          "escalation": "A unit mismatch detected → remove the tag from calculations until it is corrected.",
          "sop": "DM-07 Tag & Unit Governance",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "stale-data-advisory",
        "familyId": "dm",
        "name": "Stale data advisory",
        "code": "DW-DM-09",
        "description": "No action. The hydraulic model will flag itself as degraded if the rheology sample exceeds 4 hours.",
        "record": {
          "id": "stale-data-advisory",
          "familyId": "dm",
          "code": "DW-DM-09",
          "name": "Stale data advisory",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.9,
          "evidence": [
            "Oldest channel age 1.4 s",
            "rheology sample age 3 h 42 min, next sample due in 18 min"
          ],
          "causes": [
            {
              "t": "Data current",
              "p": 0.9
            },
            {
              "t": "Rheology sample approaching staleness",
              "p": 0.1
            }
          ],
          "recommendedAction": "No action. The hydraulic model will flag itself as degraded if the rheology sample exceeds 4 hours.",
          "constraints": "Advisories are suppressed on any channel older than 30 s. Hydraulic advisories degrade past a 4-hour rheology age.",
          "escalation": "Rheology sample older than 4 hours → downgrade hydraulic advisories to indicative and request a sample.",
          "sop": "DM-11 Data Freshness",
          "owner": "Mud Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "alert-fatigue",
        "familyId": "dm",
        "name": "Alert fatigue",
        "code": "DW-DM-10",
        "description": "Group the four correlated hole-cleaning advisories into a single parent card. Do not raise thresholds on safety-critical channels.",
        "record": {
          "id": "alert-fatigue",
          "familyId": "dm",
          "code": "DW-DM-10",
          "name": "Alert fatigue",
          "state": "Active",
          "severity": "adv",
          "confidence": 0.64,
          "evidence": [
            "14 alerts in the last hour, 9 of them Information",
            "median acknowledgement latency 3.2 min, up from 1.1 min"
          ],
          "causes": [
            {
              "t": "Redundant advisories from correlated channels",
              "p": 0.58
            },
            {
              "t": "Thresholds too tight for this section",
              "p": 0.27
            },
            {
              "t": "Crew loading late in tour",
              "p": 0.15
            }
          ],
          "recommendedAction": "Group the four correlated hole-cleaning advisories into a single parent card. Do not raise thresholds on safety-critical channels.",
          "constraints": "Information-level alerts may be grouped or deferred. Warning and Critical alerts may never be suppressed.",
          "escalation": "Acknowledgement latency above 5 min on a Warning → notify the supervisor and review alert loading.",
          "sop": "DM-12 Alert Load Management",
          "owner": "Supervisor",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "unsafe-recommendation-conflict",
        "familyId": "dm",
        "name": "Unsafe recommendation conflict",
        "code": "DW-DM-11",
        "description": "The safety-side advisory wins and the ROP advisory is withheld with its reason shown. Do not act on any withheld recommendation.",
        "record": {
          "id": "unsafe-recommendation-conflict",
          "familyId": "dm",
          "code": "DW-DM-11",
          "name": "Unsafe recommendation conflict",
          "state": "Blocked",
          "severity": "warn",
          "confidence": 0.77,
          "evidence": [
            "The ROP-optimisation advisory proposed +2 klbf WOB while the hole-cleaning advisory requires no WOB increase",
            "the conflict resolver blocked the ROP advisory"
          ],
          "causes": [
            {
              "t": "Two objectives optimising against each other",
              "p": 0.68
            },
            {
              "t": "Constraint set not shared between models",
              "p": 0.22
            },
            {
              "t": "Stale hole-cleaning state in the optimiser",
              "p": 0.1
            }
          ],
          "recommendedAction": "The safety-side advisory wins and the ROP advisory is withheld with its reason shown. Do not act on any withheld recommendation.",
          "constraints": "Safety and integrity constraints always dominate performance objectives. A blocked recommendation is never presented as an option.",
          "escalation": "Any conflict that the resolver cannot rank → suppress both recommendations and route to the drilling engineer.",
          "sop": "DM-13 Advisory Conflict Resolution",
          "owner": "Drilling Engineer",
          "status": "Open"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "autonomy-boundary-breach",
        "familyId": "dm",
        "name": "Autonomy boundary breach",
        "code": "DW-DM-12",
        "description": "No action. DrillWise is advisory-only: it recommends, a person decides, and the rig control system is never written to.",
        "record": {
          "id": "autonomy-boundary-breach",
          "familyId": "dm",
          "code": "DW-DM-12",
          "name": "Autonomy boundary breach",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.96,
          "evidence": [
            "No control writes attempted",
            "the system holds no setpoint authority over any rig system"
          ],
          "causes": [
            {
              "t": "Boundary intact",
              "p": 0.96
            },
            {
              "t": "Interface misconfiguration",
              "p": 0.04
            }
          ],
          "recommendedAction": "No action. DrillWise is advisory-only: it recommends, a person decides, and the rig control system is never written to.",
          "constraints": "The system must remain read-only. No automated parameter change, ever, under any severity.",
          "escalation": "Any write attempt → isolate the interface immediately and notify the OIM and the model owner.",
          "sop": "DM-08 Advisory System Boundary",
          "owner": "Data Engineer",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      },
      {
        "id": "audit-trail-gap",
        "familyId": "dm",
        "name": "Audit-trail gap",
        "code": "DW-DM-13",
        "description": "No action. Acknowledgements require a reason and never clear an incident on their own.",
        "record": {
          "id": "audit-trail-gap",
          "familyId": "dm",
          "code": "DW-DM-13",
          "name": "Audit-trail gap",
          "state": "Clear",
          "severity": "info",
          "confidence": 0.94,
          "evidence": [
            "All acknowledgements, notes and escalations recorded with user, timestamp and reason",
            "no gaps in the last 30 days"
          ],
          "causes": [
            {
              "t": "Audit trail complete",
              "p": 0.94
            },
            {
              "t": "Unsynchronised local record",
              "p": 0.06
            }
          ],
          "recommendedAction": "No action. Acknowledgements require a reason and never clear an incident on their own.",
          "constraints": "An acknowledgement records a decision; it does not close an incident. Only a resolution with evidence closes one.",
          "escalation": "Any missing acknowledgement record → raise an audit finding and reconstruct from the historian.",
          "sop": "DM-14 Audit & Traceability",
          "owner": "Supervisor",
          "status": "Resolved"
        },
        "createdAt": "2026-11-14T00:00:00.000Z",
        "updatedAt": "2026-11-14T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-11-14T00:00:00.000Z",
    "updatedAt": "2026-11-14T00:00:00.000Z"
  }
];
