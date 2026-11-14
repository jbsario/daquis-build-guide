# Daquis Residence build guide

One-page static site: a rotatable 3D, 24-step build of the proposed 3-storey residence at Blk 1 Lot 49 Sandari Batulao, Nasugbu, Batangas (plans by D.V. Fallarme Construction). Deployed on Vercel from `main`. No build step, no dependencies.

## Files
- `index.html`: everything (CSS, HTML, one inline script, no libraries).
- `sheets/p1.jpg p2.jpg e1.jpg e2.jpg`: plumbing (P1-07, P2-08) and electrical (E1-09, E2-10) sheets shown in Part 5.
- `vercel.json`: clean URLs, long cache for sheets.

## Page layout
Part 1 build sequence (3D viewer + step card + materials card) · Part 2 schedule codes · Part 3 member details (2D SVG) · Part 4 schedules · Part 5 plumbing and electrical · Part 6 pour checklist.

## Script map (inside the single `<script>`, in order)
1. Geometry constants. Units are **mm**. `x` = across (gridline B at 0), `z` = depth from row 1 (road) to row 4, `y` = up (garage FFL ±0.00).
   - Rows `ZR=[0,3980,6980,9980]`. Lines A/C taper: `W(z)=2650+645*z/9980`, `A(z)=-W(z)`, `C(z)=W(z)`.
   - 3rd floor/roof cantilever outline: `ZF=-1100`, `ZB=10480`, `AO(z)`, `CO(z)`.
   - `MAIN` = 11 foundation columns C1–C11 `[name,x,z,size,footingL]`. `UP`/`UPC` = 3rd-storey columns (C5, C8, C12–C21).
2. Projection and painter: `P(x,y,z)` (yaw/pitch camera), `add()`, `ln()`, `pg()`, `prism()`. Sort order is `lv` (level) → `sb` (sub-bucket) → depth.
3. Members: footings, mats, column bars/ties/forms, beams (`gridBeams`, `cantBeams`, `beamCages`), slabs, shoring, walls, openings, parapet, roof framing/roofing, stairs, planters, terrain.
4. `build(i)`: what exists at step `i` (0–23). `STEPS` array holds the text for each step (title, bullets, spec, warning, camera).
5. Quantities: `qty(i)` → `qtyHTML(i)` (concrete C21 9 bags/m³, C28 12 bags/m³; rebar m / 6m pcs / kg). Hover/tap info strings via the global `INF` set before `prism()`.
6. MEP: `mep(i)`, `mepLabels`, `mepQty` (sewer, water, storm, septic tank, panel LPP, service post, solar conduit).
7. Scenery for the finished step 23: road, trees, street lights, `carModel()` (silver crossover like the render), night mode.
8. Rebar hover/tap details: `hits(i)` adds invisible hit boxes (`HB`) around cages, mats and meshes with spacing, stirrup and tie data.
9. Views, dimension overlay `dimsSVG`, UI handlers (drag to rotate; wheel/pinch/double-tap zoom via `zoom3`, `panX`, `panY`; Shift-drag or two fingers to pan; tap for details, shown as a bottom sheet on phones; floating Back/Next over the 3D view), `render()`.

`CLAUDE-CODE-PROMPT.md` is the full rebuild/verify spec the owner pastes into Claude Code.

## Plan facts used (verify on the sheets before changing)
- Levels: sidewalk −0.20, garage ±0.00, 2nd FFL +2.65, 3rd FFL +6.05, roof beam +9.30, parapet +9.75.
- Concrete: columns C28, everything else C21. Rebar Fy415 (Grade 60) for footings, tie beams, columns, beams; FY276 (Grade 40) for 2nd/3rd floor slabs. Not specified: slab on fill, stairs, CHB, parapet, planters, septic tank, catch basin. Materials card and tap details tag every bar with its grade (`q.G` in `qty`, `GRL`).
- Footings FC1–FC11, all 300 thick; the plan's "C12-FC12" at row 1 C is treated as FC11.
- Columns 0–4.65m: C1–C9 4-#20, C10–C11 400×400 8-#16. 2nd storey: 4-#32/#25/#20, C10–C11 8-#20.
- Roof slopes down toward row 4 (roof plan arrow); box gutter at the rear, 2 downspouts.

## Conventions
- The owner wants **measurements, quantities and tap-for-details on every visual**. Keep the dimension overlay and the materials card in sync with any geometry change.
- Every color is a CSS token on `:root` with dark-mode overrides; never hard-code a color that only works in one theme (car paint excepted).
- Mark anything not in the plans as assumed (planter bars, stair risers, roof sheet spec, trees/cars).
- Quantities are model estimates, not a BOQ. Client-facing documents omit unit prices.

## Checking a change
- Syntax: extract the script and run `node --check`.
- Visual: open `index.html` with Playwright, set `localStorage['drb-step2']=<step>`, reload, screenshot `.stage`.

## Deploy
Push to `main` → Vercel redeploys automatically (project preset "Other", no build command).
