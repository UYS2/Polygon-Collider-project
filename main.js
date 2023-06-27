import * as THREE from 'three';
import { Vector3 } from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

document.addEventListener('click', () => {
  

	const cubeSize = 1;
	const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
	const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
	


  const verticesA = geometry.attributes.position.array.map((_, index) => {
    const vertex = new Vector3();
    vertex.fromArray(geometry.attributes.position.array, index * 3);
    return vertex;
  });
  
  const verticesB = geometry.attributes.position.array.map((_, index) => {
    const vertex = new Vector3();
    vertex.fromArray(geometry.attributes.position.array, index * 3);
    return vertex;
  });

  
  
  // Collider
  class Collider {
    FindFurthestPoint(direction) {}
  }

  class MeshCollider extends Collider {
    constructor(vertices) {
      super();
      this.vertices = vertices;
    }

    FindFurthestPoint(direction) {
      let maxPoint;
      let maxDistance = -Infinity;

      for (let vertex of this.vertices) {
        const distance = vertex.dot(direction);
        if (distance > maxDistance) {
          maxDistance = distance;
          maxPoint = vertex;
        }
      }

      return maxPoint;
    }
  }
  const colliderA = new MeshCollider(verticesA);
  const colliderB = new MeshCollider(verticesB);


  colliderA.position.x = 0;
  colliderB.position.x = 1;
  scene.add(colliderA);
  scene.add(colliderB);
  function Support(colliderA, colliderB, direction) {
    return colliderA.FindFurthestPoint(direction).sub(colliderB.FindFurthestPoint(direction.negate()));
  }

  // Simplex
  class Simplex {
    constructor() {
      this.m_points = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
      this.m_size = 0;
    }

    [Symbol.iterator]() {
      return this.m_points.slice(0, this.m_size)[Symbol.iterator]();
    }

    push_front(point) {
      this.m_points = [point, ...this.m_points.slice(0, 3)];
      this.m_size = Math.min(this.m_size + 1, 4);
    }

    get(index) {
      return this.m_points[index];
    }

    getSize() {
      return this.m_size;
    }

    setPoints(...args) {
      for (let i = 0; i < args.length; i++) {
        this.m_points[i] = args[i];
      }
      this.m_size = args.length;
    }
  }

  function GJK(colliderA, colliderB) {
    let support = Support(colliderA, colliderB, new Vector3(1, 0, 0));

    const points = new Simplex();
    points.push_front(support);

    let direction = support.negate();

    while (true) {
      support = Support(colliderA, colliderB, direction);

      if (support.dot(direction) <= 0) {
        return false;
      }

      points.push_front(support);
      if (NextSimplex(points, direction)) {
        return true;
      }
    }
  }

  function NextSimplex(points, direction) {
    switch (points.getSize()) {
      case 2:
        return Line(points, direction);
      case 3:
        return Triangle(points, direction);
      case 4:
        return Tetrahedron(points, direction);
    }

    return false;
  }

  function SameDirection(direction, ao) {
    return direction.dot(ao) > 0;
  }

  function Line(points, direction) {
    const a = points.get(0);
    const b = points.get(1);

    const ab = b.clone().sub(a);
    const ao = a.clone().negate();

    if (SameDirection(ab, ao)) {
      direction.copy(ab.clone().cross(ao).cross(ab));
    } else {
      points.setPoints(a);
      direction.copy(ao);
    }

    return false;
  }

  function Triangle(points, direction) {
    const a = points.get(0);
    const b = points.get(1);
    const c = points.get(2);

    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    const ao = a.clone().negate();

    const abc = ab.clone().cross(ac);

    if (SameDirection(abc.cross(ac), ao)) {
      if (SameDirection(ac, ao)) {
        points.setPoints(a, c);
        direction.copy(ac.clone().cross(ao).cross(ac));
      } else {
        return Line((points = new Simplex(a, b)), direction);
      }
    } else {
      if (SameDirection(ab.cross(abc), ao)) {
        return Line((points = new Simplex(a, b)), direction);
      } else {
        if (SameDirection(abc, ao)) {
          direction.copy(abc);
        } else {
          points.setPoints(a, c, b);
          direction.copy(abc.clone().negate());
        }
      }
    }

    return false;
  }

  function Tetrahedron(points, direction) {
    const a = points.get(0);
    const b = points.get(1);
    const c = points.get(2);
    const d = points.get(3);

    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    const ad = d.clone().sub(a);
    const ao = a.clone().negate();

    const abc = ab.clone().cross(ac);
    const acd = ac.clone().cross(ad);
    const adb = ad.clone().cross(ab);

    if (SameDirection(abc, ao)) {
      return Triangle((points = new Simplex(a, b, c)), direction);
    }

    if (SameDirection(acd, ao)) {
      return Triangle((points = new Simplex(a, c, d)), direction);
    }

    if (SameDirection(adb, ao)) {
      return Triangle((points = new Simplex(a, d, b)), direction);
    }

    return true;
  }
  
  const audioContext = new AudioContext();
  const beepAudio = new Audio();
  beepAudio.src = 'beep.wav';
  beepAudio.addEventListener('canplaythrough', () => {
    if (GJK(colliderA, colliderB)) {
      beepAudio.play();
      material.color.set(0xff0000);
    } else {
      material.color.set(0xffffff);
    }
  });
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
});
