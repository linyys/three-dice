import * as THREE from "three";
import * as CANNON from "cannon-es";
import { create_dice, create_dice_manager } from "./dice.js"
let locked_dice = []
let dice_meshs = []
const dice_manager = create_dice_manager();
const scene = new THREE.Scene();
/**
 * 创建网格模型
 */
const geometry = new THREE.BoxGeometry(300, 300, 5);
const material = new THREE.MeshPhongMaterial({
  color: 0x845EC2,
  antialias: true,
  alpha: true
}); //材质对象Material
const desk = new THREE.Mesh(geometry, material);
desk.receiveShadow = true;
desk.rotateX(Math.PI * 0.5)
scene.add(desk);
//聚光灯
const light = new THREE.SpotLight(0xffffff);
light.position.set(20, 220, 100);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
scene.add(light);
//环境光
const ambient = new THREE.AmbientLight(0x666666);
scene.add(ambient);
// 相机设置
const width = window.innerWidth;
const height = window.innerHeight;
const k = width / height;
const s = 70;
//创建相机对象
const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
camera.position.set(0, 200, 450);
camera.lookAt(scene.position);
/**
 * 创建渲染器对象
 */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(width, height);
renderer.setClearColor(0xb9d3ff, 1);
document.getElementById("app").appendChild(renderer.domElement)

function render() {
  renderer.render(scene, camera);
}
render();
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.allowSleep = true;
const floorBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
  position: new CANNON.Vec3(0, 3, 0),
})

floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)
world.addBody(floorBody)
for(let i = 0; i < 8; i++) {
  const dice = create_dice();
  scene.add(dice.mesh);
  world.addBody(dice.body)
  dice_meshs.push(dice.mesh);
  dice_manager.add(dice)
}
dice_manager.init_dice([]);
const choose = (event) => {
  let mouseX = event.clientX;
  let mouseY = event.clientY;
  const x = (mouseX / window.innerWidth) * 2 - 1;
  const y = - (mouseY / window.innerHeight) * 2 + 1;
  let standardVector = new THREE.Vector3(x, y);
  let worldVector = standardVector.unproject(camera);
  let ray = worldVector.sub(camera.position).normalize();
  let raycaster = new THREE.Raycaster(camera.position, ray);
  raycaster.camera = camera
  let intersects = raycaster.intersectObjects(dice_meshs);
  if (intersects.length > 0) {
    let dice_name = intersects[0]?.object.parent.name;
    locked_dice.push(dice_name);
    dice_manager.move_dice(dice_name, new CANNON.Vec3(135, 10, (-100 + locked_dice.length * 20)))
  }
}
addEventListener('click', choose);
const fixedTimeStep = 1.0 / 60.0;
const maxSubSteps = 3;
// loop
let lastTime;
(function animate(time) {
  requestAnimationFrame(animate);
  if (lastTime !== undefined) {
    var dt = (time - lastTime) / 500;
    world.step(fixedTimeStep, dt, maxSubSteps);
  }
  dice_manager.update_all();
  render();
  lastTime = time;
})();