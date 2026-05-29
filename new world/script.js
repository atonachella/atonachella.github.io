const engageBtn = document.getElementById('engage-btn');
const overlay = document.getElementById('loading-overlay');
const ui = document.getElementById('ui-overlay');

engageBtn.addEventListener('click', () => {
    // Immediate UI feedback
    engageBtn.innerText = "SYNTHESIZING...";
    
    // Slight delay to allow DOM to register the button change
    setTimeout(startEngine, 100);
});

function startEngine() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020205, 0.015);
    
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('main-canvas'), antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(0, 5, 20);

    // Add lights
    scene.add(new THREE.AmbientLight(0x223344, 2));
    const spot = new THREE.SpotLight(0x00ffff, 3);
    spot.position.set(0, 20, 0);
    scene.add(spot);

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.9, roughness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Populate Environment
    for(let i = 0; i < 40; i++) {
        const group = new THREE.Group();
        const box = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshStandardMaterial({color: 0x111111}));
        group.add(box);
        group.position.set((Math.random()-0.5)*100, 2, -i*20);
        scene.add(group);
    }

    // Transition UI
    overlay.style.opacity = 0;
    setTimeout(() => overlay.remove(), 800);
    ui.classList.add('visible');

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        camera.position.z -= 0.1;
        if(camera.position.z < -600) camera.position.z = 20;
        renderer.render(scene, camera);
    }
    animate();
}