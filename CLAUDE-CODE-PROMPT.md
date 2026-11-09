# Claude Code prompt: Daquis Residence build guide

Paste everything under the line into Claude Code. Run it inside the `jbsario/daquis-build-guide` repo (it will update the existing `index.html`) or in an empty folder (it will build the site from scratch).

---

You are working on the **Daquis Residence build guide**: a one-page, static, mobile-first website that teaches a site supervisor how to build a proposed 3-storey residence (Blk 1 Lot 49 Sandari Batulao, Nasugbu, Batangas; plans by D.V. Fallarme Construction, sheets A1-01 to E2-10). It is deployed on Vercel from the `main` branch of `github.com/jbsario/daquis-build-guide`.

## What to do
1. If `index.html` exists, read `CLAUDE.md` and `index.html` first. Treat them as the current version. Check every item in "Features" and "Acceptance checks" below; fix or add anything missing. Keep everything that already works.
2. If the folder is empty, build the whole site from this spec as a single `index.html` (inline CSS and JS, no frameworks, no build step), plus `vercel.json`, `README.md`, `CLAUDE.md`. The plan sheets go in `sheets/` (ask the owner for `p1.jpg p2.jpg e1.jpg e2.jpg` if they are missing).
3. Run the acceptance checks. Then commit with a clear message and push to `main` (Vercel redeploys on push).
4. Report back in a few lines: what changed, anything you could not verify, and the questions for the engineer that are still open.

## Hard rules
- Units are mm in code. Show metric on screen (mm, m, m², m³, kg).
- Every visual must carry **measurements, quantities and tap-for-details**. This is the owner's standing requirement.
- Anything not in the plans is labeled "assumed" (stair riser count, planter bars, roof sheet spec, lap lengths, trees, cars).
- Quantities are model estimates, not a bill of quantities. No unit prices anywhere.
- Mobile first: works one-handed on a phone (about 390px wide), no horizontal page scroll, touch targets at least 40px.
- Light and dark themes via CSS tokens on `:root` plus `prefers-color-scheme: dark` overrides. No color that only works in one theme.
- Plain, direct copy. Short sentences.

## Plan data (verify against the sheets before changing)
**Grid and taper** (S1-05). Rows 1→4 from the road: 3980, 3000, 3000 (total 9980). Lines A–B–C taper: B is straight; A and C are 2650 from B at row 1 and 3295 at row 4. Code: `W(z)=2650+645*z/9980`, `A(z)=-W(z)`, `C(z)=W(z)`; `x` across (B=0), `z` depth from row 1, `y` up.
**Columns.** 11 foundation columns: rows 2–4 have A, B, C; row 1 has A and C only. C1/C2/C3 = row 4 A/B/C, C4–C6 row 3, C7–C9 row 2, C10 row 1 A, C11 row 1 C (the plan label "C12-FC12" at row 1 C is a typo for C11/FC11; flag it).
- Footing → garage → 2nd floor (0–4.65m band): C1–C9 300×300 4-#20; C10–C11 400×400 8-#16. Ties #12 @ 75 within 450mm of each end, #10 @ 150 middle. C28.
- 2nd storey (4.65–8.05): 4-#32 (C1, C3, C4, C6, C7, C9), 4-#25 (C2, C8), 4-#20 (C5); C10–C11 8-#20.
- 3rd storey (8.05–11.3): only C5 (4-#20) and C8 (4-#25) continue. New columns start on the 3rd floor slab along the cantilever edges: C12 300×300 4-#32; C13–C21 200×300/200×400, 4-#16 to 6-#16; ties #12 @ 50 + #10 @ 100.
**Footings** (all square, 300 thick, C21, Fy415, top mat #12 @ 300 both ways):
| Mark | Col | L=B | Bottom mat |
|---|---|---|---|
| FC1 | C1 | 1400 | #12 @ 200 |
| FC2 | C2 | 1500 | #12 @ 215 |
| FC3 | C3 | 1350 | #12 @ 195 |
| FC4 | C4 | 1500 | #12 @ 215 |
| FC5 | C5 | 1650 | #12 @ 210 |
| FC6 | C6 | 1450 | #12 @ 210 |
| FC7 | C7 | 1500 | #12 @ 215 |
| FC8 | C8 | 1500 | #12 @ 215 |
| FC9 | C9 | 1450 | #12 @ 210 |
| FC10 | C10 | 1700 | #12 @ 190 |
| FC11 | C11 | 1650 | #12 @ 210 |
Footing top at −1.50, base −1.80 (from the 0–1.8m column band; excavation depth itself is not dimensioned, ask the engineer).
**Beams** (C21, Fy415). Footing tie beams 200×300 (top 2-#16, bottom 2-#12, stirrups #10 9 @ 75 each end, @ 90 mid), along every row and along A and C, B only rows 2→4, top at −0.10. 2nd floor 200×400 (typ. 2-#16 top/bottom; 11 @ 80 ends, @ 115 mid). 3rd floor 200×400 and 150×500, many CANTILEVERED. Roof beams 200×300 (2-#12 top/bottom; 9 @ 75, @ 90). Split beams per bay so stirrup end zones sit at each column.
**Cantilever outline (3rd floor and roof).** Front 1100 past row 1, rear 500 past row 4, A side about 1030–1135 past line A, C side about 470–535 past line C.
**Slabs.** Garage slab on fill 100mm, #10 @ 600 both ways. 2nd and 3rd floor slabs 100mm, #10 @ 150 both ways (FY276). 2nd floor stays inside the grid; 3rd floor fills the cantilever outline.
**Levels.** Sidewalk −0.20, garage FFL ±0.00, 2nd FFL +2.65, 3rd FFL +6.05, top of roof beam +9.30, parapet +9.75.
**Site.** Lot rises from the road to the rear (hill around +2.65 by row 2–3). Exterior RC stair up the A side from −0.20 to +2.65 (assume 14 risers × 204, treads 280, width 1.20), landing beside the house. Hanging RC planter on the 2nd floor front (hollow trough, cantilevered off the front beam) and a ground planter on the C side.
**Roof.** Rafters 2 pcs 2"×6"×2.0mm C-purlins front to back; purlins 2"×2"×1.5mm tubular @ 0.80; ribbed long-span sheets (spec not given); slopes down toward row 4 (roof plan arrow); box gutter inside the rear parapet, 2 downspouts 75mm; flashing at parapets.
**Walls.** 150 CHB, #12 @ 400 vertical and every 3 courses. Garage rear and side walls face the hill.
**Plumbing** (P1-07, P2-08). 100mm PVC sewer (1% min) from a rear cleanout to the septic tank between B and C at rows 1–2 (2.50 × 1.30 × 1.80m, 2 chambers, 150 CHB), outlet to the street. Stacks 100ØSS (T&B 1 and 2, C side near row 3), 75ØSS (service area, A side near row 4), 50ØVS through the roof. Water 20mm PPR from GV, meter, CV at the front, up the C side to row 4; risers 20ØCWR. Storm: perforated 100mm PVC with filter cloth around the buried garage walls; downspouts to a 100mm collector down the C side to the street.
**Electrical** (E1-09, E2-10). 230V 1-phase. Concrete service post at the front C side (3.5m min), main 125AT 2P NEMA 3R, feeder 2-38mm² + 1-8mm² THHN in 25mm RSC, panel LPP on the garage C wall near row 1–2, 18 circuits, total 29,770 W / 129.42 A. Lighting CKT 1/2/3 = garage 14 / 2nd 26 / 3rd 29 outlets; convenience CKT 4/5/6 = 3 / 11 / 13. Special: range, ref, microwave, 3 × ACU 2HP, 2 × ACU 1HP, 2 water heaters, 2 spares. Branch 2-3.5mm² + 1-3.5mm² ground in 20mm PVC. Solar: roof panels → inverter + battery bank → net meter (panel size not in plans, flag it).

## Features
1. **3D build viewer** (inline SVG, own projection, no libraries): yaw/pitch camera, painter's sort by level → bucket → depth. Default view front-left like the A1-01 perspective. Camera modes Auto / Whole house / Close-up.
2. **24 steps** (listed below) with step card (title, bullets, spec, watch-out), phase chips, progress bar, Back/Next, arrow keys, and **floating Back / Next buttons over the 3D view** with a "08 / 24" counter so phone users never scroll to change steps. New parts briefly flash. Remember the last step in localStorage (wrapped in try/catch).
3. **Rotate, zoom, pan**: one-finger/mouse drag rotates; wheel, pinch, double-tap and −/+/Fit buttons zoom (60–1000%); Shift-drag, right-drag or two fingers pan. Rotate buttons ±30° and "Front view".
4. **Dimensions overlay** (toggle): grid bubbles A–C and 1–4, bay spacings, widths 2650/3295, footing marks and sizes, column labels, level tags, cantilever 1100, stair risers. Off by default on the finished step.
5. **Tap / hover details** on everything: footings, columns, beams (span, clear span, concrete, bars, stirrup count), slabs, walls, stairs, planters, parapet, roof, pipes, tank, panel, trees, cars. **Every rebar cage, mat and mesh** has a hit box showing spacing, ties/stirrups per zone, tie size, hook, cover, counts, m and kg. On phones the details open in a panel under the 3D view with a close button.
6. **Materials card per step**: concrete m³ with cement bags (C21 = 9 bags/m³, C28 = 12 bags/m³), sand 0.5 m³/m³, gravel 1.0 m³/m³; rebar per size in m, pcs × 6m and kg (10 = 0.617, 12 = 0.888, 16 = 1.578, 20 = 2.466, 25 = 3.853, 32 = 6.313 kg/m); formwork, shoring posts, CHB, gravel, excavation, pipes, wire, boxes, roofing. Running total so far. Check: the 20mm bars at step 4 must come to 36 pcs × 6m ≈ 483 kg; the whole house ≈ 60 m³ concrete, ≈ 9.5 t rebar.
7. **Pipes & wiring layer** (toggle): underground from the slab-on-fill step, risers with each floor, panel and solar in the finishing steps. Hidden by default on the finished step.
8. **Finished step looks like the render**: white frame around a dark cantilevered 3rd-floor box, recessed 2nd floor with glass and a hanging planter, stone garage front with a silver compact crossover parked nose out, exterior stairs on the A side, grass slopes, trees, road with lane marks, curb, 2 street lights, a car driving along the road (stops if reduced motion is on), and a Night toggle (darken scene, warm windows, lamp pools, headlights).
9. **Reference sections**: schedule codes glossary; 2D detail figures (footing plan and section, column section and tie elevation, tie beam section and stirrup elevation); schedule tables (footings, column bands, beams, slabs); plumbing and electrical sheets with tabs and zoom, plumbing and electrical summaries, full load schedule; pour checklist; questions for the engineer.

## The 24 steps
1. **Layout and gridlines** (Foundation)
   - Pull strings for rows 1–4 (front to back: 3980, 3000, 3000) and lines A–B–C.
   - Lines A and C are not parallel. The house is 5.30m wide at row 1 (road) and 6.59m at row 4 (rear).
   - Orange dots mark 11 columns: three each on rows 2–4, and only A and C on row 1.
   - Spec: A–B and B–C: 2650 at row 1 → 3295 at row 4 (645mm taper per side)
   - Watch: The bays are trapezoids, so the diagonals will NOT match. Set out from measured offsets off line B, not by squaring diagonals.

2. **Excavation into the slope** (Foundation)
   - The lot rises from the road to the rear. The garage floor (±0.00) is cut into the hill.
   - Dig 11 footing pits, about 300mm wider than each footing per side.
   - The rear pits (row 4) start from a much higher natural grade, so they are deeper cuts.
   - Spec: Column schedule band 0–1.8m suggests about 1.8m from footing base to ground slab
   - Watch: Confirm the excavation depth with the engineer. Cut faces near the rear need shoring or a retaining wall plan.

3. **Gravel bed and bottom mat** (Foundation)
   - Spread and compact 50–100mm of gravel in each pit.
   - Lay the bottom mat of 12mm bars both ways.
   - Raise it 75mm on concrete spacers.
   - Spec: #12 @ 190–215 per footing mark (FC1 = #12 @ 200, 7 bars each way)
   - Watch: Each footing has its own size and spacing. Check the table in Part 4.

4. **Column bars on the mat** (Foundation)
   - C1–C9: four 20mm bars each (36 bars total).
   - C10 and C11 at the front (row 1) are bigger: 400×400 with eight 16mm bars.
   - Hook the bars onto the mat, add a few ties, and plumb each cage.
   - Spec: C1–C9: 300×300, 4-#20 · C10–C11: 400×400, 8-#16
   - Watch: The front columns are bigger because they carry the 1.1m cantilevered 3rd floor above.

5. **Footing top mat** (Foundation)
   - Lay the top mat of 12mm bars at 300mm both ways.
   - Tie it to the column bars.
   - Inspect sizes, spacing and cover before pouring.
   - Spec: Top mat #12 @ 300 both ways on every footing
   - Watch: This is the last chance to fix the footing steel.

6. **Pour the footings** (Foundation)
   - Pour C21 concrete, 300mm thick.
   - Rod or vibrate so there are no voids.
   - Keep the concrete wet 3–7 days.
   - Spec: FC1–FC11 · D1 = 300 · C21 : Fy415
   - Watch: The foundation plan labels the row-1 C footing "C12-FC12". The schedule only goes to C11/FC11, so it is most likely a typo for FC11 (1650 × 1650). Confirm.

7. **Footing tie beams** (Foundation)
   - 200×300 beams along all four rows and along lines A and C.
   - Line B has tie beams only from row 2 to row 4.
   - Stirrups: 9 at 75 near each column, 90 in the middle.
   - Spec: B1: top 2-#16 · bottom 2-#12 · 9-2L-#10@75 | @90 | 9@75
   - Watch: The A and C beams run on a slant because of the taper. Cut bars to the real slanted length.

8. **Ground column ties and forms** (Garage level)
   - Finish the column ties: tight in the 450mm end zones, 150mm in the middle.
   - Keep ties going through the beam joints.
   - Form, brace and plumb each column.
   - Spec: #12 @ 75 within 450mm of each end · #10 @ 150 middle · C28
   - Watch: The garage storey is 2.65m tall, the shortest in the house.

9. **Pour columns, backfill** (Garage level)
   - Pour the columns in C28 and the tie beams in C21.
   - Strip the forms after 1–2 days and keep curing.
   - Backfill around the footings in compacted layers.
   - Spec: Columns C28 (≈1:1.5:3) · tie beams C21 (≈1:2:4)
   - Watch: The rear and A-side walls of the garage hold back the hill. Waterproof them before backfilling.

10. **Underground pipes, septic tank, slab rebar** (Garage level)
   - Build the septic tank (2.50 × 1.30 × 1.80m, 2 chambers) between lines B and C, rows 1–2. Run the 100mm PVC sewer from the rear cleanout to the tank, and from the tank to the street.
   - Lay the perforated 100mm storm drain around the buried garage walls, the 20mm water main up the C side, and the 25mm RSC service conduit to the panel (P1-07, E2-10).
   - Test the pipes, backfill, compact, add 100mm gravel, then lay 10mm bars at 600mm both ways on 50mm chairs.
   - Spec: Slab on fill: 100mm · #10 @ 600 both ways (foundation plan note)
   - Watch: Tie the mesh to the tie beam bars at the edges.

11. **Pour the garage slab** (Garage level)
   - Pour 100mm of C21 at ±0.00.
   - Slope the floor slightly toward the front drain.
   - The driveway and sidewalk outside are at −0.20.
   - Spec: Garage FFL ±0.00 · sidewalk −0.20
   - Watch: Keep the slab wet for 7 days.

12. **Stair and planter rebar** (Garage level)
   - Exterior stair on the A side: 12mm main bars @ 200 along the slope (blue), 10mm distribution bars across (green).
   - One bent bar per step follows the riser and tread, with a nosing bar at each step edge (orange), per stair detail 9.
   - A thickened footing at the bottom with 4-12mm bars. The landing gets its own mesh. The C-side ground planter gets bars in its floor and walls.
   - Spec: Stair detail 9: 12mm top and bottom bars @ 200 · 12mm @ 250 at the step footing · 10mm nosing bar
   - Watch: The plans give no riser count or landing size. About 14 risers of 200mm with 280mm treads are assumed. Confirm before forming.

13. **Pour stairs and ground planter** (Garage level)
   - Pour the stair and landing in C21, from the bottom up.
   - Pour the planter floor first, then its walls.
   - Cure 7 days before anyone walks on the stairs.
   - Spec: Stairs run from −0.20 at the sidewalk to +2.65 at the 2nd floor
   - Watch: Leave a weep hole in the planter floor for drainage.

14. **Shoring and formwork** (2nd floor)
   - Shore the 2nd floor deck from the garage slab.
   - Form the beam bottoms at +2.25 and the slab deck at +2.55.
   - The 2nd floor stays inside the gridlines, with no cantilever.
   - Spec: Beam soffit +2.25 · slab soffit +2.55 · 2nd FFL +2.65
   - Watch: Keep the shoring until the engineer releases it (usually 14–28 days).

15. **Beams and slab rebar** (2nd floor)
   - Place 200×400 beam cages along all rows and lines A, B, C.
   - Lay slab bars, 10mm at 150mm both ways (drawn here at half density). Leave the stair opening in the A–B bay near row 3.
   - Hanging planter at the front: floor and wall bars, with the floor bars run back into the front beam (formwork dashed).
   - Spec: 2nd floor beams B1–B18 · 2-#16 top · stirrups 11–12 @ 75–80 ends, @115 mid
   - Watch: The planter's size and bars aren't detailed in the plans. 10mm @ 200 is shown as an assumption, so get the engineer's detail.

16. **Pour 2nd floor** (2nd floor)
   - Pour beams and slab together in C21.
   - Cast the hanging planter at the same time: a hollow concrete trough cantilevered off the front beam, with its bottom slab bars anchored into the beam.
   - Screed to +2.65 and cure for 7 days.
   - Spec: Slab 100mm · C21 : FY276
   - Watch: The column bars stick up to lap with the 2nd-storey columns.

17. **2nd storey columns** (2nd floor)
   - Lap the new bars onto the stubs.
   - This storey is heavier: 4-#25 or 4-#32 in most 300×300 columns, 8-#20 in C10–C11.
   - Tie, form and plumb.
   - Spec: Band 4.65–8.05: 4-#32 (C1, C3, C4, C6, C7, C9), 4-#25 (C2, C8), 4-#20 (C5)
   - Watch: 4-#32 in a 300 column is very congested. Use small aggregate and vibrate well.

18. **Cantilevered 3rd floor** (3rd floor)
   - The 3rd floor slab sticks out 1.1m past row 1 at the front, about 1.1m past line A and 0.5m past line C.
   - Cantilever beams extend from every column out to the slab edge.
   - Shore the overhang from the 2nd floor and the ground below.
   - Spec: 3rd floor framing: 200×400 and 150×500 beams, many marked CANTILEVERED · slab #10 @ 150
   - Watch: Cantilevers need their top bars anchored well back into the span. Never cut top bars short here.

19. **Pour 3rd floor, start upper columns** (3rd floor)
   - Pour the 3rd floor beams and slab.
   - Most main columns stop here. Only C5 and C8 on line B continue up.
   - New columns C12–C21 start on the 3rd floor slab, along the cantilevered edges.
   - Spec: C13–C21: 200×300 or 200×400, 4-#16 to 6-#16, ties #12 @ 50 + #10 @ 100
   - Watch: These columns sit on the cantilever beams. Their bars must be cast into the 3rd floor beams. Set them before the pour.

20. **Roof beam cages** (Roof)
   - Pour the 3rd-storey columns.
   - The roof beam frame follows the same cantilevered outline as the 3rd floor.
   - Stand the parapet bars on the edge beams (#12 @ 400), and set anchor plates for the rafters.
   - Spec: Roof beams 200×300 and 150×500 · top of roof beam +9.30
   - Watch: Many roof beams are also marked CANTILEVERED. Treat their top bars the same way.

21. **Pour roof beams and parapet** (Roof)
   - Pour the roof beams.
   - Build the parapet around the whole edge to +9.75 (450mm high).
   - Spec: Top of roof beam +9.30 · top of parapet +9.75
   - Watch: Leave 2 scupper openings in the rear parapet for the gutter outlets.

22. **Roof framing and roofing** (Roof)
   - Rafters: 2 pcs 2"×6"×2.0mm C-purlins, running front to back. Purlins: 2"×2"×1.5mm tubulars at 0.80m.
   - Lay the ribbed roof sheets front to back (shown half laid). Per the roof plan arrow they slope down toward the rear, hidden behind the front and side parapets.
   - At the rear, a box gutter inside the parapet drains through scuppers to 2 downspouts. Flashing seals the sheets against the parapets.
   - Spec: Rafter 2-2"×6"×2.0mm C · purlins 2"×2"×1.5mm @ 0.80 · ribbed long-span sheets (material, gauge and color not specified)
   - Watch: The plans don't specify the sheet material, thickness or slope. Agree on them with the owner and engineer before ordering.

23. **Walls and openings** (Walls & finish)
   - Stand the vertical bars first: 12mm @ 400, tied to dowels in the beams and slabs.
   - Lay the blocks up around the bars. Horizontal 12mm bars go every 3 courses (orange lines), and the bar cells are filled with mortar.
   - The walls are shown half built here. The garage walls on the rear and sides face the hill.
   - Spec: CHB: #12 @ 400 vertical and horizontal
   - Watch: Embed conduits and boxes while laying blocks.

24. **Finished house** (Walls & finish)
   - Plaster and paint: a white frame around the 3rd-floor box with a dark wall inside it, as in the perspective. Shown with the street, trees, landscaping and cars, like the render. Tap Night to turn the lights on.
   - Install aluminum windows (6mm glass), doors and the garage door. Pull the wires, mount panel LPP and fit the fixtures, outlets and switches.
   - Landscape the slope and the planters. Tap "Pipes & wiring" to see the hidden lines through the finished walls.
   - Spec: 300 column → about 330–340mm finished
   - Watch: Compare this view with the perspective on sheet A1-01.

## Acceptance checks
- `node --check` passes on the extracted script; no console errors in Playwright.
- Screenshot steps 1, 4, 8, 12, 15, 18, 22, 24 at 1250×950 and as iPhone 13 (with a viewport meta). Nothing clipped, no horizontal scroll, floating Back/Next visible and working.
- Tap a column cage (step 8), a tie beam (step 7) and a footing mat (step 5) on the phone emulation: the details panel shows spacing and counts.
- Pinch/wheel zoom changes the viewBox; "Fit" restores it.
- Materials: step 4 shows 20mm 36 pcs; totals land near 60 m³ and 9.5 t.
- Light and dark mode both readable.

## Open questions for the engineer (keep listed on the page)
Excavation depth · lap splice lengths · concrete cover · row-1 C footing label (C12-FC12 vs FC11) · 4-#32 in a 300×300 column · tie beam top elevation · plaster thickness · stair riser count and landing · planter rebar · roof sheet material/gauge/slope · solar panel size.
