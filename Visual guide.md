Here’s a **visual GUI guide** for your cyberpunk hacking/management game—with a special focus on the **Hex-grid Server Field (small multiples)**. It’s written like a design spec you can hand to UX/UI and front-end devs.

---

# Visual GUI Guide

## 1) Design Goals

* **At-a-glance situational awareness** (income, risk, targets).
* **Low-latency decisions**: allocate servers, launch ZDEs, patch, develop.
* **Readable neon**: cyberpunk flair without sacrificing clarity or contrast.
* **Scales from MVP to “lots of competitors & servers.”**

---

## 2) Global Visual Language

### Color Tokens (CSS variables)

* `--bg-0:#0A0A0F` (page background, near-black)
* `--panel-0:#0F1117` (panel surface)
* `--line-0:#1F2330` (hairlines, separators)
* **Neon accents**

  * `--cy: #00FFFF` (primary / active / SaaS)
  * `--mg: #FF00FF` (research / exploits)
  * `--lm: #39FF14` (healthy / online / success)
  * `--am: #FFBF00` (development / progress / neutral warning)
  * `--rd: #FF3366` (breach / error)
* **States**

  * `--imm: #9CFFB0` (immune shield)
  * `--silent: #89C4FF` (silent monitor)
  * `--vuln: #FF7189` (vulnerable / unknown ZDE)
* Use **true black only for overlays and fades**; everything else sits on `--bg-0`.

### Typography

* **Headings**: `Orbitron` or `Eurostile` (caps, letter-spaced).
* **Body/Numbers**: `Roboto Mono` (clear digits).
* Size ramp: 28 / 20 / 16 / 14 px; minimum body 14 px.

### Effects

* Neon glow via subtle `text-shadow` / `box-shadow` (keep blur tight: 4–8 px).
* **Scanline** overlay at 3–5% opacity across panels is OK, but never on text.

---

## 3) Information Architecture (3-panel layout)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Top Bar: $Funds • Servers Used/Total • Tick Controls • Alerts Tray     │
└─────────────────────────────────────────────────────────────────────────┘
┌───────────────┐┌───────────────────────────────┐┌───────────────────────┐
│ Left Panel    ││ Center Panel                  ││ Right Panel           │
│ Allocation    ││ Market & Products             ││ ZDE Ops & Intel       │
│ & Clusters    ││ (cards + trend sparklines)    ││ (Known ZDEs, Actions) │
└───────────────┘└───────────────────────────────┘└───────────────────────┘
```

* **Left**: Server allocation (SaaS / Research / Dev) + **Clusters** overview + **Hex-grid Server Field** per entity (you & competitors).
* **Center**: Product cards (category, age, revenue, share), per-category **Heatmap** (you vs competitors).
* **Right**: ZDE list (known/unknown), actions (`LAUNCH`, `MONITOR`, `STEAL`, `PATCH`), recent incidents.

---

## 4) Component Inventory

### A. Top Bar

* **Money** (big, cyan), **Servers** (used/total, lime), **Tick controls** (play/pause, speed), **Alert tray** (stacked toasts).
* Microcopy on hover (e.g., “Upkeep due next tick: \$X”).

### B. Allocation Panel (Left)

* 3 vertical meters (SaaS/Research/Dev) with draggable handles.
* **Clusters strip**: pills like `Cluster A  (12 srv)`; clicking focuses corresponding hex cluster in the grid.

### C. Product Cards (Center)

* Title, Category, **Age** (months), **Efficacy bar**, **Revenue/tick**, **Market share**.
* Small **sparkline** for last 30 ticks revenue.

### D. ZDE Operations (Right)

* Known ZDE list with tags: `webcore-race`, `protobuf-overflow`, etc.
* For a selected target (competitor/cluster/product):

  * **Buttons**: `MONITOR (silent)`, `SABOTAGE`, `STEAL CODE`, `PATCH` (if you’re the target).
* Exploit details drawer: description, **immunity state**, affected versions.

---

## 5) Hex-grid Server Field (Small Multiples)

> **Purpose:** Compress **server count**, **role mix**, **clustering**, and **security state** into a tiny, scannable visual for **each competitor** (and for you).

### 5.1 Layout

* **One “tile” per entity** (You + each competitor). Default 240–320 px square.
* **Hex grid** inside the tile:

  * **Axial coordinates** (q,r); compact, flat-topped hexes.
  * **Sizing**: 14–18 px radius for MVP; auto-shrink if > 120 servers.
  * **Order**: Place SaaS first, then Research, then Dev for consistent patterning.

### 5.2 Visual encoding

* **Fill color = Role**

  * SaaS = `--cy`
  * Research = `--mg`
  * Development = `--am`
* **Cluster boundary**: halo outline around grouped hexes.

  * Thin continuous line; **thicker** for larger clusters.
* **State overlays (per hex/cluster)**:

  * **Immune**: fine lime (`--imm`) ring.
  * **Vulnerable** (unknown ZDE): red notch on NE edge (`--rd`).
  * **Silent monitor installed (you monitoring them)**: tiny cyan eye glyph centered, low-pulse opacity.
  * **Active breach (loud)**: glitch mask (2-frame jitter) in `--rd` at 15–20% opacity over cluster.
  * **Theft-exposed research**: skull-key glyph in magenta corner.

### 5.3 Legends & metrics

* **Tile header**: name/logo + totals:

  * `Servers: 96 | Clusters: 5`
  * `Role mix: SaaS 66% / R&D 24% / Dev 10%`
* **Mini legend** at tile bottom (3 dots with role colors).
* **Tooltip (hover hex)**: `Cluster B • SaaS • Server #23 • Immune: webcore-race • Age: 7m`.

### 5.4 Patterns for readability

* Keep **cluster shapes contiguous**. If a cluster spans rows, draw a faint connector line within the tile.
* Enforce **min 2px gap** between clusters so boundaries read at a glance.

### 5.5 Example small multiple layout

```
┌───────────────────────────────┐  ┌───────────────────────────────┐
│ ACERBYTE  Servers:72 Cl:4     │  │ BLACKCASK  Servers:118 Cl:6   │
│  ⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡ …         │  │  ⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡ …         │
│  ⬡ cyan= SaaS  ⬡ magenta= R   │  │  ⬡ amber= Dev                 │
└───────────────────────────────┘  └───────────────────────────────┘
```

*Hexes are colored; clusters outlined; small icons overlay states.*

---

## 6) States & Alerts

### Server/Cluster/Product States

* **Healthy**: normal glow.
* **Vulnerable**: red notch edge.
* **Immune (ZDE known)**: lime ring.
* **Silent breach (you monitoring)**: cyan eye icon, soft pulse.
* **Active breach**: red glitch overlay on cluster.
* **Code stolen**: product card gets a magenta “CLONED” tag; rival’s product shows “NEW CLONE” tag.

### Alerts

* **Toast severity**:

  * Info (cyan border), Warning (amber), Danger (red).
* Keep copy terse: “Breach: Cluster C (SaaS 18%). No theft detected (silent).”

---

## 7) User Flows

### A) Target a rival

1. Click a **competitor tile** → Hex-grid expands in a modal.
2. Hover clusters → see **role mix**, **immunity list**, **age**.
3. Click cluster → Right panel enables actions with context (`MONITOR`, `SABOTAGE`, `STEAL CODE`).
4. Confirm with a short summary (success chance, detection risk, expected impact).

### B) Allocate servers

* Drag handles in **Allocation meters** or type exact numbers.
* Cluster assignment dialog: **Auto-pack** (balanced) or **Manual** (drag to clusters).

### C) Launch new SaaS

* Open **Development** drawer:

  * Pick **Category** → see TAM, decay profile.
  * Assign **Dev servers** → progress bar (amber).
  * On launch: product card appears at **Age 0**, peak efficiency.

### D) Patching

* If you’re the target: right panel shows **PATCH** with downtime & cost.
* Patching removes **vulnerable** / **active breach** state; does not affect other ZDE immunities.

---

## 8) Responsive & Density

* **≥1280 px**: 3-panel.
* **992–1279 px**: Right panel collapses into a tabbed drawer.
* **<992 px**: Single column; Hex-grid tiles switch to **compact mode** (hide legend, keep totals).

**Performance budget**: Cap redraws at **60 fps** under 300 hexes per tile; degrade gracefully (reduce glow, static icons) when >500 hexes.

---

## 9) Accessibility

* Contrast ratio ≥ 4.5 for text over panels.
* Provide **non-color** cues (icon shapes, outlines) for all states.
* Keyboard nav:

  * `Tab` within tile → cycles clusters.
  * `Enter` → open actions.
  * `1/2/3` hotkeys for `MONITOR/SABOTAGE/STEAL`.
* Reduced motion preference: disable flicker/glitch; use solid badges.

---

## 10) Data Binding (minimal schema)

```json
{
  "entityId": "blackcask",
  "name": "BLACKCASK",
  "servers": 118,
  "clusters": [
    {
      "clusterId": "C1",
      "serverCount": 24,
      "roleMix": {"saas":18,"research":4,"dev":2},
      "states": ["vulnerable"],           // "immune","silent","activeBreach"
      "knownZDE": ["webcore-race"],
      "monitoredByPlayer": true
    }
  ],
  "products": [
    {
      "productId":"p_stream",
      "category":"Streaming",
      "ageMonths":7,
      "efficacy":62.4,
      "revenuePerTick": 18320,
      "marketShare": 0.31,
      "clonedFrom": null,
      "states": []
    }
  ]
}
```

---

## 11) Hex Layout Implementation Notes (front-end)

* **Axial grid** (flat-topped): use `(q, r)` coordinates; pixel center:

  * `x = size * (3/2 * q)`
  * `y = size * (√3/2 * q + √3 * r)`
* **Packing**: place servers row by row; **cluster assignment** groups contiguous hexes. If cluster overflow, spill to next ring.
* **Icons**: 12×12 SVGs positioned at hex center; **stroke** equals state color (e.g., `--imm` for shield, `--silent` for eye).
* **Outlines**: draw cluster hull via alpha-shape or simple bounding ring; 1–2 px stroke.

---

## 12) Micro-copy & Tooltips

* Hex (server): `SaaS • Cluster B • Immune: protobuf-overflow • Uptime 99.7%`
* Product (card): `Age 6m • Eff 0.73 • Share 28% • Rev/tick $12.8k`
* Actions:

  * **Monitor (Silent)**: “Install watcher. No data stolen; exploit remains unknown.”
  * **Sabotage**: “Reduce revenue in target cluster this tick. Reveals exploit; target can patch.”
  * **Steal Code**: “Clone SaaS if breach succeeds. Reveals exploit; target can patch.”

---

## 13) Quick Visual Checklist

* [ ] Neon palette applied sparingly (glow under 8 px).
* [ ] Hex tiles legible at 240 px width (≥ 100 servers).
* [ ] Cluster boundaries obvious at a glance.
* [ ] Non-color state cues present (icons/outlines).
* [ ] All actions reachable with keyboard + mouse.
* [ ] Performance degrades gracefully at high server counts.

---

If you want, I can turn this into a **Figma component spec** (with frames for normal/hover/active states) or draft a **starter HTML/CSS skeleton** that includes a demo hex-grid tile you can plug real data into.
