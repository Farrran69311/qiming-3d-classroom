import * as THREE from 'three';

/**
 * 创建虚拟教室场景
 * 包含：墙壁、地板、天花板、黑板、智能一体机、讲台、课桌椅、
 *       窗户（带光照）、柜子、绿植、值日表、时钟
 */
export function createClassroom(scene) {
  const classroom = new THREE.Group();

  // ====== 教室尺寸 ======
  const W = 12;     // 宽度 (X)
  const D = 10;     // 深度 (Z)
  const H = 3.5;    // 高度 (Y)

  // ====== 材质定义 ======
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfaf3e0, side: THREE.DoubleSide }); // 米黄色墙壁
  const floorMat = createFloorMaterial();           // 带网格的地板
  const ceilingMat = createCeilingMaterial();       // 办公室风格石膏板天花板

  // ====== 地板 ======
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -D / 2);
  floor.receiveShadow = true;
  classroom.add(floor);

  // ====== 天花板 ======
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, H, -D / 2);
  classroom.add(ceiling);

  // ====== 前墙（黑板墙，在人物背后） ======
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
  frontWall.position.set(0, H / 2, -D);
  classroom.add(frontWall);

  // ====== 后墙 ======
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
  backWall.position.set(0, H / 2, 0);
  backWall.rotation.y = Math.PI;
  classroom.add(backWall);

  // ====== 左墙（带窗户缺口） ======
  createLeftWallWithWindows(classroom, W, H, D, wallMat);

  // ====== 右墙 ======
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(W / 2, H / 2, -D / 2);
  classroom.add(rightWall);

  // ====== 黑板 ======
  createBlackboard(classroom, D);

  // ====== 智能教学一体机 ======
  createSmartDisplay(classroom, D);

  // ====== 讲台 ======
  createPodium(classroom, D);

  // ====== 学生课桌椅 (3列 x 4排) ======
  createDesksAndChairs(classroom, D);

  // ====== 窗户光照效果 ======
  createWindowLights(scene, W, H, D);

  // ====== 柜子（右墙靠后方） ======
  createCabinet(classroom, W, D);

  // ====== 绿植 ======
  createPlants(classroom, W, D);

  // ====== 值日表 ======
  createDutyRoster(classroom, W, D);

  // ====== 时钟 ======
  createClock(classroom, D);

  // ====== 校训 ======
  createSchoolMotto(classroom, D);

  scene.add(classroom);
  return classroom;
}

// ==================== 辅助函数 ====================

/**
 * 创建地板材质（带网格纹理）
 */
function createFloorMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 底色 - 浅木色
  ctx.fillStyle = '#d4b896';
  ctx.fillRect(0, 0, 512, 512);

  // 网格线
  ctx.strokeStyle = '#c4a882';
  ctx.lineWidth = 2;
  const tileSize = 64;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0); ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i); ctx.lineTo(512, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);

  return new THREE.MeshStandardMaterial({ map: texture });
}

/**
 * 创建天花板材质（办公室石膏板风格，带灰色间隔线）
 */
function createCeilingMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 底色 - 纯白色石膏板
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);

  // 间隔线 - 灰色
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 4;
  const gridSize = 128; // 石膏板方块大小

  for (let i = 0; i <= 512; i += gridSize) {
    // 横线
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
    // 纵线
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
  }

  // 给石膏板加一点非常细微的凹凸感（可选）
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const dotAlpha = Math.random() * 0.05;
    ctx.fillStyle = `rgba(0,0,0,${dotAlpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 5); // 对应 W=12, D=10 的比例

  return new THREE.MeshStandardMaterial({ 
    map: texture,
    side: THREE.BackSide // 确保从教室内部看得到
  });
}

/**
 * 黑板
 */
function createBlackboard(parent, D) {
  const group = new THREE.Group();

  // 黑板面 (宽度4, 高度1.5, 中心 x=-1.1) -> 范围 [-3.1, 0.9]
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x2d5016 }); // 深绿色
  const board = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 0.05), boardMat);
  board.position.set(-1.1, 1.8, -D + 0.03);
  group.add(board);

  // 黑板边框
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 }); // 棕色木框
  
  // 上边框 (不对齐一体机侧，宽度设为4)
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.06, 0.08), frameMat);
  frameTop.position.set(-1.1, 2.55, -D + 0.03);
  group.add(frameTop);

  // 下边框
  const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.06, 0.08), frameMat);
  frameBottom.position.set(-1.1, 1.05, -D + 0.03);
  group.add(frameBottom);

  // 左边框
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.56, 0.08), frameMat);
  frameLeft.position.set(-3.1, 1.8, -D + 0.03);
  group.add(frameLeft);

  // 移除了右边框，因为它将与一体机接合

  // 粉笔槽 (宽度也改为4)
  const tray = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.05, 0.12), frameMat);
  tray.position.set(-1.1, 1.02, -D + 0.08);
  group.add(tray);

  parent.add(group);
}

/**
 * 智能教学一体机（大屏幕）
 */
function createSmartDisplay(parent, D) {
  const group = new THREE.Group();

  // 屏幕外壳 (统一高度为1.56, 与黑板含边框高度一致, 宽度2.2, 中心 x=2.0) -> 范围 [0.9, 3.1]
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const shell = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.56, 0.06), shellMat);
  shell.position.set(2.0, 1.8, -D + 0.04);
  group.add(shell);

  // 屏幕 (高度相应增加)
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x4488ff,
    emissive: 0x112244,
    emissiveIntensity: 0.5,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.35), screenMat);
  screen.position.set(2.0, 1.8, -D + 0.08);
  group.add(screen);

  // 移除了底部支架，因为它现在是与黑板一体化的墙挂式布局

  parent.add(group);
}

/**
 * 讲台
 */
function createPodium(parent, D) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xb8860b }); // 深金色木头

  // 讲台主体
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.6), mat);
  body.position.set(0, 0.5, -D + 1.2);
  parent.add(body);

  // 讲台面板（倾斜的顶部）
  const topMat = new THREE.MeshStandardMaterial({ color: 0xcd9b1d });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.7), topMat);
  top.position.set(0, 1.01, -D + 1.2);
  parent.add(top);
}

/**
 * 学生课桌椅
 */
function createDesksAndChairs(parent, D) {
  const deskMat = new THREE.MeshStandardMaterial({ color: 0xc4a35a }); // 浅木色
  const legMat = new THREE.MeshStandardMaterial({ color: 0x888888 });  // 金属灰
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x4a90d9 }); // 蓝色椅面

  const columns = 3;
  const rows = 4;
  const spacingX = 2.5;
  const spacingZ = 1.6;
  const startX = -(columns - 1) * spacingX / 2;
  const startZ = -D + 3.5;

  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows; row++) {
      const x = startX + col * spacingX;
      const z = startZ + row * spacingZ;
      createSingleDesk(parent, x, z, deskMat, legMat, chairMat);
    }
  }
}

function createSingleDesk(parent, x, z, deskMat, legMat, chairMat) {
  const group = new THREE.Group();

  // 桌面
  const desktop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.5), deskMat);
  desktop.position.set(0, 0.72, 0);
  group.add(desktop);

  // 桌腿（4条）
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.72);
  const positions = [
    [-0.4, 0.36, -0.2], [0.4, 0.36, -0.2],
    [-0.4, 0.36, 0.2],  [0.4, 0.36, 0.2],
  ];
  positions.forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  });

  // 椅子（在桌后方）
  // 椅面
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.4), chairMat);
  seat.position.set(0, 0.42, 0.5);
  group.add(seat);

  // 椅腿
  const chairLegGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.42);
  const chairLegPos = [
    [-0.17, 0.21, 0.33], [0.17, 0.21, 0.33],
    [-0.17, 0.21, 0.67], [0.17, 0.21, 0.67],
  ];
  chairLegPos.forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(chairLegGeo, legMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  });

  // 椅背
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.03), chairMat);
  backrest.position.set(0, 0.62, 0.68);
  group.add(backrest);

  group.position.set(x, 0, z);
  parent.add(group);
}

/**
 * 左墙（带窗户缺口）
 */
function createLeftWallWithWindows(parent, W, H, D, wallMat) {
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.3,
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee }); // 白色窗框

  const wallX = -W / 2;

  // 窗户之间和两端的实墙
  // 3扇窗户，每扇宽1.5，高1.4，窗台高1.0
  const windowCount = 3;
  const winW = 1.5;
  const winH = 1.4;
  const winY = 1.7; // 窗户中心高度
  const winSpacing = D / (windowCount + 1);

  // 整面左墙（底色层）
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(wallX, H / 2, -D / 2);
  parent.add(leftWall);

  // 在左墙上挖出窗户（用玻璃和窗框叠在墙上）
  for (let i = 0; i < windowCount; i++) {
    const winZ = -(i + 1) * winSpacing;

    // 玻璃
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), windowMat);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(wallX + 0.01, winY, winZ);
    parent.add(glass);

    // 窗框
    const frameThick = 0.04;
    // 上下框
    const hFrame = new THREE.Mesh(new THREE.BoxGeometry(frameThick, 0.04, winW + 0.08), frameMat);
    hFrame.position.set(wallX + 0.02, winY + winH / 2, winZ);
    parent.add(hFrame);
    const hFrame2 = hFrame.clone();
    hFrame2.position.y = winY - winH / 2;
    parent.add(hFrame2);
    // 左右框
    const vFrame = new THREE.Mesh(new THREE.BoxGeometry(frameThick, winH + 0.08, 0.04), frameMat);
    vFrame.position.set(wallX + 0.02, winY, winZ - winW / 2);
    parent.add(vFrame);
    const vFrame2 = vFrame.clone();
    vFrame2.position.z = winZ + winW / 2;
    parent.add(vFrame2);
    // 中分线
    const midH = new THREE.Mesh(new THREE.BoxGeometry(frameThick, winH, 0.03), frameMat);
    midH.position.set(wallX + 0.02, winY, winZ);
    parent.add(midH);
  }
}

/**
 * 窗户光照效果
 */
function createWindowLights(scene, W, H, D) {
  const windowCount = 3;
  const winSpacing = D / (windowCount + 1);

  for (let i = 0; i < windowCount; i++) {
    const winZ = -(i + 1) * winSpacing;
    const light = new THREE.PointLight(0xffffee, 0.6, 8);
    light.position.set(-W / 2 + 0.5, H * 0.6, winZ);
    scene.add(light);
  }
}

/**
 * 柜子（右墙靠后方）
 */
function createCabinet(parent, W, D) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xa0784a }); // 棕色木柜
  const group = new THREE.Group();

  // 柜体
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.5), mat);
  body.position.set(W / 2 - 0.35, 0.8, -1.5);
  group.add(body);

  // 柜门分隔线（两扇门的效果）
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x8a6535 });
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.5, 0.52), lineMat);
  line.position.set(W / 2 - 0.35, 0.8, -1.5);
  group.add(line);

  // 门把手
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  const handleL = new THREE.Mesh(new THREE.SphereGeometry(0.03), handleMat);
  handleL.position.set(W / 2 - 0.5, 0.85, -1.24);
  group.add(handleL);
  const handleR = handleL.clone();
  handleR.position.x = W / 2 - 0.2;
  group.add(handleR);

  parent.add(group);
}

/**
 * 绿植（简约卡通风格）
 */
function createPlants(parent, W, D) {
  // 在教室角落放两盆绿植
  const positions = [
    [-W / 2 + 0.5, 0, -0.5],     // 左后角
    [W / 2 - 0.5, 0, -D + 0.5],  // 右前角
  ];

  positions.forEach(([px, py, pz]) => {
    const plant = createSinglePlant();
    plant.position.set(px, py, pz);
    parent.add(plant);
  });
}

function createSinglePlant() {
  const group = new THREE.Group();

  // 花盆
  const potMat = new THREE.MeshStandardMaterial({ color: 0xb5651d });
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.14, 0.3, 8),
    potMat
  );
  pot.position.y = 0.15;
  group.add(pot);

  // 泥土
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 8), soilMat);
  soil.position.y = 0.31;
  group.add(soil);

  // 叶子（使用几个球体模拟卡通绿植球）
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a8c3f });
  const leafPositions = [
    [0, 0.55, 0, 0.18],
    [-0.1, 0.48, 0.08, 0.12],
    [0.1, 0.5, -0.06, 0.13],
    [0, 0.65, 0.05, 0.1],
  ];
  leafPositions.forEach(([lx, ly, lz, r]) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), leafMat);
    leaf.position.set(lx, ly, lz);
    group.add(leaf);
  });

  return group;
}

/**
 * 值日表（挂在右墙上）
 */
function createDutyRoster(parent, W, D) {
  const group = new THREE.Group();

  // 值日表底板
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.5), boardMat);
  board.position.set(W / 2 - 0.02, 1.6, -D / 2);
  group.add(board);

  // 标题区域（红色横条）
  const titleMat = new THREE.MeshStandardMaterial({ color: 0xcc3333 });
  const title = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.48), titleMat);
  title.position.set(W / 2 - 0.02, 1.9, -D / 2);
  group.add(title);

  // 表格线条（横线）
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
  for (let i = 0; i < 5; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.005, 0.48), lineMat);
    line.position.set(W / 2 - 0.02, 1.78 - i * 0.12, -D / 2);
    group.add(line);
  }

  parent.add(group);
}

/**
 * 时钟（挂在前墙上方）
 * 修复了指针旋转轴心和位置不对的问题，并增加了实时走时逻辑
 */
function createClock(parent, D) {
  const group = new THREE.Group();
  const centerX = 4.5;
  const centerY = 2.8;
  const clockZ = -D + 0.03;

  // 钟面
  const faceMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 32), faceMat);
  face.rotation.x = Math.PI / 2;
  face.position.set(centerX, centerY, clockZ);
  group.add(face);

  // 钟框
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.02, 8, 32),
    rimMat
  );
  rim.position.set(centerX, centerY, clockZ + 0.01);
  group.add(rim);

  // 指针材质
  const handMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  // 时针
  const hourGeom = new THREE.BoxGeometry(0.02, 0.12, 0.01);
  hourGeom.translate(0, 0.06, 0); // 移动几何体使其围绕底部端点旋转
  const hour = new THREE.Mesh(hourGeom, handMat);
  hour.position.set(centerX, centerY, clockZ + 0.02);
  group.add(hour);

  // 分针
  const minuteGeom = new THREE.BoxGeometry(0.015, 0.18, 0.01);
  minuteGeom.translate(0, 0.09, 0); // 移动几何体使其围绕底部端点旋转
  const minute = new THREE.Mesh(minuteGeom, handMat);
  minute.position.set(centerX, centerY, clockZ + 0.03);
  group.add(minute);

  // 秒针
  const secondGeom = new THREE.BoxGeometry(0.005, 0.22, 0.005);
  secondGeom.translate(0, 0.11, 0);
  const secondMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const second = new THREE.Mesh(secondGeom, secondMat);
  second.position.set(centerX, centerY, clockZ + 0.04);
  group.add(second);

  // 中心点
  const centerMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), centerMat);
  center.position.set(centerX, centerY, clockZ + 0.04);
  group.add(center);

  // 走时逻辑
  const updateClock = () => {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();

    // 顺时针旋转，Z轴正方向朝向摄像机，所以旋转值为负
    hour.rotation.z = -((h + m / 60) * (Math.PI / 6));
    minute.rotation.z = -((m + s / 60) * (Math.PI / 30));
    second.rotation.z = -(s * (Math.PI / 30));
  };

  // 初始设置一次时间
  updateClock();

  // 通过 mesh 的 onBeforeRender 钩子自动更新
  center.onBeforeRender = updateClock;

  parent.add(group);
}

/**
 * 校训文字
 */
function createSchoolMotto(parent, D) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 128;

  // 背景透明
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 文字样式
  ctx.fillStyle = '#cc0000'; // 深红色
  ctx.font = 'bold 80px "Microsoft YaHei", "SimHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 绘制文字
  ctx.fillText('爱 国  敬 业  求 实  创 新', canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true,
    side: THREE.FrontSide 
  });
  const geometry = new THREE.PlaneGeometry(4, 0.5);
  const mesh = new THREE.Mesh(geometry, material);

  // 位置：前墙正中央上方 (黑板和一体机区域 x: [-3.1, 3.1], 中心 x=0)
  mesh.position.set(0, 3.0, -D + 0.01);
  parent.add(mesh);
}
