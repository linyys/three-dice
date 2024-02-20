import * as THREE from "three";
import * as CANNON from "cannon-es";
// import * as STD from "three-stdlib";
import {  mergeVertices } from "three/addons/utils/BufferGeometryUtils.js"
export const create_dice = () => {
  const geometry = new THREE.OctahedronGeometry(10);
  const rgb_arr = [
    [161, 178, 74],
    [255, 150, 75],
    [176, 103, 208],
    [219, 168, 79],
    [20, 204, 238],
    [109, 210, 192],
    [166, 228, 241],
    [255, 255, 255],
  ];
  const color_arr = [];
  rgb_arr.map((val_arr) => {
    for (let i = 0; i < 3; i++) {
      val_arr.map((val) => {
        color_arr.push(val / 255);
      });
    }
  });
  const color = new Float32Array(color_arr);
  geometry.attributes.color = new THREE.BufferAttribute(color, 3);
  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  const polyhedron_mesh = new THREE.Mesh(geometry, material);
  const shape = create_dice_shape(polyhedron_mesh);
  const mesh = init_points(polyhedron_mesh);
  const body = new CANNON.Body({
    mass: 10,
    shape,
  });
  return {
    mesh,
    body,
    init_body: (position) => {
      body.position = position;
      console.log(body.position);
      body.angularVelocity.set(Math.random(), Math.random(), Math.random());
      body.velocity.set(0, -80, 0);
      body.sleepState = 0;
    },
    update: () => {
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
    },
    get_top: () => {
      let top_face,
        max = 0;
      mesh.children.map((val, index) => {
        if (index == 0) return;
        val.updateMatrixWorld();
        let worldPosition = new THREE.Vector3();
        val.getWorldPosition(worldPosition);
        if (max < worldPosition.y) {
          max = worldPosition.y;
          top_face = val.name;
        }
      });
      return top_face;
    },
  };
};

export const create_dice_manager = () => {
  let dice_arr = [];
  return {
    add: (dice) => {
      dice_arr.push(dice);
    },
    get_top_all: () => {
      let map = new Map();
      dice_arr.map((dice) => {});
    },
    move_dice: (name, position) => {
      for (let i = 0; i < dice_arr.length; i++) {
        if (name == dice_arr[i].mesh.name) {
          dice_arr[i].body.position = position;
          break;
        }
      }
    },
    init_dice: (exclude_dices) => {
      for (let i = 0; i < dice_arr.length; i++) {
        if (!exclude_dices.includes(dice_arr[i].mesh.name)) {
          dice_arr[i].init_body(new CANNON.Vec3(-(i % 4) * 21, 100, i * 6));
        }
      }
    },
    update_all: () => {
      dice_arr.map((dice) => {
        dice.update();
      });
    },
  };
};

const create_dice_shape = (mesh) => {
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", mesh.geometry.getAttribute("position"));
  // geometry.mergeVertices();
 
  geometry = mergeVertices(geometry);
  const position = geometry.attributes.position.array;
  const index = geometry.index.array;
  const vertices = [];
  for (let i = 0, len = position.length; i < len; i += 3) {
    vertices.push(
      new CANNON.Vec3(position[i], position[i + 1], position[i + 2])
    );
  }
  const faces = [];
  for (let i = 0, len = index.length; i < len; i += 3) {
    faces.push([index[i], index[i + 1], index[i + 2]]);
  }
  return new CANNON.ConvexPolyhedron({ vertices, faces });
};

const create_basic_mesh = (position, name) => {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([0, 0, 0]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  const mesh = new THREE.Mesh(geometry);
  [mesh.position.y, mesh.position.x, mesh.position.z] = position;
  mesh.name = name; //标记面的点数
  return mesh;
};

// 初始化点数位置
const init_points = (mesh) => {
  const group = new THREE.Group();
  group.add(mesh);
  group.name = "dice";
  group.add(create_basic_mesh([5, 5, 5], "grass"));
  group.add(create_basic_mesh([5, -5, 5], "universal"));
  group.add(create_basic_mesh([5, -5, -5], "water"));
  group.add(create_basic_mesh([5, 5, -5], "rock"));
  group.add(create_basic_mesh([-5, 5, 5], "fire"));
  group.add(create_basic_mesh([-5, -5, 5], "ice"));
  group.add(create_basic_mesh([-5, -5, -5], "wind"));
  group.add(create_basic_mesh([-5, 5, -5], "thunder"));
  return group;
};

