(function(){
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05080a, 0.011);

  var camera = new THREE.PerspectiveCamera(68, window.innerWidth/window.innerHeight, 0.1, 400);
  var rig = new THREE.Object3D();
  rig.add(camera);
  scene.add(rig);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x05080a);
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x1a2414, 1.1));

  var CENTER = new THREE.Vector3(0, 0, -24);

  function orbitPosition(radius, inclination, angle){
    var x = radius * Math.cos(angle);
    var z0 = radius * Math.sin(angle);
    var y = -z0 * Math.sin(inclination);
    var z = z0 * Math.cos(inclination);
    return new THREE.Vector3(CENTER.x + x, CENTER.y + y, CENTER.z + z);
  }

  function makePlanetTexture(base, accent, bright){
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    var blotches = bright ? 60 : 34;
    for (var i = 0; i < blotches; i++){
      var x = Math.random()*256, y = Math.random()*256;
      var r = 8 + Math.random()*(bright ? 46 : 26);
      var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, accent);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.10 + Math.random()*0.16;
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  var particleCount = 1400;
  var pGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(particleCount * 3);
  var colors = new Float32Array(particleCount * 3);
  var palette = [ new THREE.Color(0x6fae2f), new THREE.Color(0xe0b23a), new THREE.Color(0x00c9c4) ];
  for (var i = 0; i < particleCount; i++) {
    var r = 30 + Math.random() * 140;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos((Math.random() * 2) - 1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.85;
    positions[i*3+2] = r * Math.cos(phi) - 24;
    var c = palette[Math.random() < 0.07 ? 2 : (Math.random() < 0.5 ? 0 : 1)];
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  var pMat = new THREE.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true });
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  var nodeDefs = [
    { name: "cyan falcon", sub: "venus \u00b7 home", pos: [0,0,-24], color: 0x00e5e0, baseHex:"#032a29", accentHex:"#5df5ef", isCenter:true, radius:2.4, bright:true, ring:true },
    { name: "the beats", sub: "player", orbit:{radius:22, inclination:0.15, angle:-0.9}, color:0x8fd23f, baseHex:"#16240a", accentHex:"#a3e858", radius:1.5, bright:false, ring:false },
    { name: "707", sub: "the area", orbit:{radius:24, inclination:-0.2, angle:0.85}, color:0xe0b23a, baseHex:"#2a1f08", accentHex:"#ffce5c", radius:1.5, bright:false, ring:false },
    { name: "featured artists", sub: "the jacka / skeler / 38 spesh", orbit:{radius:30, inclination:0.35, angle:0.25}, color:0xe0b23a, baseHex:"#241d10", accentHex:"#ffdf8a", radius:1.35, bright:false, ring:true },
    { name: "photos", sub: "kids \u00b7 quiet orbit", orbit:{radius:27, inclination:0.55, angle:2.5}, color:0x3fa8a5, baseHex:"#0d2222", accentHex:"#6fd6d2", radius:1.2, bright:false, ring:false },
    { name: "to-do", sub: "the list", orbit:{radius:18, inclination:-0.1, angle:1.8}, color:0x7a9a55, baseHex:"#1a2210", accentHex:"#a8cc7a", radius:1.1, bright:false, ring:false },
    { name: "unclaimed", sub: "open orbit", orbit:{radius:34, inclination:0.2, angle:3.6}, color:0x556655, baseHex:"#141d14", accentHex:"#6f8a6f", radius:0.9, bright:false, ring:false, linked:false },
    { name: "unclaimed", sub: "open orbit", orbit:{radius:38, inclination:-0.35, angle:4.6}, color:0x556655, baseHex:"#141d14", accentHex:"#6f8a6f", radius:0.85, bright:false, ring:false, linked:false },
    { name: "unclaimed", sub: "open orbit", orbit:{radius:32, inclination:0.4, angle:5.5}, color:0x556655, baseHex:"#141d14", accentHex:"#6f8a6f", radius:0.95, bright:false, ring:false, linked:false },
    { name: "unlisted", sub: "\u2014", orbit:{radius:40, inclination:-0.25, angle:3.85}, color:0x3a4a3a, baseHex:"#0c0f0c", accentHex:"#2f3f2f", radius:1.0, bright:false, ring:false, hidden:true, linked:false }
  ];

  var nodes = [];
  var centerNode = null;
  var labelsContainer = document.getElementById('labels');

  nodeDefs.forEach(function(def){
    var pos = def.pos ? new THREE.Vector3(def.pos[0], def.pos[1], def.pos[2])
                       : orbitPosition(def.orbit.radius, def.orbit.inclination, def.orbit.angle);
    var group = new THREE.Object3D();
    group.position.copy(pos);

    var tex = makePlanetTexture(def.baseHex, def.accentHex, def.bright);
    var core = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius, 44, 44),
      new THREE.MeshStandardMaterial({
        map: tex,
        emissive: new THREE.Color(def.color),
        emissiveIntensity: def.hidden ? 0.08 : (def.bright ? 0.55 : 0.22),
        roughness: 0.55,
        metalness: 0.2
      })
    );
    group.add(core);

    var glowLayers = def.hidden ? 0 : (def.bright ? 3 : 2);
    for (var g = 1; g <= glowLayers; g++){
      var glow = new THREE.Mesh(
        new THREE.SphereGeometry(def.radius * (1 + g*0.16), 28, 28),
        new THREE.MeshBasicMaterial({
          color: def.color, transparent: true, opacity: (def.bright ? 0.14 : 0.09) / g,
          side: THREE.BackSide, blending: THREE.AdditiveBlending
        })
      );
      group.add(glow);
    }

    var light = new THREE.PointLight(def.color, def.hidden ? 0.25 : (def.bright ? 2.2 : 1.05), def.radius * 14);
    group.add(light);

    if (def.ring){
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(def.radius * 1.5, def.radius * 1.9, 56),
        new THREE.MeshBasicMaterial({ color: def.color, side: THREE.DoubleSide, transparent: true, opacity: def.bright ? 0.4 : 0.25, blending: THREE.AdditiveBlending })
      );
      ring.rotation.x = Math.PI / 2.3;
      ring.rotation.z = Math.random() * 0.6;
      group.add(ring);
    }

    var hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius * 1.9, 10, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    group.add(hitMesh);

    scene.add(group);

    var labelEl = document.createElement('div');
    labelEl.className = 'node-label' + (def.isCenter ? ' center' : '');
    var hexColor = '#' + def.color.toString(16).padStart(6, '0');
    labelEl.innerHTML = def.name + '<span class="sub" style="color:' + hexColor + '">' + def.sub + '</span>';
    labelsContainer.appendChild(labelEl);

    var nodeObj = { def: def, group: group, core: core, hitMesh: hitMesh, labelEl: labelEl };
    nodes.push(nodeObj);
    if (def.isCenter) centerNode = nodeObj;
  });

  nodeDefs.forEach(function(def){
    if (!def.orbit || def.hidden) return;
    var segs = 96, pts = [];
    for (var i = 0; i <= segs; i++){
      var a = (i / segs) * Math.PI * 2;
      pts.push(orbitPosition(def.orbit.radius, def.orbit.inclination, a));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: def.color, transparent: true, opacity: 0.1 });
    scene.add(new THREE.LineLoop(geo, mat));
  });

  var links = [];
  nodes.forEach(function(n){
    if (n === centerNode || n.def.linked === false) return;
    var start = new THREE.Vector3().copy(centerNode.group.position);
    var end = new THREE.Vector3().copy(n.group.position);
    var mid = start.clone().add(end).multiplyScalar(0.5);
    mid.y += 6 + Math.random() * 3;
    var curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    var points = curve.getPoints(48);

    var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    var lineColors = new Float32Array(points.length * 3);
    var cCyan = new THREE.Color(0x00e5e0);
    var cNode = new THREE.Color(n.def.color);
    for (var i = 0; i < points.length; i++){
      var t = i / (points.length - 1);
      var mixed = cCyan.clone().lerp(cNode, t);
      lineColors[i*3] = mixed.r; lineColors[i*3+1] = mixed.g; lineColors[i*3+2] = mixed.b;
    }
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    var line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4 }));
    scene.add(line);

    var pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00e5e0, transparent: true, opacity: 0.9 })
    );
    scene.add(pulse);

    links.push({ curve: curve, pulse: pulse, speed: 0.05 + Math.random()*0.03, offset: Math.random() });
  });

  var isDragging = false, lastX = 0, lastY = 0;
  var yaw = 0, pitch = 0;
  var yawTarget = 0, pitchTarget = 0;

  function onDown(x, y){ isDragging = true; lastX = x; lastY = y; document.body.classList.add('dragging'); }
  function onMove(x, y){
    if (!isDragging) return;
    var dx = x - lastX, dy = y - lastY;
    lastX = x; lastY = y;
    yawTarget -= dx * 0.0006;
    pitchTarget -= dy * 0.0006;
    pitchTarget = Math.max(-1.15, Math.min(1.15, pitchTarget));
  }
  function onUp(){ isDragging = false; document.body.classList.remove('dragging'); }

  renderer.domElement.addEventListener('mousedown', function(e){ onDown(e.clientX, e.clientY); });
  window.addEventListener('mousemove', function(e){ onMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', onUp);
  renderer.domElement.addEventListener('touchstart', function(e){ var t = e.touches[0]; onDown(t.clientX, t.clientY); }, {passive:true});
  window.addEventListener('touchmove', function(e){ var t = e.touches[0]; onMove(t.clientX, t.clientY); }, {passive:true});
  window.addEventListener('touchend', onUp);

  var raycaster = new THREE.Raycaster();
  var mouseVec = new THREE.Vector2();
  var target = new THREE.Vector3(0, 0, 8);
  var approaching = false;
  var pendingNode = null;
  var arrivedNode = null;
  var statusEl = document.querySelector('.status');
  var confirmEl = document.getElementById('confirm');
  var interiorEl = document.getElementById('interior');
  var interiorTagEl = document.getElementById('interior-tag');
  var interiorExitEl = document.getElementById('interior-exit');

  function showConfirm(node){
    confirmEl.textContent = 'click again to enter \u2014 ' + node.def.name;
    confirmEl.classList.add('show');
  }
  function hideConfirm(){ confirmEl.classList.remove('show'); }

  function enterNode(node){
    interiorTagEl.textContent = node.def.name;
    interiorEl.classList.add('open');
    statusEl.innerHTML = '<span class="live">&#9679;</span> inside \u2014 ' + node.def.name;
  }
  interiorExitEl.addEventListener('click', function(){
    interiorEl.classList.remove('open');
    statusEl.innerHTML = '<span class="live">&#9679;</span> proof of concept &mdash; nav feel only';
  });

  function handleClick(clientX, clientY){
    if (interiorEl.classList.contains('open')) return;
    mouseVec.x = (clientX / window.innerWidth) * 2 - 1;
    mouseVec.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);
    var hitMeshes = nodes.map(function(n){ return n.hitMesh; });
    var hits = raycaster.intersectObjects(hitMeshes, true);
    if (!hits.length) return;
    var hitObj = hits[0].object;
    var found = nodes.find(function(n){ return n.hitMesh === hitObj; });
    if (!found) return;

    if (found === arrivedNode){
      enterNode(found);
      return;
    }

    var worldPos = new THREE.Vector3();
    found.group.getWorldPosition(worldPos);
    var dir = worldPos.clone().sub(rig.position).normalize();
    target = worldPos.clone().sub(dir.multiplyScalar(found.def.radius * 2.6));
    approaching = true;
    pendingNode = found;
    arrivedNode = null;
    hideConfirm();
    statusEl.innerHTML = '<span class="live">&#9679;</span> approaching &mdash; ' + found.def.name;
  }
  renderer.domElement.addEventListener('click', function(e){
    if (Math.abs(e.movementX||0) < 4) handleClick(e.clientX, e.clientY);
  });

  window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  var clock = new THREE.Clock();
  var camPos = new THREE.Vector3(0, 0, 8);

  function projectLabel(obj3d){
    var v = new THREE.Vector3();
    obj3d.getWorldPosition(v);
    v.project(camera);
    var behind = v.z > 1;
    var x = (v.x * 0.5 + 0.5) * window.innerWidth;
    var y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    return { x: x, y: y, behind: behind };
  }

  function animate(){
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    yaw += (yawTarget - yaw) * 0.06;
    pitch += (pitchTarget - pitch) * 0.06;
    rig.rotation.y = yaw;
    rig.rotation.x = pitch;

    if (approaching){
      camPos.lerp(target, 0.02);
      if (camPos.distanceTo(target) < 0.06){
        approaching = false;
        if (pendingNode){
          arrivedNode = pendingNode;
          pendingNode = null;
          showConfirm(arrivedNode);
          statusEl.innerHTML = '<span class="live">&#9679;</span> arrived \u2014 ' + arrivedNode.def.name;
        }
      }
    } else {
      camPos.lerp(new THREE.Vector3(Math.sin(t*0.04)*1.4, Math.cos(t*0.035)*0.7, 8 + Math.sin(t*0.025)*1.0), 0.01);
    }
    rig.position.copy(camPos);

    particles.rotation.y = t * 0.006;

    nodes.forEach(function(n){
      n.core.rotation.y += n.def.isCenter ? 0.0025 : 0.004;
      var p = projectLabel(n.group);
      if (p.behind || p.x < -120 || p.x > window.innerWidth+120){
        n.labelEl.style.opacity = 0;
      } else {
        n.labelEl.style.opacity = 1;
        n.labelEl.style.left = p.x + 'px';
        n.labelEl.style.top = p.y + 'px';
      }
    });

    links.forEach(function(l){
      var tp = (t * l.speed + l.offset) % 1;
      l.pulse.position.copy(l.curve.getPoint(tp));
    });

    renderer.render(scene, camera);
  }
  animate();
})();