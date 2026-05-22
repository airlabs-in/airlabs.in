(function () {
  const canvas = document.getElementById("bg-pi-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  let mouse = { x: null, y: null, active: false, radius: 250 };
  let time = 0;

  // Camera settings for crisp 3D Perspective Projection
  const fov = 400;

  // Space coordinates array
  const nodes = [];
  const numNodes = 125; // Balanced for pixel-perfect density
  const maxConnections = 3;
  const connectionDistance = 280; // Spatial 3D distance threshold

  const sparks = [];
  const maxSparks = 45; // Performance limit for active sparks

  // Holographic 3D dot-grid coordinate plane coordinates
  const gridPoints = [];
  const gridRange = 700;
  const gridStep = 100;

  // Build a crisp 3D double-grid coordinate lattice
  for (let x = -gridRange / 2; x <= gridRange / 2; x += gridStep) {
    for (let z = -gridRange / 2; z <= gridRange / 2; z += gridStep) {
      gridPoints.push({ x: x, y: 230, z: z });  // Floor grid
      gridPoints.push({ x: x, y: -230, z: z }); // Ceiling grid
    }
  }

  // Node class with crisp microscopic types and zero-blur physics
  class Node {
    constructor(id) {
      this.id = id;
      
      // Position nodes in a 3D volume space
      this.x = (Math.random() - 0.5) * 600;
      this.y = (Math.random() - 0.5) * 450;
      this.z = (Math.random() - 0.5) * 500;

      this.ox = this.x;
      this.oy = this.y;
      this.oz = this.z;

      this.vx = 0;
      this.vy = 0;
      this.vz = 0;

      // Microscopic HUD shape types: 
      // 0: microscopic dot, 1: micro-square pixel, 2: vector plus crosshair
      this.type = Math.floor(Math.random() * 3);

      this.projX = 0;
      this.projY = 0;
      this.projScale = 0;
      this.zProjected = 0;

      this.excited = false;
      this.sparkTimer = Math.random() * 100;
      this.neighbors = [];
      this.baseSize = 1.0 + Math.random() * 1.4;
    }

    update(centerX, centerY, globalTime) {
      // Crisp spring return forces
      const springStrength = 0.012;
      const damping = 0.88;

      const ax = (this.ox - this.x) * springStrength;
      const ay = (this.oy - this.y) * springStrength;
      const az = (this.oz - this.z) * springStrength;

      this.vx = (this.vx + ax) * damping;
      this.vy = (this.vy + ay) * damping;
      this.vz = (this.vz + az) * damping;

      this.x += this.vx;
      this.y += this.vy;
      this.z += this.vz;

      // Slow orbital Y and X axes rotations
      const rotY = 0.00008 * globalTime;
      const rotX = 0.00004 * globalTime;

      // Y-axis orbit
      let x1 = this.x * Math.cos(rotY) - this.z * Math.sin(rotY);
      let z1 = this.z * Math.cos(rotY) + this.x * Math.sin(rotY);

      // X-axis orbit
      let y2 = this.y * Math.cos(rotX) - z1 * Math.sin(rotX);
      let z2 = z1 * Math.cos(rotX) + this.y * Math.sin(rotX);

      this.zProjected = z2;

      // Perspective scale factor
      this.projScale = fov / (fov + this.zProjected);
      this.projX = centerX + x1 * this.projScale;
      this.projY = centerY + y2 * this.projScale;

      this.excited = false;

      // Mouse interactive vector nudges
      if (mouse.active) {
        const dx = mouse.x - this.projX;
        const dy = mouse.y - this.projY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.excited = true;

          // Gentle spring attraction vector
          this.vx += (dx / dist) * force * 2.2 * this.projScale;
          this.vy += (dy / dist) * force * 2.2 * this.projScale;

          // Quicken spark spawns when cursor is hovering
          this.sparkTimer += 2.2;
          if (this.sparkTimer > 50) {
            this.sparkTimer = 0;
            this.fireSpark();
          }
        }
      }

      // Organic periodic spark flow triggers
      this.sparkTimer += 0.16;
      if (this.sparkTimer > 100) {
        this.sparkTimer = 0;
        this.fireSpark();
      }
    }

    fireSpark() {
      if (this.neighbors.length === 0 || sparks.length >= maxSparks) return;

      const target = this.neighbors[Math.floor(Math.random() * this.neighbors.length)];

      // Prevent overlapping duplicate spark packets on the same line
      const activeSparks = sparks.filter(s => s.fromNode === this && s.toNode === target);
      if (activeSparks.length === 0) {
        sparks.push(new Spark(this, target));
      }
    }

    draw(hue) {
      if (this.zProjected < -fov) return;

      const size = Math.max(0.6, this.baseSize * this.projScale);
      const alpha = Math.min(1.0, this.projScale) * (this.excited ? 0.95 : 0.65);

      const color = `hsla(${hue}, 90%, 65%, ${alpha})`;

      // Render micro elements based on type with zero-glow vector styles
      if (this.type === 0) {
        // 1. Pixel-Perfect Microscopic Dot (no radial glows, sharp edges)
        ctx.beginPath();
        ctx.arc(this.projX, this.projY, size * 1.25, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      } else if (this.type === 1) {
        // 2. Micro-Square Pixel
        const side = Math.round(size * 2);
        ctx.fillStyle = color;
        ctx.fillRect(this.projX - side / 2, this.projY - side / 2, side, side);
      } else {
        // 3. Vector Crosshair Plus Marker (+)
        const len = Math.max(2.2, size * 2.8);
        ctx.beginPath();
        ctx.moveTo(this.projX - len, this.projY);
        ctx.lineTo(this.projX + len, this.projY);
        ctx.moveTo(this.projX, this.projY - len);
        ctx.lineTo(this.projX, this.projY + len);
        ctx.lineWidth = 0.55;
        ctx.strokeStyle = color;
        ctx.stroke();
      }

      // Draw a tiny solid white square core if highly excited
      if (this.excited && this.projScale > 0.45) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.projX - 1, this.projY - 1, 2, 2);
      }
    }
  }

  // Active Spark packet traversing mesh lines without outer glows
  class Spark {
    constructor(fromNode, toNode) {
      this.fromNode = fromNode;
      this.toNode = toNode;
      this.progress = 0;
      this.speed = 0.015 + Math.random() * 0.02; // Randomized travel speed
    }

    update() {
      this.progress += this.speed;
      return this.progress < 1.0;
    }

    draw(hue) {
      // 3D Interpolated display coordinates
      const x = this.fromNode.projX + (this.toNode.projX - this.fromNode.projX) * this.progress;
      const y = this.fromNode.projY + (this.toNode.projY - this.fromNode.projY) * this.progress;
      const scale = this.fromNode.projScale + (this.toNode.projScale - this.fromNode.projScale) * this.progress;

      if (scale <= 0) return;

      const size = Math.max(1.0, 1.8 * scale);
      const alpha = Math.min(1.0, scale) * 0.95;

      // Solid pixel spark packet
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);

      // Ultra-thin vector trail (no blur halos)
      ctx.beginPath();
      ctx.moveTo(
        this.fromNode.projX + (this.toNode.projX - this.fromNode.projX) * Math.max(0, this.progress - 0.1),
        this.fromNode.projY + (this.toNode.projY - this.fromNode.projY) * Math.max(0, this.progress - 0.1)
      );
      ctx.lineTo(x, y);
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = `hsla(${hue}, 95%, 70%, ${alpha * 0.65})`;
      ctx.stroke();
    }
  }

  // Pre-compile bi-directional nearest-neighbors constellation graph
  function compileNeuralMesh() {
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      const distances = [];

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const nodeB = nodes[j];
        
        const dx = nodeA.ox - nodeB.ox;
        const dy = nodeA.oy - nodeB.oy;
        const dz = nodeA.oz - nodeB.oz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        distances.push({ node: nodeB, dist: dist });
      }

      distances.sort((a, b) => a.dist - b.dist);

      for (let k = 0; k < maxConnections; k++) {
        if (k < distances.length && distances[k].dist < connectionDistance) {
          const neighbor = distances[k].node;
          if (!nodeA.neighbors.includes(neighbor)) {
            nodeA.neighbors.push(neighbor);
          }
          if (!neighbor.neighbors.includes(nodeA)) {
            neighbor.neighbors.push(nodeA);
          }
        }
      }
    }
  }

  // Draw ultra-thin constellation connecting vector lines
  function drawConstellationLinks(hue) {
    ctx.lineWidth = 0.42;

    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      if (nodeA.zProjected < -fov) continue;

      for (let j = 0; j < nodeA.neighbors.length; j++) {
        const nodeB = nodeA.neighbors[j];
        if (nodeB.id < nodeA.id) continue;
        if (nodeB.zProjected < -fov) continue;

        const dx = nodeA.projX - nodeB.projX;
        const dy = nodeA.projY - nodeB.projY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 260) {
          const depthScale = Math.min(nodeA.projScale, nodeB.projScale);
          const alpha = (1 - dist / 260) * 0.16 * depthScale * (nodeA.excited || nodeB.excited ? 2.5 : 1.0);

          ctx.beginPath();
          ctx.moveTo(nodeA.projX, nodeA.projY);
          ctx.lineTo(nodeB.projX, nodeB.projY);
          ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${alpha})`;
          ctx.stroke();
        }
      }
    }
  }

  // Draw crisp 3D rotating holographic coordinate dot-grid
  function drawHolographicDotGrid(centerX, centerY, globalTime, hue) {
    const rotY = 0.00008 * globalTime;
    const rotX = 0.00004 * globalTime;

    // Translucent single pixels
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.09)`;

    for (let i = 0; i < gridPoints.length; i++) {
      const pt = gridPoints[i];

      // Coordinate systems rotation
      let x1 = pt.x * Math.cos(rotY) - pt.z * Math.sin(rotY);
      let z1 = pt.z * Math.cos(rotY) + pt.x * Math.sin(rotY);
      let y2 = pt.y * Math.cos(rotX) - z1 * Math.sin(rotX);
      let z2 = z1 * Math.cos(rotX) + pt.y * Math.sin(rotX);

      if (z2 < -fov) continue;

      const scale = fov / (fov + z2);
      
      const px = centerX + x1 * scale;
      const py = centerY + y2 * scale;

      // Viewport clip bounds
      if (px < 0 || px > width || py < 0 || py > height) continue;

      // Draw crisp microscopic grid coordinate dots
      ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
    }
  }

  // Draw interactive HUD targeting lines displaying telemetry distances
  function drawHUDTelemetry(centerX, centerY, hue) {
    if (!mouse.active) return;

    // Sort active nodes by proximity to cursor
    const distances = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.zProjected < -fov) continue;

      const dx = mouse.x - node.projX;
      const dy = mouse.y - node.projY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      distances.push({ node: node, dist: dist });
    }

    distances.sort((a, b) => a.dist - b.dist);

    const maxHUDTargets = 4;
    ctx.lineWidth = 0.45;
    ctx.font = '8px "Courier New", Courier, monospace';

    for (let i = 0; i < Math.min(maxHUDTargets, distances.length); i++) {
      const target = distances[i];
      const node = target.node;

      if (target.dist > mouse.radius) continue;

      const alpha = (1 - target.dist / mouse.radius) * 0.45;

      // 1. Draw crisp dashed HUD target lines
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(mouse.x, mouse.y);
      ctx.lineTo(node.projX, node.projY);
      ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${alpha})`;
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dashes

      // 2. Render microscopic HUD numeric data next to target line
      const normalizedDist = (target.dist / 1000).toFixed(4);
      const text = `TGT_${node.id} // R:${normalizedDist}`;

      const tx = mouse.x + (node.projX - mouse.x) * 0.5 + 4;
      const ty = mouse.y + (node.projY - mouse.y) * 0.5 - 4;

      ctx.fillStyle = `hsla(${hue}, 90%, 75%, ${alpha * 0.95})`;
      ctx.fillText(text, tx, ty);

      // 3. Draw a tiny solid targeting pixel box at the active node coordinates
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.fillRect(node.projX - 2, node.projY - 2, 4, 4);
    }
  }

  // Populate node instances
  for (let i = 0; i < numNodes; i++) {
    nodes.push(new Node(i));
  }

  // Compile network graph neighbors connections
  compileNeuralMesh();

  // Primary animation loop
  function animate(timestamp) {
    time = timestamp;

    // Clean brand color shifting (breathes between cyan ~190 and gold-copper ~35)
    const hueOscillation = Math.sin(timestamp * 0.00018);
    const baseHue = Math.round(112.5 + 77.5 * hueOscillation);

    // Cosmic deep space black background fill
    ctx.fillStyle = "#0c0e1b";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height * 0.46; // Balanced centering offset

    // 1. Render rotating 3D coordinate dot grid in the background
    drawHolographicDotGrid(centerX, centerY, timestamp, baseHue);

    // 2. Update position updates for all nodes
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].update(centerX, centerY, timestamp);
    }

    // 3. Draw ultra-thin constellation connecting threads
    drawConstellationLinks(baseHue);

    // 4. Update and render active sparks telemetry
    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      const active = spark.update();
      if (!active) {
        sparks.splice(i, 1);
      } else {
        spark.draw(baseHue);
      }
    }

    // 5. Draw interactive vector HUD target links
    drawHUDTelemetry(centerX, centerY, baseHue);

    // 6. Draw microscopic zero-blur nodes
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].draw(baseHue);
    }

    requestAnimationFrame(animate);
  }

  // Handle browser resizing
  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Target banner client listeners
  const banner = document.querySelector(".main-banner");
  if (banner) {
    banner.addEventListener("mousemove", (e) => {
      const rect = banner.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });

    banner.addEventListener("mouseleave", () => {
      mouse.active = false;
    });
  }

  // Trigger our premium, razor-sharp digital constellation HUD!
  requestAnimationFrame(animate);
})();
