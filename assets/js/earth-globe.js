(function () {
  const container = document.getElementById("globe-container");
  if (!container) return;

  // 1. Initialize Globe
  const myGlobe = Globe()(container)
    .backgroundColor("rgba(0, 0, 0, 0)") // Transparent to overlay on the background canvas
    .globeMaterial(new THREE.MeshStandardMaterial({
      color: "#050e21", // Dark obsidian blue for oceans
      roughness: 0.65,
      metalness: 0.15
    }))
    .showAtmosphere(true)
    .atmosphereColor("#00a6ff") // Cyber neon blue atmosphere glow
    .atmosphereAltitude(0.18)
    .width(container.clientWidth)
    .height(container.clientHeight);

  // 2. Load country borders GeoJSON for outlines
  if (window.worldCountriesGeoJSON) {
    myGlobe
      .polygonsData(window.worldCountriesGeoJSON.features)
      .polygonCapColor(() => "rgba(10, 25, 50, 0.25)") // Semi-transparent deep blue land fill
      .polygonStrokeColor(() => "#00a6ff") // Cyan neon outline
      .polygonAltitude(0.01)
      .polygonSideColor(() => "rgba(0, 166, 255, 0.08)");
  } else {
    // Fallback if local variable is not found
    fetch("https://unpkg.com/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson")
      .then(res => res.json())
      .then(countries => {
        myGlobe
          .polygonsData(countries.features)
          .polygonCapColor(() => "rgba(10, 25, 50, 0.25)")
          .polygonStrokeColor(() => "#00a6ff")
          .polygonAltitude(0.01)
          .polygonSideColor(() => "rgba(0, 166, 255, 0.08)");
      })
      .catch(err => console.error("Error loading country GeoJSON:", err));
  }

  // 3. Obtain ThreeJS Scene references
  const scene = myGlobe.scene();

  // 4. Draw latitude & longitude faint grid (Graticules)
  const gridGeom = new THREE.SphereGeometry(100.2, 30, 30);
  const gridMat = new THREE.MeshBasicMaterial({
    color: "#00a6ff",
    wireframe: true,
    transparent: true,
    opacity: 0.05 // Faint neon web coordinate grid
  });
  const gridMesh = new THREE.Mesh(gridGeom, gridMat);
  scene.add(gridMesh);

  // 5. Add custom orbit ring & satellite
  const orbitRadius = 138;
  const orbitPoints = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius));
  }
  const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMat = new THREE.LineBasicMaterial({
    color: "#ff9f0a", // Copper-orange orbit track
    transparent: true,
    opacity: 0.15
  });
  const orbitLine = new THREE.Line(orbitGeom, orbitMat);
  // Tilt the orbit
  orbitLine.rotation.x = Math.PI / 6;
  orbitLine.rotation.z = Math.PI / 8;
  scene.add(orbitLine);

  // Add the satellite
  const satGeom = new THREE.SphereGeometry(1.6, 12, 12);
  const satMat = new THREE.MeshBasicMaterial({
    color: "#ff9f0a",
    transparent: false
  });
  const satMesh = new THREE.Mesh(satGeom, satMat);
  scene.add(satMesh);

  // Dynamic light source attached to the satellite mapping glowing patterns on the globe
  const satLight = new THREE.PointLight("#ff9f0a", 0.9, 60);
  satMesh.add(satLight);

  // Animate the satellite along its orbit
  let satAngle = 0;
  function animateSatellite() {
    satAngle += 0.012;
    const rawX = Math.cos(satAngle) * orbitRadius;
    const rawZ = Math.sin(satAngle) * orbitRadius;

    // Apply rotation transforms corresponding to the orbit track angle
    const pos = new THREE.Vector3(rawX, 0, rawZ);
    pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 6);
    pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 8);

    satMesh.position.copy(pos);
    requestAnimationFrame(animateSatellite);
  }
  animateSatellite();

  // 6. Define telemetry connection arcs (Network routes)
  const arcsData = [
    { startLat: 12.9716, startLng: 77.5946, endLat: -25.7479, endLng: 28.2293, color: "#ff9f0a" }, // Bengaluru -> South Africa (Orange)
    { startLat: 12.9716, startLng: 77.5946, endLat: 35.6762, endLng: 139.6503, color: "#00f2fe" }, // Bengaluru -> Tokyo (Cyan)
    { startLat: 12.9716, startLng: 77.5946, endLat: 25.0763, endLng: 54.8978, color: "#ff9f0a" }, // Bengaluru -> Dubai (Orange)
    { startLat: 12.9716, startLng: 77.5946, endLat: 46.8182, endLng: 8.2275, color: "#7c3aed" }, // Bengaluru -> Switzerland (Purple)
    { startLat: 12.9716, startLng: 77.5946, endLat: 71.7069, endLng: -42.6043, color: "#ff007f" }, // Bengaluru -> Greenland (Pink)
    { startLat: -25.2744, startLng: 133.7751, endLat: 12.9716, endLng: 77.5946, color: "#00f2fe" }  // Australia -> Bengaluru (Cyan)
  ];

  myGlobe
    .arcsData(arcsData)
    .arcColor(d => d.color)
    .arcAltitude(d => {
      // Offset altitudes to prevent overlaps of coincident lines
      if (d.endLat === -25.7479) return 0.20; // South Africa
      if (d.endLat === 35.6762) return 0.26; // Tokyo
      if (d.endLat === 25.0763) return 0.12; // Dubai
      if (d.endLat === 46.8182) return 0.15; // Switzerland
      return 0.24;
    })
    .arcDashLength(0.4)
    .arcDashGap(0.15)
    .arcDashAnimateTime(1600 + Math.random() * 1000)
    .arcStroke(1.2);

  // 7. Define HTML Elements data (Visual flags)
  const markersData = [
    { lat: 12.9716, lng: 77.5946, name: "Bengaluru", color: "#ff9f0a" },
    { lat: 25.0763, lng: 54.8978, name: "Dubai", color: "#ff9f0a" },
    { lat: 46.8182, lng: 8.2275, name: "Switzerland", color: "#cbd5e1" },
    { lat: -25.7479, lng: 28.2293, name: "South Africa", color: "#00f2fe" },
    { lat: 35.6762, lng: 139.6503, name: "Tokyo", color: "#00f2fe" },
    { lat: 71.7069, lng: -42.6043, name: "Greenland", color: "#7c3aed" },
    { lat: -25.2744, lng: 133.7751, name: "Australia", color: "#ff007f" }
  ];

  myGlobe
    .htmlElementsData(markersData)
    .htmlElement(d => {
      const el = document.createElement("div");
      el.innerHTML = `
        <div class="globe-marker">
          <div class="marker-shaft" style="background: linear-gradient(to top, transparent, ${d.color});"></div>
          <div class="marker-label" style="border-color: ${d.color}; box-shadow: 0 0 10px ${d.color}33;">
            <span style="color: ${d.color}; margin-right: 4px;">●</span>${d.name}
          </div>
          <div class="marker-pulse" style="background-color: ${d.color}; box-shadow: 0 0 8px ${d.color};"></div>
        </div>
      `;
      return el;
    });

  // 8. Configure Controls
  const controls = myGlobe.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5; // Smooth slow rotation
  controls.enableZoom = false; // Disable scroll zoom to prevent scroll hijacking

  // Align camera viewport to focus on Bengaluru / Indian subcontinent center
  myGlobe.pointOfView({ lat: 18, lng: 79, altitude: 2.15 });


  // Handle Resize
  window.addEventListener("resize", () => {
    myGlobe.width(container.clientWidth);
    myGlobe.height(container.clientHeight);
  });
})();
