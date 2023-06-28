import * as THREE from 'three';

class Cube {
  constructor(vertices, center) {
    this.vertices = vertices;
    this.center = center;
  }

  getFurthestPointInDirection(direction) {
    let furthestPoint = null;
    let maxDistance = -Infinity;

    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i].clone();
      vertex.add(this.center);
      const distance = vertex.dot(direction);

      if (distance > maxDistance) {
        maxDistance = distance;
        furthestPoint = vertex;
      }
    }

    return furthestPoint;
  }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const amplitude = 2;
const frequency = 0.005;

const geometry1 = new THREE.BoxGeometry(1, 1, 1);
const material1 = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White color
const cube1 = new THREE.Mesh(geometry1, material1);
scene.add(cube1);
cube1.position.set(1, 0, 0);
const cube1Vertices = Array.from(geometry1.attributes.position.array).reduce((acc, _, i, array) => {
  if (i % 3 === 0) {
    const vertex = new THREE.Vector3(array[i], array[i + 1], array[i + 2]);
    acc.push(vertex);
  }
  return acc;
}, []);

const geometry2 = new THREE.BoxGeometry(1, 1, 1);
const material2 = new THREE.MeshBasicMaterial({ color: 0xffffff });
const cube2 = new THREE.Mesh(geometry2, material2);
scene.add(cube2);
cube2.position.set(-1, 0, 0);
const cube2Vertices = Array.from(geometry2.attributes.position.array).reduce((acc, _, i, array) => {
  if (i % 3 === 0) {
    const vertex = new THREE.Vector3(array[i], array[i + 1], array[i + 2]);
    acc.push(vertex);
  }
  return acc;
}, []);

const gjk = (cube1, cube2) => {
  const support = (cube1, cube2, direction) => {
    const point1 = cube1.getFurthestPointInDirection(direction);
    const point2 = cube2.getFurthestPointInDirection(direction.clone().negate());
    return point1.clone().sub(point2);
  };

  const handleSimplex = (simplex, direction) => {
    const a = simplex[simplex.length - 1];
    const ao = a.negate();

    if (simplex.length === 2) {
      const b = simplex[0];
      const ab = b.sub(a);
      direction.copy(ab.cross(ao));

      if (direction.isZero()) {
        direction.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      }

      return;
    }

    if (simplex.length === 3) {
      const b = simplex[simplex.length - 2];
      const c = simplex[simplex.length - 3];
      const ab = b.sub(a);
      const ac = c.sub(a);
      direction.copy(ab.cross(ac));

      if (direction.isZero()) {
        direction.copy(ac.cross(ab).cross(ac));
      }

      if (direction.isZero()) {
        direction.copy(ab.cross(ac.negate()).cross(ab));
      }

      return;
    }

    const b = simplex[simplex.length - 2];
    const c = simplex[simplex.length - 3];
    const d = simplex[simplex.length - 4];
    const ab = b.sub(a);
    const ac = c.sub(a);
    const ad = d.sub(a);
    const abc = ab.cross(ac);
    const acd = ac.cross(ad);

    if (abc.dot(ad.cross(ab)) > 0) {
      simplex.splice(simplex.length - 3, 1);
      direction.copy(ab.cross(ad).cross(ab));
      return;
    }

    if (acd.dot(ab.cross(ac)) > 0) {
      simplex.splice(simplex.length - 2, 1);
      direction.copy(ac.cross(ab).cross(ac));
      return;
    }

    if (abc.dot(ac.cross(ad)) > 0) {
      simplex.splice(simplex.length - 3, 2);
      direction.copy(ad.cross(ac).cross(ad));
      return;
    }

    return true;
  };

  const simplex = [support(cube1, cube2, new THREE.Vector3(1, 1, 1))];
  const direction = simplex[0].negate();

  while (true) {
    const supportPoint = support(cube1, cube2, direction);

    if (supportPoint.dot(direction) <= 0) {
      return false;
    }

    simplex.push(supportPoint);

    const result = handleSimplex(simplex, direction);
    if (result === true) {
      return true;
    }
  }
};

const beepAudio = new Audio();
beepAudio.src = 'beep.wav';
beepAudio.addEventListener('canplaythrough', () => {
  if (gjk(cube1, cube2)) {
    beepAudio.play();
    material1.color.set(0xff0000);
    material2.color.set(0xff0000);
  } else {
    material1.color.set(0xffffff);
    material2.color.set(0xffffff);
  }
});

const animate = () => {
  requestAnimationFrame(animate);
  const time = Date.now() * frequency;
  const displacement1 = Math.sin(time) * amplitude;
  const displacement2 = Math.sin(time + Math.PI) * amplitude;
  cube1.position.x = displacement1;
  cube2.position.x = displacement2;
  renderer.render(scene, camera);
};

animate();
