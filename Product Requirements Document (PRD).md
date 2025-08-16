# Product Requirements Document (PRD) – Cyberpunk Hacking Economy Game

## 1. Overview
- **Product Name**: *ZeroDay Syndicate* (working title)  
- **Elevator Pitch**: A cyberpunk management & hacking sim where players buy servers, run SaaS businesses, research Zero-Day Exploits (ZDEs), and wage digital warfare against AI competitors and other players.  
- **Core Fantasy**: “Run a neon-lit cyber empire — balance legitimate business with black-hat power plays.”  
- **Goals**:  
  - Provide strategic depth via server allocation and market competition.  
  - Blend economic simulation (cash flow, SaaS categories) with cyber-conflict (ZDE discovery, breaches, silent monitoring, sabotage).  
  - Offer replayability through dynamic AI rivals, random ZDE discoveries, and evolving markets.  

---

## 2. Target Audience
- Players who enjoy **strategy/resource management** (Factorio, Frostpunk).  
- Fans of **cyberpunk and hacking themes** (Uplink, Hacknet, Cyberpunk 2077’s netrunning).  
- Suited for both casual sim players (short sessions, simple choices) and deep strategy fans (layered mechanics).  

---

## 3. Gameplay Mechanics

### Servers
- **Acquisition**: Purchase with CAPEX.  
- **Upkeep**: OPEX per tick.  
- **Roles**:  
  1. **SaaS Servers** → Revenue (market share).  
  2. **Research Servers** → Discover ZDEs, replicate exploits during breaches, risk of theft.  
  3. **Development Servers** → Build new SaaS products.  
- **Clusters**: Servers can be pooled into clusters; breaches affect clusters individually.

### SaaS Products
- Generate money ∝ server time × efficiency × market share × TAM.  
- Efficiency decays with age (AgeFactor).  
- Products compete within categories against AI and players.  
- If hit by a ZDE, code leaks → attacker can clone SaaS.

### Zero-Day Exploits (ZDEs)
- **Discovery**: Probabilistic on research servers; higher chance if breached.  
- **Effects**:  
  - **Silent Breach (monitoring)** → Exploit stays secret and reusable indefinitely.  
  - **Sabotage** → Reduce revenue of a target cluster.  
  - **Steal SaaS Code** → Clone competitor’s product in that category.  
- **Theft**: Competitors can steal known ZDEs from research servers.  
- **Immunity**: Once learned, all servers are immune to that ZDE.  

### Competitors
- Controlled by AI (or other players in multiplayer).  
- Own servers, run SaaS, research ZDEs.  
- Launch ZDEs (loud or silent).  
- Compete for SaaS categories → affect market share.  

---

## 4. Game Loop
1. Buy/allocate servers.  
2. Run SaaS for revenue.  
3. Invest in R&D → discover ZDEs.  
4. Decide how to use ZDEs (silent monitor, sabotage, steal).  
5. Launch new SaaS to counter product aging.  
6. React to AI competitor breaches/attacks.  
7. Grow into a dominant cyber empire.  

---

## 5. Player Goals & Win Conditions
- **Short-term**: Optimize revenue, defend against breaches, exploit rivals.  
- **Mid-term**: Balance between SaaS growth and exploit research; time product launches.  
- **Long-term**: Dominate multiple SaaS categories or force competitors out of business.  

**Possible Win States**:  
- Market monopoly in X categories.  
- Survive to Year N with profit margin > Y.  
- Reputation track (black-hat vs white-hat).  

---

## 6. User Experience / UI
- **Style**: Cyberpunk neon (dark background, glowing cyan/magenta/lime accents).  
- **Main Dashboard**:  
  - Left: Server allocation (clusters).  
  - Center: SaaS products & market share.  
  - Right: ZDE list & actions.  
- **Competitor View**: Visualizations of rival servers (hex-grid, skyline, or radial clusters).  
- **Alerts**: Breaches, silent monitors, new discoveries → glitchy animations + synth SFX.  
- **Actions**: `Launch ZDE`, `Monitor`, `Steal`, `Patch`, `Develop New SaaS`.  

---

## 7. Technical Requirements
- **Platform**: Web (HTML/CSS/JS) or Desktop (Electron/Unity/Godot).  
- **Persistence**: Save/load via local storage or cloud.  
- **AI**: Competitors use decision trees for SaaS investment and ZDE deployment.  
- **Scalability**: Support multiple competitors and hundreds of servers efficiently.  

---

## 8. Non-Functional Requirements
- **Performance**: Tick < 200ms with 1,000+ servers.  
- **Accessibility**: High-contrast neon colors, tooltips for all actions.  
- **Replayability**: Random TAM shifts, ZDE discovery, and AI rival behaviors.  
- **Audio-Visual**: Neon glow UI, synthwave soundtrack, glitch sound effects.  

---

## 9. Roadmap

**MVP (3–4 months)**  
- Server acquisition & upkeep.  
- One SaaS category.  
- Basic ZDE discovery & usage.  
- Simple AI competitor.  

**Phase 2 (6–9 months)**  
- Multiple SaaS categories.  
- Clusters & silent breaches.  
- Theft mechanics.  
- Expanded AI strategies.  

**Phase 3 (12+ months)**  
- Multiplayer (PvP).  
- Reputation system.  
- Advanced cyberwarfare tools (botnets, APTs, alliances).  

---

## 10. Open Questions
- Should silent breaches hurt reputation if discovered later?  
- How frequent should ZDE discoveries be (balance pacing)?  
- Should SaaS categories have unique traits (e.g., Streaming = high TAM but fast decay)?  
- Should OPEX scale linearly or with thresholds (e.g., bandwidth tiers)?  
