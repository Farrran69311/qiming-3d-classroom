import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { createClassroom } from './classroom.js';

// --- 1.基础场景初始化 ---

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100.0
);
// 设置初始视角在第二排中心学生位置 (模拟坐姿高度)
camera.position.set(0, 1.15, -4.9);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// 限制像素比最大为 2，防止高分屏下过度锐化导致远端闪烁
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 软阴影
renderer.toneMapping = THREE.ACESFilmicToneMapping; // 电影级色调映射
renderer.toneMappingExposure = 1.0; // 降低曝光度回到标准水平
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
// 控制器目标放在相机正前方一小段距离，让 OrbitControls 能正常旋转
controls.target.set(0, 1.15, -5.0);
// 禁止缩放和平移，只允许鼠标拖拽旋转视角
controls.enableZoom = false;
controls.enablePan = false;
controls.rotateSpeed = 0.5;
controls.update();

// 锁定的相机坐标（第二排中间位置）
const fixedCameraPos = new THREE.Vector3(0, 1.15, -4.9);

// 灯光设置
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 8, 3);
directionalLight.castShadow = true;
scene.add(directionalLight);

// --- 创建教室背景 ---
createClassroom(scene);

// --- 2. VRM 加载逻辑 ---

let currentVRM = null;
const loader = new GLTFLoader();

// 注册 VRM 插件
loader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});

/**
 * 设置基础姿势（使人物双臂下垂，不再是 T-Pose）
 * 根据 VRM 版本自动适配旋转方向
 * @param {VRM} vrm 
 */
function setBasePose(vrm) {
  if (!vrm || !vrm.humanoid) return;

  // 通过 meta.metaVersion 判断 VRM 版本
  // VRM 0.x => metaVersion === '0'，VRM 1.0 => metaVersion === '1'
  const isV0 = vrm.meta?.metaVersion === '0';
  // VRM 0.x 经过 rotateVRM0 之后，骨骼坐标系是翻转的，正负号相反
  const sign = isV0 ? 1 : -1;

  console.log('VRM 版本:', isV0 ? '0.x' : '1.0', '| 旋转系数:', sign);

  const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
  const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');

  if (leftUpperArm) {
    leftUpperArm.rotation.z = sign * 1.3; // 使左臂下垂
  }
  if (rightUpperArm) {
    rightUpperArm.rotation.z = sign * -1.3; // 使右臂下垂
  }

  // 稍微弯曲手肘让姿势更自然
  const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
  const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
  if (leftLowerArm) leftLowerArm.rotation.z = sign * 0.2;
  if (rightLowerArm) rightLowerArm.rotation.z = sign * -0.2;
}

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

      // 将人物放在讲台地坪上 (y=0.15)
      // 地坪范围在 Z: -10 到 -8.7，将老师放在离讲桌更近的位置
      vrm.scene.position.set(0, 0.15, -9.0);

      // VRM 默认朝向是 +Z，旋转 180 度面向相机
      vrm.scene.rotation.y = Math.PI;

      // 针对 VRM 0.x 的旋转修正
      VRMUtils.rotateVRM0(vrm);

      // 优化贴图：开启各向异性过滤及 Mipmap，解决远距离物体过于“锐化”或闪烁的问题
      vrm.scene.traverse((obj) => {
        if (obj.isMesh) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach(mat => {
            if (mat.map) {
              mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
              mat.map.minFilter = THREE.LinearMipmapLinearFilter;
            }
          });
        }
      });

      // 设置基础姿势：放下双臂
      setBasePose(vrm);
      
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

// 切换模型
const selector = document.getElementById('model-selector');
if (selector) {
  selector.addEventListener('change', (event) => {
    loadVRM(event.target.value);
  });
}

// 视角恢复功能
const resetBtn = document.getElementById('reset-view-btn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    camera.position.set(0, 1.15, -4.4);
    controls.target.set(0.0, 1.25, -10.0);
    controls.update();
  });
}

// --- 后期处理设置 ---
const composer = new EffectComposer(renderer);

// 1. 基础渲染通道
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// 2. 泛光通道 (Bloom) - 让发光物体产生光晕
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.25, // 强度减半
  0.4,  // 半径
  0.95  // 提高阈值，只有极亮的光才会触发泛光
);
composer.addPass(bloomPass);

// 3. 抗锯齿通道 (SMAA) - 解决开启后期处理后直线变毛刺/分断的问题
const smaaPass = new SMAAPass(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
composer.addPass(smaaPass);

// 4. 输出通道 (必须放在最后，处理颜色空间转换)
const outputPass = new OutputPass();
composer.addPass(outputPass);

// 初始默认加载第一个模型
loadVRM('/models/AliciaSolid_vrm-0.51.vrm');

// --- 4. 动画渲染循环 ---

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // 将相机锁定在第二排位置，只允许旋转不允许平移
  const offset = camera.position.clone().sub(controls.target).normalize().multiplyScalar(0.1);
  camera.position.copy(fixedCameraPos);
  controls.target.copy(fixedCameraPos).sub(offset);
  controls.update();

  if (currentVRM) {
    // 关键：更新物理（头发、裙子）和表情
    currentVRM.update(deltaTime);
  }

  composer.render();
}

animate();

// --- 5. 窗口尺寸适配 ---

window.addEventListener('resize', () => {
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  smaaPass.setSize(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
});
