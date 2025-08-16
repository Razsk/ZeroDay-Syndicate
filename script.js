/* ---------- CONFIG & GAME STATE ---------- */
const ROLE_FILL = { saas:'var(--cy)', research:'var(--mg)', dev:'var(--am)' };
const CLUSTER_STROKE = { A:'#2bd9ff', B:'#ff83ff', C:'#ffe082', D:'#6effa8', E:'#aab7ff' };


// Game Balance
const TICK_INTERVAL = 15000; // ms
const AI_SAAS_COST = 1500;
const AI_RESEARCH_COST = 1000;
const AI_DEV_COST = 1000;
const PASSIVE_INCOME = 50;
const SERVER_OPEX = 25; // Opex cost per server per tick
const ZDE_DISCOVERY_CHANCE = 0.1; // 10% per research server per tick
const ZDE_ATTACK_POWER = 3000;

// Content Generation
const SAAS_CATEGORY_DATA = {
    "Social Media": { tam: 60000 },
    "Streaming Service": { tam: 80000 },
    "Cloud Storage": { tam: 50000 },
    "VPN Provider": { tam: 40000 },
    "Online Gaming": { tam: 70000 },
    "Crypto Exchange": { tam: 90000 },
    "E-commerce Platform": { tam: 75000 },
    "Music Production": { tam: 30000 },
    "Fitness Tracker": { tam: 35000 },
    "Ad Blocker": { tam: 25000 }
};
const ALL_SAAS_CATEGORIES = Object.keys(SAAS_CATEGORY_DATA);
const NAME_PREFIX = ["Cyber", "Neuro", "Hex", "Data", "Quantum", "Astro", "ZeroDay", "Bio", "Giga", "Tera", "Peta", "Exa"];
const NAME_CORE = ["Core", "Cortex", "Matrix", "Chain", "Pulse", "Ware", "Logic", "Sec", "Grid", "Node", "Link", "Net"];
const NAME_SUFFIX = ["Syndicate", "Dynamics", "Systems", "Collective", "Labs", "Group", "Corp", "Ventures", "Holdings", "Solutions", "Enterprises"];

let gameState = {};
let gameLoopInterval = null;
let cashChart = null;
let marketChart = null;
let zdeAnimationState = {};

// Element cache
const E = {
    tooltip: document.getElementById('tip'),
    player: {
        money: document.getElementById('player-money'),
        cashflow: document.getElementById('player-cashflow'),
        zdeCount: document.getElementById('player-zde-count'),
        totalServers: document.getElementById('player-total-servers'),
    },
    ai: {
        svg: document.getElementById('ai-hexsvg'),
        totalServers: document.getElementById('ai-srvTotal'),
        money: document.getElementById('ai-money'),
        brand: document.getElementById('ai-brand'),
    },
    buttons: {
        save: document.getElementById('btn-save'),
        load: document.getElementById('btn-load'),
        help: document.getElementById('btn-help'),
        helpClose: document.getElementById('help-close'),
    },
    log: document.getElementById('log-box'),
    helpModal: document.getElementById('help-modal'),
};

/* ---------- HEX GRID RENDERING LOGIC ---------- */
function hexPoints(cx, cy, r) {
  const a = Math.sqrt(3)/2 * r;
  const pts = [
    [cx + r, cy], [cx + r/2, cy + a], [cx - r/2, cy + a],
    [cx - r, cy], [cx - r/2, cy - a], [cx + r/2, cy - a],
  ];
  return pts.map(p => p.join(',')).join(' ');
}

function axialToPixel(q, r, size) {
  const x = size * (1.5 * q);
  const y = size * (Math.sqrt(3) * r + Math.sqrt(3)/2 * q);
  return [x, y];
}

function renderHexGrid(entity, svgEl) {
    if (!svgEl) return;
    svgEl.innerHTML = '';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let q = 0, r = 0, colMax = 8;
    const serverList = [];

    // This function now renders the AI grid based on its new product structure
    if (entity.products) {
        for (const cat in entity.products) {
            const product = entity.products[cat];
            for (let i = 0; i < (product.saas?.serverCount || 0); i++) serverList.push(cat);
            for (let i = 0; i < (product.research?.serverCount || 0); i++) serverList.push('research');
            for (let i = 0; i < (product.dev?.serverCount || 0); i++) serverList.push('dev');
        }
    }
     if (entity.research) {
        for (let i = 0; i < (entity.research.serverCount || 0); i++) serverList.push('research');
     }


    for (let i = 0; i < serverList.length; i++) {
        const role = serverList[i];
        const [px, py] = axialToPixel(q, r, 10);
        const cx = px + 20;
        const cy = py + 20;
        const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        hex.setAttribute('points', hexPoints(cx, cy, 10));
        hex.setAttribute('class','hex');
        let fill_role = gameState.saasCategories.includes(role) ? 'saas' : role;
        hex.setAttribute('fill', ROLE_FILL[fill_role] || '#333');
        hex.setAttribute('stroke', '#2a334a');
        hex.setAttribute('stroke-width', 1);
        g.appendChild(hex);
        q++;
        if (q >= colMax) { q = 0; r++; }
    }
    svgEl.appendChild(g);
    const maxR = r;
    const width = 10 * 1.5 * colMax + 10 * 4;
    const height = (Math.sqrt(3) * 10) * (maxR + 1) + (Math.sqrt(3) * 10) * 2;
    svgEl.setAttribute('viewBox', `0 0 ${Math.ceil(width)} ${Math.ceil(height)}`);
}

function renderMainHexUI() {
    const svg = document.getElementById('main-hex-svg');
    if (!svg) return;
    svg.innerHTML = '';

    const containerWidth = svg.clientWidth;
    const containerHeight = svg.clientHeight;
    if (containerWidth === 0 || containerHeight === 0) return;

    const center_x = containerWidth / 2;
    const center_y = containerHeight / 2;
    const r_large = Math.min(containerWidth, containerHeight) / 5;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);

    // 1. Central Hex (ZDEs)
    const centralHexG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    centralHexG.id = 'zde-container';
    const centralHex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    centralHex.setAttribute('points', hexPoints(center_x, center_y, r_large));
    centralHex.setAttribute('fill', 'rgba(255, 0, 255, 0.05)');
    centralHex.setAttribute('stroke', 'var(--mg)');
    centralHex.setAttribute('stroke-width', '2');
    centralHex.style.filter = 'drop-shadow(0 0 10px var(--mg))';
    centralHexG.appendChild(centralHex);

    const zdeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    zdeText.setAttribute('x', center_x);
    zdeText.setAttribute('y', center_y - r_large + 30); // Move below top border
    zdeText.setAttribute('fill', 'var(--mg)');
    zdeText.setAttribute('text-anchor', 'middle');
    zdeText.setAttribute('font-size', '20');
    zdeText.classList.add('glow');
    zdeText.textContent = "ZDE Payloads";
    centralHexG.appendChild(zdeText);

    const zdeDisplay = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    zdeDisplay.setAttribute('x', center_x - r_large * 0.8);
    zdeDisplay.setAttribute('y', center_y);
    zdeDisplay.setAttribute('width', r_large * 1.6);
    zdeDisplay.setAttribute('height', r_large * 0.8);
    const zdeDisplayDiv = document.createElement('div');
    zdeDisplayDiv.id = 'zde-display';
    zdeDisplay.appendChild(zdeDisplayDiv);
    centralHexG.appendChild(zdeDisplay);

    g.appendChild(centralHexG);

    // 2. Surrounding Category Hexes
    gameState.saasCategories.forEach((cat, i) => {
        const angle_deg = 60 * i + 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        const hex_distance = r_large * 1.8;
        const cx = center_x + hex_distance * Math.cos(angle_rad);
        const cy = center_y + hex_distance * Math.sin(angle_rad);

        const categoryHex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        categoryHex.setAttribute('points', hexPoints(cx, cy, r_large * 0.8));
        categoryHex.setAttribute('fill', 'rgba(0, 255, 255, 0.05)');
        categoryHex.setAttribute('stroke', 'var(--cy)');
        categoryHex.setAttribute('stroke-width', '2');
        categoryHex.id = `category-hex-${i}`;
        categoryHex.dataset.category = cat;
        categoryHex.classList.add('dropzone');
        g.appendChild(categoryHex);

        // New label logic
        const label_distance = r_large * 2.8; // Place it further out
        const lx = center_x + label_distance * Math.cos(angle_rad);
        const ly = center_y + label_distance * Math.sin(angle_rad);

        let rotation = 0;
        let textAnchor = 'middle';

        // Left side (angles 150, 210)
        if (angle_deg > 120 && angle_deg < 240) {
            rotation = -60;
            textAnchor = 'end';
        }
        // Right side (angles 30, 330)
        else if (angle_deg < 60 || angle_deg > 300) {
            rotation = 60;
            textAnchor = 'start';
        }

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', lx);
        text.setAttribute('y', ly);
        text.setAttribute('transform', `rotate(${rotation}, ${lx}, ${ly})`);
        text.setAttribute('fill', 'var(--txt)');
        text.setAttribute('text-anchor', textAnchor);
        text.setAttribute('font-size', '16');
        text.style.pointerEvents = 'none';
        text.textContent = cat;
        g.appendChild(text);

        // Render servers inside this hex
        renderServersInHex(g, cx, cy, r_large * 0.7, gameState.player.servers[cat], cat);
    });
}

function renderServersInHex(svgGroup, hexCx, hexCy, radius, servers, category) {
    const server_r = 12;
    let serversToRender = [];
    ['saas', 'research', 'dev'].forEach(type => {
        // The structure is now servers[type].servers
        const serverList = servers[type]?.servers || [];
        for(let i = 0; i < serverList.length; i++) {
            serversToRender.push(serverList[i]);
        }
    });

    const num_servers = serversToRender.length;
    if (num_servers === 0) return;

    const max_cols = Math.floor(radius * 1.8 / (server_r * 1.5));
    let q = 0, r = 0;
    const start_r = -Math.floor((num_servers / max_cols) / 2);

    for (let i = 0; i < serversToRender.length; i++) {
        const server = serversToRender[i];
        const [px, py] = axialToPixel(q, r + start_r, server_r);

        const total_width = server_r * 1.5 * (Math.min(num_servers, max_cols) - 1);
        const final_x = hexCx + px - total_width / 2;
        const final_y = hexCy + py;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'server-hex-group');
        g.dataset.serverInfo = JSON.stringify(server); // Store info for tooltip
        g.dataset.sourceCategory = category; // Store source category

        const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        hex.setAttribute('points', hexPoints(final_x, final_y, server_r));
        hex.setAttribute('class','hex');
        hex.setAttribute('fill', ROLE_FILL[server.type]);
        hex.setAttribute('stroke', CLUSTER_STROKE[server.cluster] || '#2a334a');
        hex.setAttribute('stroke-width', 1.25);
        g.appendChild(hex);

        // Add state overlays using CSS classes
        const overlays = [];
        if (server.immune) {
            const ring = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            ring.setAttribute('points', hexPoints(final_x, final_y, server_r-2));
            ring.setAttribute('class', 'immune-ring');
            overlays.push(ring);
        }
        if (server.vulnerable) {
            const notch = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const p1 = [final_x + server_r*0.60, final_y - (Math.sqrt(3)/2)*server_r*0.18];
            const p2 = [final_x + server_r*0.98, final_y];
            const p3 = [final_x + server_r*0.60, final_y + (Math.sqrt(3)/2)*server_r*0.18];
            notch.setAttribute('points', [p1,p2,p3].map(p=>p.join(',')).join(' '));
            notch.setAttribute('class', 'vuln-notch');
            overlays.push(notch);
        }
        if (server.silent) {
            const eye = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const w = server_r*.95, h = server_r*.65;
            eye.setAttribute('d', `M ${final_x-w/2},${final_y} C ${final_x-w/4},${final_y-h/2} ${final_x+w/4},${final_y-h/2} ${final_x+w/2},${final_y} C ${final_x+w/4},${final_y+h/2} ${final_x-w/4},${final_y+h/2} ${final_x-w/2},${final_y} Z`);
            eye.setAttribute('class', 'eye');
            const pupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            pupil.setAttribute('cx', final_x); pupil.setAttribute('cy', final_y); pupil.setAttribute('r', server_r*.18);
            pupil.setAttribute('class', 'eye-pupil');
            overlays.push(eye, pupil);
        }
        overlays.forEach(o => g.appendChild(o));

        // Add tooltip events
        g.addEventListener('mousemove', (e) => {
            const serverInfo = JSON.parse(e.currentTarget.dataset.serverInfo);
            let status = 'OK';
            if (serverInfo.immune) status = 'IMMUNE';
            if (serverInfo.vulnerable) status = 'VULNERABLE';
            if (serverInfo.silent) status = 'MONITORED';
            E.tooltip.innerHTML = `ID: ${serverInfo.id}<br>Type: ${serverInfo.type.toUpperCase()}<br>Cluster: ${serverInfo.cluster}<br>Status: ${status}`;
            E.tooltip.style.left = e.clientX+'px';
            E.tooltip.style.top = e.clientY+'px';
            E.tooltip.style.opacity = 1;
        });
        g.addEventListener('mouseleave', () => E.tooltip.style.opacity = 0);


        svgGroup.appendChild(g);

        q++;
        if (q >= max_cols) {
            q = 0;
            r++;
        }
    }
}


/* ---------- GAME LOGIC & INITIALIZATION ---------- */

function generateSyndicateName() {
    const prefix = NAME_PREFIX[Math.floor(Math.random() * NAME_PREFIX.length)];
    const core = NAME_CORE[Math.floor(Math.random() * NAME_CORE.length)];
    const suffix = NAME_SUFFIX[Math.floor(Math.random() * NAME_SUFFIX.length)];
    return `${prefix}${core} ${suffix}`;
}

function generateZdeName() {
    const prefix = NAME_PREFIX[Math.floor(Math.random() * NAME_PREFIX.length)];
    const core = NAME_CORE[Math.floor(Math.random() * NAME_CORE.length)];
    return `${prefix}-${core}`;
}

function getTotalServers(entity, entityType) {
    let total = 0;
    if (entityType === 'player') {
        if (entity.servers) {
            gameState.saasCategories.forEach(cat => {
                total += (entity.servers[cat]?.saas.servers.length || 0);
                total += (entity.servers[cat]?.research.servers.length || 0);
                total += (entity.servers[cat]?.dev.servers.length || 0);
            });
        }
    } else { // AI
        if(entity.products) {
            gameState.saasCategories.forEach(cat => {
                total += (entity.products[cat]?.saas.serverCount || 0);
                total += (entity.products[cat]?.research.serverCount || 0);
                total += (entity.products[cat]?.dev.serverCount || 0);
            });
        }
        total += entity.research?.serverCount || 0; // Add general research
    }
    return total;
}

function getSaasServers(entity, entityType) {
    if (entityType === 'player') {
        return gameState.saasCategories.reduce((total, cat) => total + (entity.servers[cat]?.saas.servers.length || 0), 0);
    } else { // AI
        return gameState.saasCategories.reduce((total, cat) => total + (entity.products[cat]?.saas.serverCount || 0), 0);
    }
}

function getTotalResearchServers(entity, entityType) {
    if (entityType === 'player') {
        return gameState.saasCategories.reduce((total, cat) => total + (entity.servers[cat]?.research.servers.length || 0), 0);
    } else { // AI
        const general = entity.research?.serverCount || 0;
        const specific = gameState.saasCategories.reduce((total, cat) => total + (entity.products[cat]?.research.serverCount || 0), 0);
        return general + specific;
    }
}

function updateUI() {
    // Stats
    // The playerIncome calculation is now handled entirely within gameTick.
    // We just read the value from the new gameState property.
    E.player.money.textContent = Math.floor(gameState.player.money);
    E.player.cashflow.textContent = Math.floor(gameState.player.lastTickNetRevenue || 0);
    E.player.totalServers.textContent = getTotalServers(gameState.player, 'player');
    E.ai.money.textContent = Math.floor(gameState.ai.money);
    E.ai.totalServers.textContent = getTotalServers(gameState.ai, 'ai');
    E.ai.brand.textContent = gameState.ai.name;
    E.player.zdeCount.textContent = gameState.player.zdes.length;

    // Grids
    renderMainHexUI(); // New main UI renderer
    renderHexGrid(gameState.ai, E.ai.svg); // Keep AI grid for now
    renderZDEs();

    // Update charts
    if (cashChart && gameState.history?.cash) {
        cashChart.data.labels = gameState.history.cash.map(h => `T${h.tick}`);
        cashChart.data.datasets[0].data = gameState.history.cash.map(h => h.player);
        cashChart.data.datasets[1].data = gameState.history.cash.map(h => h.ai);
        cashChart.update('none');
    }

    if (marketChart && gameState.market && gameState.saasCategories) {
        marketChart.data.labels = gameState.saasCategories;
        marketChart.data.datasets[0].data = gameState.saasCategories.map(cat => gameState.market[cat]?.playerShare || 0);
        marketChart.data.datasets[1].data = gameState.saasCategories.map(cat => gameState.market[cat]?.aiShare || 0);
        marketChart.update('none');
    }
}

function renderZDEs() {
    const container = document.getElementById('zde-display');
    if (!container) return;
    container.innerHTML = '';

    // Clean up old animation states
    const currentZdeIds = new Set(gameState.player.zdes.map(z => z.id));
    for (const id in zdeAnimationState) {
        if (!currentZdeIds.has(id)) {
            delete zdeAnimationState[id];
        }
    }

    const containerRect = container.getBoundingClientRect();

    gameState.player.zdes.forEach(zde => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'zde-item');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '32');
        svg.setAttribute('height', '32');
        svg.dataset.id = zde.id;

        const triangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        triangle.setAttribute('points', '12,2 22,20 2,20');
        svg.appendChild(triangle);

        svg.addEventListener('mousemove', (e) => {
            E.tooltip.style.left = e.clientX+'px';
            E.tooltip.style.top = e.clientY+'px';
            E.tooltip.innerHTML = zde.name;
            E.tooltip.style.opacity = 1;
        });
        svg.addEventListener('mouseleave', () => E.tooltip.style.opacity = 0);

        container.appendChild(svg);

        // Initialize animation state if it doesn't exist
        if (!zdeAnimationState[zde.id]) {
            zdeAnimationState[zde.id] = {
                el: svg,
                x: Math.random() * (containerRect.width - 32),
                y: Math.random() * (containerRect.height - 32),
                vx: (Math.random() - 0.5) * 0.5, // Slow velocity
                vy: (Math.random() - 0.5) * 0.5,
                radius: 16
            };
        }
    });
}

function runAI() {
    const ai = gameState.ai;
    const player = gameState.player;

    // RULE 1: Attack with a ZDE if possible
    if (ai.zdes.length > 0 && Object.keys(player.servers).length > 0) {
        // Find a player category with SaaS servers to attack
        const targetableCategories = gameState.saasCategories.filter(cat => player.servers[cat]?.saas.servers.length > 0);
        if (targetableCategories.length > 0) {
            ai.zdes.pop(); // Use one ZDE
            const targetCategory = targetableCategories[Math.floor(Math.random() * targetableCategories.length)];
            const playerSaasServers = player.servers[targetCategory].saas.servers;

            // Find a cluster to breach
            const clustersInProduct = [...new Set(playerSaasServers.map(s => s.cluster))];
            if (clustersInProduct.length > 0) {
                const clusterToBreach = clustersInProduct[Math.floor(Math.random() * clustersInProduct.length)];

                if (!player.breachedClusters) {
                    player.breachedClusters = {};
                }
                player.breachedClusters[clusterToBreach] = true;

                logMessage(`!!! AI ATTACK: ${ai.name} breached your ${targetCategory} product in Cluster ${clusterToBreach}!`);
                return; // End turn after a major action
            }
        }
    }

    // RULE 2: Decide what server to buy, and buy it if affordable
    const allocate = (category, type, count) => {
        const target = category ? `${category} ${type}` : `general ${type}`;
        logMessage(`AI (${ai.name}) allocated ${count} servers to ${target}.`);

        if (type === 'saas') {
            ai.products[category].saas.serverCount += count;
        } else if (type === 'research') {
            if (category) {
                ai.products[category].research.serverCount += count;
            } else {
                ai.research.serverCount += count;
            }
        } else if (type === 'dev') {
            ai.products[category].dev.serverCount += count;
        }
    };

    const choice = Math.random();
    const randomCategory = gameState.saasCategories[Math.floor(Math.random() * gameState.saasCategories.length)];

    if (choice < 0.4) { // 40% chance to build SaaS
        if (ai.money >= AI_SAAS_COST * 2) { // Keep a cash buffer
            ai.money -= AI_SAAS_COST;
            allocate(randomCategory, 'saas', 1);
        }
    } else if (choice < 0.7) { // 30% chance to build Research
        if (ai.money >= AI_RESEARCH_COST * 2) {
            ai.money -= AI_RESEARCH_COST;
            if (Math.random() < 0.5) {
                allocate(randomCategory, 'research', 1);
            } else {
                allocate(null, 'research', 1); // General research
            }
        }
    } else { // 30% chance to build Development
        if (ai.money >= AI_DEV_COST * 2) {
            ai.money -= AI_DEV_COST;
            allocate(randomCategory, 'dev', 1);
        }
    }
}

function calculateEfficacy(serverCount, efficiency, ageInMonths) {
    if (serverCount === 0) {
        return 0;
    }
    const ageFactor = 1 + (ageInMonths / 12);
    const efficacy = (serverCount * efficiency) * (1 / ageFactor);
    return efficacy;
}

function gameTick() {
    gameState.tick++;

    // 0. Age all SaaS products
    gameState.saasCategories.forEach(cat => {
        // Player products
        const playerSaas = gameState.player.servers[cat]?.saas;
        if (playerSaas && playerSaas.servers.length > 0) {
            playerSaas.ageInMonths++;
        }
        // AI products
        const aiSaas = gameState.ai.products[cat]?.saas;
        if (aiSaas && aiSaas.serverCount > 0) {
            aiSaas.ageInMonths++;
        }
    });

    // 1. Process Development
    gameState.saasCategories.forEach(cat => {
        // Player
        const playerDevCount = gameState.player.servers[cat]?.dev.servers.length || 0;
        if (playerDevCount > 0) {
            let currentEff = gameState.player.servers[cat].saas.efficiency;
            currentEff += playerDevCount * 0.005; // Small boost per server
            gameState.player.servers[cat].saas.efficiency = Math.min(2.0, currentEff); // Cap at 200%
        }

        // AI
        const aiDevCount = gameState.ai.products[cat]?.dev.serverCount || 0;
        if (aiDevCount > 0) {
            let currentEff = gameState.ai.products[cat].saas.efficiency;
            currentEff += aiDevCount * 0.005;
            gameState.ai.products[cat].saas.efficiency = Math.min(2.0, currentEff);
        }
    });

    // 2. Market Share & Revenue Calculation
    let totalPlayerGrossRevenue = 0;
    let totalAiGrossRevenue = 0;

    gameState.saasCategories.forEach(cat => {
        const market = gameState.market[cat];
        const playerSaas = gameState.player.servers[cat].saas;
        const aiSaas = gameState.ai.products[cat].saas;

        // Calculate efficacy for each entity in the category
        const playerEfficacy = calculateEfficacy(playerSaas.servers.length, playerSaas.efficiency, playerSaas.ageInMonths);
        const aiEfficacy = calculateEfficacy(aiSaas.serverCount, aiSaas.efficiency, aiSaas.ageInMonths);
        const totalEfficacy = playerEfficacy + aiEfficacy;

        // Calculate market share
        if (totalEfficacy > 0) {
            market.playerShare = playerEfficacy / totalEfficacy;
            market.aiShare = aiEfficacy / totalEfficacy;
        } else {
            market.playerShare = 0;
            market.aiShare = 0;
        }

        // Calculate gross revenue for this category
        const categoryTam = market.tam;
        let playerGrossRevenueForCategory = market.playerShare * categoryTam;
        let aiGrossRevenueForCategory = market.aiShare * categoryTam;

        // --- Breach Impact ---
        // Player
        const totalPlayerServers = playerSaas.servers.length;
        if (totalPlayerServers > 0) {
            const breachedServers = playerSaas.servers.filter(s => gameState.player.breachedClusters[s.cluster]).length;
            if (breachedServers > 0) {
                const revenueLoss = playerGrossRevenueForCategory * (breachedServers / totalPlayerServers);
                playerGrossRevenueForCategory -= revenueLoss;
            }
        }
        // AI
        if (aiSaas.serverCount > 0 && aiSaas.breachedServerPercentage > 0) {
            const revenueLoss = aiGrossRevenueForCategory * aiSaas.breachedServerPercentage;
            aiGrossRevenueForCategory -= revenueLoss;
        }

        totalPlayerGrossRevenue += playerGrossRevenueForCategory;
        totalAiGrossRevenue += aiGrossRevenueForCategory;
    });

    // 3. Calculate Net Revenue
    const playerOpex = getTotalServers(gameState.player, 'player') * SERVER_OPEX;
    const aiOpex = getTotalServers(gameState.ai, 'ai') * SERVER_OPEX;
    gameState.player.lastTickNetRevenue = totalPlayerGrossRevenue - playerOpex + PASSIVE_INCOME;
    gameState.ai.lastTickNetRevenue = totalAiGrossRevenue - aiOpex + PASSIVE_INCOME;

    gameState.player.money += gameState.player.lastTickNetRevenue;
    gameState.ai.money += gameState.ai.lastTickNetRevenue;


    // 4. Record cash history
    if (gameState.history && gameState.history.cash) {
        gameState.history.cash.push({
            tick: gameState.tick,
            player: gameState.player.money,
            ai: gameState.ai.money
        });
        // Keep history from getting too large
        if (gameState.history.cash.length > 50) {
            gameState.history.cash.shift();
        }
    }


    // 5. ZDE Discovery
    const playerResearchTotal = getTotalResearchServers(gameState.player, 'player');
    for (let i = 0; i < playerResearchTotal; i++) {
        if (Math.random() < ZDE_DISCOVERY_CHANCE) {
            const newZde = {
                id: `zde-${Date.now()}-${Math.random()}`,
                name: generateZdeName()
            };
            gameState.player.zdes.push(newZde);
            logMessage(`Player discovered a Zero-Day Exploit: ${newZde.name}!`);
        }
    }
    const aiResearchTotal = getTotalResearchServers(gameState.ai, 'ai');
    for (let i = 0; i < aiResearchTotal; i++) {
        if (Math.random() < ZDE_DISCOVERY_CHANCE) {
            const newZde = {
                id: `zde-ai-${Date.now()}-${Math.random()}`,
                name: generateZdeName()
            };
            gameState.ai.zdes.push(newZde);
            logMessage(`AI (${gameState.ai.name}) discovered a Zero-Day Exploit!`);
        }
    }

    // 6. AI Turn
    runAI();

    // 7. Update UI
    updateUI();
}

function initGame() {
    if (gameLoopInterval) clearInterval(gameLoopInterval);

    const selectedCategories = ALL_SAAS_CATEGORIES.sort(() => 0.5 - Math.random()).slice(0, 6);

    const playerServers = {};
    const aiProducts = {}; // New AI structure
    selectedCategories.forEach(cat => {
        playerServers[cat] = {
            // Each role is an object containing a list of servers
            saas: { efficiency: 1.0, ageInMonths: 0, servers: [] },
            research: { servers: [] },
            dev: { servers: [] }
        };
        // AI has a similar product structure, but with counts instead of server lists
        aiProducts[cat] = {
            saas: { efficiency: 1.0, ageInMonths: 0, serverCount: 0, breachedServerPercentage: 0 },
            research: { serverCount: 0 },
            dev: { serverCount: 0 }
        };
    });

    // Add initial player servers to the new structure
    playerServers[selectedCategories[0]].saas.servers.push({type: 'saas', id: 'p-s-1', immune: true, cluster: 'A'});
    playerServers[selectedCategories[0]].saas.servers.push({type: 'saas', id: 'p-s-2', vulnerable: true, cluster: 'A'});
    playerServers[selectedCategories[0]].saas.ageInMonths = 3; // Example age
    playerServers[selectedCategories[0]].saas.efficiency = 1.1; // Example efficiency

    playerServers[selectedCategories[1]].saas.servers.push({type: 'saas', id: 'p-s-3', silent: true, cluster: 'B'});
    playerServers[selectedCategories[2]].research.servers.push({type: 'research', id: 'p-r-1', immune: false, cluster: 'C'});
    playerServers[selectedCategories[3]].dev.servers.push({type: 'dev', id: 'p-d-1', immune: false, cluster: 'D'});

    // Add initial AI servers
    aiProducts[selectedCategories[1]].saas.serverCount = 3;
    aiProducts[selectedCategories[1]].saas.ageInMonths = 5;
    aiProducts[selectedCategories[1]].saas.efficiency = 0.9;

    const initialAiResearch = { serverCount: 1 }; // General research servers for AI

    gameState = {
        saasCategories: selectedCategories,
        player: { money: 10000, servers: playerServers, zdes: [], breachedClusters: {}, lastTickNetRevenue: 0 },
        ai: { money: 10000, products: aiProducts, research: initialAiResearch, zdes: [], name: generateSyndicateName(), lastTickNetRevenue: 0 },
        tick: 0,
        market: {},
        history: {
            cash: [], // Stores {tick: X, player: Y, ai: Z}
        },
    };

    // Initialize market data, now including TAM
    gameState.saasCategories.forEach(cat => {
        gameState.market[cat] = {
            tam: SAAS_CATEGORY_DATA[cat].tam,
            player: 0,
            ai: 0,
            total: 0,
            playerShare: 0,
            aiShare: 0,
            // These two are deprecated by the new product-specific efficiency model
            playerEfficiency: 1.0,
            aiEfficiency: 1.0,
        };
    });

    logMessage(`New game started. Welcome to ZeroDay Syndicate. Your first opponent is ${gameState.ai.name}.`);

    updateUI();
    gameLoopInterval = setInterval(gameTick, TICK_INTERVAL);
}

function logMessage(message) {
    E.log.value = `[Tick ${gameState.tick}] ${message}\n` + E.log.value;
}

/* ---------- PERSISTENCE ---------- */
const SAVE_KEY = 'zeroDaySyndicateSave';

function saveGame() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
        logMessage("Game state saved.");
        alert("Game Saved!");
    } catch (e) {
        console.error("Could not save game", e);
        alert("Error: Could not save game.");
    }
}

function loadGame() {
    try {
        const savedState = localStorage.getItem(SAVE_KEY);
        if (savedState) {
            if (gameLoopInterval) clearInterval(gameLoopInterval);
            gameState = JSON.parse(savedState);

            if (!gameState.saasCategories) {
                gameState.saasCategories = ALL_SAAS_CATEGORIES.sort(() => 0.5 - Math.random()).slice(0, 6);
            }

            logMessage("Game state loaded from save.");
            updateUI();
            gameLoopInterval = setInterval(gameTick, TICK_INTERVAL);
            alert("Game Loaded!");
        } else {
            alert("No save file found. Starting a new game.");
            initGame();
        }
    } catch (e) {
        console.error("Could not load game", e);
        alert("Error: Could not load saved data. Starting new game.");
        initGame();
    }
}


/* ---------- EVENT LISTENERS ---------- */
E.buttons.save.addEventListener('click', saveGame);
E.buttons.load.addEventListener('click', loadGame);
E.buttons.help.addEventListener('click', () => { E.helpModal.style.display = 'flex'; });
E.buttons.helpClose.addEventListener('click', () => { E.helpModal.style.display = 'none'; });
E.helpModal.addEventListener('click', (e) => { if(e.target === E.helpModal) E.helpModal.style.display = 'none'; });

document.querySelectorAll('.btn-collapse').forEach(button => {
    button.addEventListener('click', (e) => {
        const targetId = e.currentTarget.dataset.target;
        const chartTile = document.getElementById(targetId);
        if (chartTile) {
            const isCollapsed = chartTile.classList.toggle('is-collapsed');
            e.currentTarget.textContent = isCollapsed ? '+' : '-';
            // Disable interactjs resizing when collapsed
            if (interact.isSet(chartTile)) {
                interact(chartTile).resizable({
                    enabled: !isCollapsed
                });
            }
        }
    });
});


/* ---------- DRAG & DROP LOGIC ---------- */
// Helper function to create a data URL for the cursor
function getCursorUrl(target) {
    let svgString = '';
    const size = 32; // The size of our cursor icon

    let dragType = '';
    if (target.matches('.server-draggable') || target.matches('.server-hex-group')) {
        dragType = 'server';
    } else if (target.matches('.zde-item')) {
        dragType = 'zde';
    }

    switch(dragType) {
        case 'server': {
            let color = 'grey'; // fallback
            if (target.matches('.server-draggable')) {
                 const computedStyle = window.getComputedStyle(target);
                 color = computedStyle.backgroundColor;
            } else { // server-hex-group
                const polygon = target.querySelector('.hex');
                if (polygon) color = polygon.getAttribute('fill');
            }
            const hexShape = hexPoints(size/2, size/2, size/2 - 2); // -2 for a little padding
            svgString = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><polygon points="${hexShape}" fill="${color}" stroke="white" stroke-width="2" /></svg>`;
            break;
        }
        case 'zde': {
            // Recreate the ZDE triangle shape for the cursor
            const trianglePoints = `${size/2},${size*0.1} ${size*0.9},${size*0.9} ${size*0.1},${size*0.9}`;
            const originalPolygon = target.querySelector('polygon');
            const color = originalPolygon ? window.getComputedStyle(originalPolygon).fill : '#39FF14';
            svgString = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><polygon points="${trianglePoints}" fill="${color}" stroke="white" stroke-width="2" /></svg>`;
            break;
        }
    }

    if (svgString) {
        const encodedSvg = encodeURIComponent(svgString);
        // Center hotspot for the cursor
        return `url('data:image/svg+xml;utf8,${encodedSvg}') ${size/2} ${size/2}, auto`;
    }

    return 'grabbing'; // fallback cursor
}

const dragListeners = {
    start(event) {
        event.target.classList.add('is-dragging');
        document.body.style.cursor = getCursorUrl(event.target);
    },
    move(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    },
    end(event) {
        event.target.style.transform = 'translate(0px, 0px)';
        event.target.setAttribute('data-x', 0);
        event.target.setAttribute('data-y', 0);
        event.target.classList.remove('is-dragging');
        document.body.style.cursor = 'default';
    }
};

function initDragAndDrop() {
    const onDropzoneEnter = ({ target }) => {
        target.classList.add('can-drop');
        const polygon = target.querySelector('polygon') || target;
        polygon.style.fill = 'rgba(0, 255, 255, 0.2)';
    }
    const onDropzoneLeave = ({ target }) => {
        target.classList.remove('can-drop');
        const polygon = target.querySelector('polygon') || target;
        polygon.style.fill = 'rgba(0, 255, 255, 0.05)';
    }

    interact('.server-draggable').draggable({ ...dragListeners });
    interact('.zde-item').draggable({ ...dragListeners });
    interact('.server-hex-group').draggable({ listeners: dragListeners });

    // Make chart tiles draggable and resizable
    interact('.chart-tile')
        .draggable({
            allowFrom: '.tile__head',
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ],
            listeners: {
                move: function (event) {
                    const target = event.target;
                    let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.style.transform = `translate(${x}px, ${y}px)`;

                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
            }
        })
        .resizable({
            edges: { top: true, left: true, bottom: true, right: true },
            listeners: {
                move: function (event) {
                    const target = event.target;
                    let x = (parseFloat(target.getAttribute('data-x')) || 0);
                    let y = (parseFloat(target.getAttribute('data-y')) || 0);

                    // update the element's style
                    target.style.width = event.rect.width + 'px';
                    target.style.height = event.rect.height + 'px';

                    // translate when resizing from top or left edges
                    x += event.deltaRect.left;
                    y += event.deltaRect.top;

                    target.style.transform = 'translate(' + x + 'px,' + y + 'px)';

                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);

                    // Resize charts on container resize
                    if(cashChart) cashChart.resize();
                    if(marketChart) marketChart.resize();
                }
            },
            modifiers: [
                interact.modifiers.restrictSize({
                    min: { width: 250, height: 150 }
                })
            ],
            inertia: true
        });


    const zdeDropzoneOptions = {
        ondragenter: onDropzoneEnter,
        ondragleave: onDropzoneLeave,
        ondrop: function (event) {
            const draggable = event.relatedTarget;
            const dropzone = event.target;
            const zdeId = draggable.dataset.id;
            const action = dropzone.dataset.action;

            const zdeIndex = gameState.player.zdes.findIndex(z => z.id === zdeId);
            if (zdeIndex === -1) return;

            const zde = gameState.player.zdes[zdeIndex];
            gameState.player.zdes.splice(zdeIndex, 1);

            if (action === 'steal') {
                const damage = Math.min(ZDE_ATTACK_POWER, gameState.ai.money);
                gameState.ai.money -= damage;
                gameState.player.money += damage;
                logMessage(`Attack successful with ${zde.name}! You stole $${Math.floor(damage)} from ${gameState.ai.name}.`);
            } else if (action === 'sabotage') {
                const targetableCategories = gameState.saasCategories.filter(cat => gameState.ai.products[cat]?.saas.serverCount > 0);
                if (targetableCategories.length > 0) {
                    const targetCategory = targetableCategories[Math.floor(Math.random() * targetableCategories.length)];

                    // New breach logic: assume 25% of servers are in the breached "cluster"
                    const breachPercentage = 0.25;
                    gameState.ai.products[targetCategory].saas.breachedServerPercentage = breachPercentage;

                    logMessage(`Sabotage successful with ${zde.name}! ${gameState.ai.name}'s ${targetCategory} product is breached, causing ${breachPercentage*100}% revenue loss.`);
                } else {
                    logMessage(`Sabotage with ${zde.name} failed. No active AI SaaS products to target.`);
                }
            }

            updateUI();
            dropzone.classList.remove('can-drop');
        }
    };

    interact('#ai-dropzone-steal').dropzone(zdeDropzoneOptions);
    interact('#ai-dropzone-sabotage').dropzone(zdeDropzoneOptions);

    const serverDropzoneOptions = {
        accept: '.server-draggable, .server-hex-group',
        ondragenter: onDropzoneEnter,
        ondragleave: onDropzoneLeave,
        ondrop: function (event) {
            const draggable = event.relatedTarget;
            const dropzone = event.target;
            const newCategory = dropzone.dataset.category;

            // Case 1: Buying a new server from the market
            if (draggable.matches('.server-draggable')) {
                const type = draggable.dataset.type;
                const cost = parseInt(draggable.dataset.cost, 10);

                if (!newCategory || !type) return;

                if (gameState.player.money >= cost) {
                    gameState.player.money -= cost;
                    const newServer = {
                        id: `p-${type.slice(0,1)}-${Date.now()}`,
                        type: type,
                        immune: false,
                        vulnerable: false,
                        silent: false,
                        cluster: 'A' // default cluster
                    }
                    gameState.player.servers[newCategory][type].servers.push(newServer);
                    logMessage(`Purchased ${type} server for ${newCategory} for $${cost}.`);
                    updateUI();
                } else {
                    alert(`Not enough funds. A ${type} server costs $${cost}.`);
                }
            }
            // Case 2: Moving an existing server
            else if (draggable.matches('.server-hex-group')) {
                const serverInfo = JSON.parse(draggable.dataset.serverInfo);
                const oldCategory = draggable.dataset.sourceCategory;

                if (oldCategory === newCategory) return; // No change

                const serverList = gameState.player.servers[oldCategory][serverInfo.type].servers;
                const serverIndex = serverList.findIndex(s => s.id === serverInfo.id);

                if (serverIndex > -1) {
                    const [serverToMove] = serverList.splice(serverIndex, 1);
                    gameState.player.servers[newCategory][serverInfo.type].servers.push(serverToMove);
                    logMessage(`Moved ${serverInfo.type} server from ${oldCategory} to ${newCategory}.`);
                    updateUI();
                }
            }

            dropzone.classList.remove('can-drop');
            const polygon = dropzone.querySelector('polygon') || dropzone;
            polygon.style.fill = 'rgba(0, 255, 255, 0.05)';
        }
    };

    setTimeout(() => {
        if (gameState.saasCategories) {
            gameState.saasCategories.forEach((cat, i) => {
                const hexId = `#category-hex-${i}`;
                interact(hexId).dropzone(serverDropzoneOptions);
            });
        }
    }, 100);
}

function initCharts() {
    // Wait a moment for the DOM to be ready
    setTimeout(() => {
        const cashCtx = document.getElementById('cash-chart')?.getContext('2d');
        const marketCtx = document.getElementById('market-chart')?.getContext('2d');

        if (!cashCtx || !marketCtx) {
            console.error("Chart canvas elements not found!");
            return;
        }

        const chartFont = {
            family: "'Roboto Mono', monospace",
        };

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'var(--txt)', font: chartFont }
                }
            },
            scales: {
                y: {
                    ticks: { color: 'var(--txt)', font: chartFont },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: 'var(--txt)', font: chartFont },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        };

        cashChart = new Chart(cashCtx, {
            type: 'line',
            data: {
                labels: [], // Ticks
                datasets: [
                    {
                        label: 'Player Cash',
                        data: [],
                        borderColor: 'var(--cy)',
                        backgroundColor: 'rgba(0, 255, 255, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'AI Cash',
                        data: [],
                        borderColor: 'var(--rd)',
                        backgroundColor: 'rgba(255, 51, 102, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: commonOptions
        });

        marketChart = new Chart(marketCtx, {
            type: 'bar',
            data: {
                labels: [], // Categories
                datasets: [
                    {
                        label: 'Player',
                        data: [],
                        backgroundColor: 'var(--cy)',
                    },
                    {
                        label: 'AI',
                        data: [],
                        backgroundColor: 'var(--rd)',
                    }
                ]
            },
            options: {
                ...commonOptions,
                indexAxis: 'y',
                scales: {
                    x: {
                        stacked: true,
                        max: 1,
                        ticks: { color: 'var(--txt)', font: chartFont, callback: value => (value * 100) + '%' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        stacked: true,
                        ticks: { color: 'var(--txt)', font: chartFont },
                        grid: { display: false }
                    }
                },
                plugins: {
                     legend: {
                        position: 'top',
                        labels: { color: 'var(--txt)', font: chartFont }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.x !== null) {
                                    label += (context.parsed.x * 100).toFixed(0) + '%';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }, 100);
}

function animateZDEs() {
    const container = document.getElementById('zde-display');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const states = Object.values(zdeAnimationState);

    states.forEach(state => {
        if (!state.el || !state.el.parentElement) {
            // Element has been removed, skip
            return;
        }

        // Update position
        state.x += state.vx;
        state.y += state.vy;

        // Wall collision
        if (state.x <= 0 || state.x >= containerRect.width - state.radius * 2) {
            state.vx *= -1;
            state.x = Math.max(0, Math.min(state.x, containerRect.width - state.radius * 2));
        }
        if (state.y <= 0 || state.y >= containerRect.height - state.radius * 2) {
            state.vy *= -1;
            state.y = Math.max(0, Math.min(state.y, containerRect.height - state.radius * 2));
        }

        // Apply transform
        state.el.style.transform = `translate(${state.x}px, ${state.y}px)`;
    });

    // Collision between ZDEs
    for (let i = 0; i < states.length; i++) {
        for (let j = i + 1; j < states.length; j++) {
            const stateA = states[i];
            const stateB = states[j];

            const dx = stateB.x - stateA.x;
            const dy = stateB.y - stateA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = stateA.radius + stateB.radius;

            if (distance < minDistance) {
                // Simple collision response: push them apart
                const overlap = minDistance - distance;
                const angle = Math.atan2(dy, dx);
                const pushX = (overlap / 2) * Math.cos(angle);
                const pushY = (overlap / 2) * Math.sin(angle);

                stateA.x -= pushX;
                stateA.y -= pushY;
                stateB.x += pushX;
                stateB.y += pushY;

                // Also swap velocities for a more "bouncy" feel
                const tempVx = stateA.vx;
                const tempVy = stateA.vy;
                stateA.vx = stateB.vx;
                stateA.vy = stateB.vy;
                stateB.vx = tempVx;
                stateB.vy = tempVy;
            }
        }
    }

    requestAnimationFrame(animateZDEs);
}

// Initialize the game
initGame();
initCharts();
initDragAndDrop();
requestAnimationFrame(animateZDEs);
