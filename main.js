import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

// --- 1. 基础场景初始化 ---

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  20.0
);
camera.position.set(0, 1.3, 3.0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(0.0, 1.3, 0.0);
controls.update();

// 灯光设置
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(1.0, 1.0, 1.0).normalize();
scene.add(directionalLight);

// --- 2. VRM 加载逻辑 ---

let currentVRM = null;
const loader = new GLTFLoader();

// 注册 VRM 插件
loader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});

/**
 * 加载 VRM 模型的函数
 * @param {string} url 模型路径
 */
function loadVRM(url) {
  console.log('正在加载模型:', url);
  
  // 如果当前已有模型，先将其从场景中移除并卸载内存
  if (currentVRM) {
    scene.remove(currentVRM.scene);
    VRMUtils.deepDispose(currentVRM.scene);
    currentVRM = null;
  }

  loader.load(
    url,
    (gltf) => {
      const vrm = gltf.userData.vrm;
      currentVRM = vrm;
      scene.add(vrm.scene);

      // VRM 默认朝向是 +Z，旋转 180 度面向相机
      vrm.scene.rotation.y = Math.PI;

      // 针对 VRM 0.x 的旋转修正
      VRMUtils.rotateVRM0(vrm);
      
      console.log('模型加载成功:', url);
    },
    (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        console.log('加载进度:', percent + '%');
      }
    },
    (error) => {
      console.error('加载出错:', error);
    }
  );
}

// --- 3. UI 交互绑定 ---

// 监听下拉菜单的变化
const selector = document.getElementById('model-selector');
if (selector) {
  selector.addEventListener('change', (event) => {
    loadVRM(event.target.value);
  });
}

// 初始默认加载第一个模型
loadVRM('/models/AliciaSolid_vrm-0.51.vrm');

// --- 4. 动画渲染循环 ---

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  if (currentVRM) {
    // 关键：更新物理（头发、裙子）和表情
    currentVRM.update(deltaTime);
  }

  renderer.render(scene, camera);
}

animate();

// --- 5. 窗口尺寸适配 ---

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
