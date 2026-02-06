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
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }); // 白色墙壁
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

  // ====== 右墙（带前后门和飘窗） ======
  createRightWall(classroom, W, H, D, wallMat);

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

  // ====== 书柜（左前角，放字典） ======
  createBookshelf(classroom, W, D);

  // ====== 绿植 ======
  createPlants(classroom, W, D);

  // ====== 值日表 ======
  createDutyRoster(classroom, W, D);

  // ====== 时钟 ======
  createClock(classroom, D);

  // ====== 校训 ======
  createSchoolMotto(classroom, D);

  // ====== 踢脚线 (Baseboards) ======
  addBaseboards(classroom, W, H, D);

  // ====== 顶灯 (Ceiling Lights) ======
  addCeilingLamps(classroom, W, H, D);

  // ====== 广播喇叭 (Speakers) ======
  addBroadcasters(classroom, W, D);

  scene.add(classroom);
  return classroom;
}

// ==================== 装饰扩充 ====================

/**
 * 添加踢脚线
 */
function addBaseboards(parent, W, H, D) {
  const bbMat = new THREE.MeshStandardMaterial({ color: 0x4d3227 }); // 深色木纹
  const h = 0.12; // 踢脚线高度
  const d = 0.02; // 踢脚线厚度

  // 前墙踢脚线
  const bbFront = new THREE.Mesh(new THREE.BoxGeometry(W, h, d), bbMat);
  bbFront.position.set(0, h/2, -D + d/2);
  parent.add(bbFront);

  // 后墙踢脚线
  const bbBack = new THREE.Mesh(new THREE.BoxGeometry(W, h, d), bbMat);
  bbBack.position.set(0, h/2, -d/2);
  parent.add(bbBack);
}

/**
 * 添加天花板灯管
 */
function addCeilingLamps(parent, W, H, D) {
  const lampGroup = new THREE.Group();
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.0
  });
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const rows = 3;
  const cols = 2;
  const spacingZ = D / (rows + 1);
  const spacingX = W / (cols + 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lx = -W/2 + (c + 1) * spacingX;
      const lz = -(r + 1) * spacingZ;

      const group = new THREE.Group();
      // 灯壳
      const housing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.3), housingMat);
      group.add(housing);
      // 灯管面
      const lightMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), lampMat);
      lightMesh.rotation.x = Math.PI / 2;
      lightMesh.position.y = -0.026;
      group.add(lightMesh);

      // 实际光源
      const pLight = new THREE.PointLight(0xffffff, 0.15, 6);
      pLight.position.y = -0.1;
      group.add(pLight);

      group.position.set(lx, H - 0.02, lz);
      lampGroup.add(group);
    }
  }
  parent.add(lampGroup);
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
 * 创建天花板材质（加载外部纹理）
 */
function createCeilingMaterial() {
  const loader = new THREE.TextureLoader();
  const texture = loader.load('/textures/ceiling/TCom_OfficeCeiling_header.jpg');
  
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // 减少重复次数，让格子的纹理更明显
  texture.repeat.set(4, 4); 

  return new THREE.MeshStandardMaterial({ 
    map: texture,
    color: 0xcccccc, // 降低基础亮度，防止过曝
    emissive: 0x111111, // 大幅降低自发光，仅保留阴影处的可见性
    roughness: 0.8,
    metalness: 0.2,
    side: THREE.DoubleSide
  });
}

/**
 * 黑板
 */
function createBlackboard(parent, D) {
  const group = new THREE.Group();
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x2d5016 }); // 深绿色
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 }); // 棕色木框

  // 与一体机外壳高度保持一致：1.775
  const boardH = 1.775;
  const boardY = 1.8;
  const frameThickness = 0.06;

  // 辅助函数：创建一个黑板块
  const createBoardPart = (x, width) => {
    // 黑板面
    const board = new THREE.Mesh(new THREE.BoxGeometry(width, boardH, 0.05), boardMat);
    board.position.set(x, boardY, -D + 0.03);
    group.add(board);

    // 上边框
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(width, frameThickness, 0.08), frameMat);
    frameTop.position.set(x, boardY + boardH / 2 + frameThickness / 2, -D + 0.03);
    group.add(frameTop);

    // 下边框
    const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(width, frameThickness, 0.08), frameMat);
    frameBottom.position.set(x, boardY - boardH / 2 - frameThickness / 2, -D + 0.03);
    group.add(frameBottom);

    // 粉笔槽
    const tray = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.12), frameMat);
    tray.position.set(x, boardY - boardH / 2 - frameThickness, -D + 0.08);
    group.add(tray);
    
    return { leftBound: x - width/2, rightBound: x + width/2 };
  };

  // 一体机壳宽度为3.0，中心为0 -> 边缘为 -1.5 和 1.5
  // 左黑板：紧贴一体机左侧 (x = -1.5 - 1.2 = -2.7, 宽度2.4)
  const leftSide = createBoardPart(-2.7, 2.4);
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, boardH + frameThickness * 2, 0.08), frameMat);
  frameLeft.position.set(leftSide.leftBound, boardY, -D + 0.03);
  group.add(frameLeft);

  // 右黑板：紧贴一体机右侧 (x = 1.5 + 1.2 = 2.7, 宽度2.4)
  const rightSide = createBoardPart(2.7, 2.4);
  const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, boardH + frameThickness * 2, 0.08), frameMat);
  frameRight.position.set(rightSide.rightBound, boardY, -D + 0.03);
  group.add(frameRight);

  parent.add(group);
}

/**
 * 智能教学一体机（大屏幕） - 居中 16:9 比例
 */
function createSmartDisplay(parent, D) {
  const group = new THREE.Group();

  // 与黑板总高度（含边框）对齐：1.775 + 0.06 * 2 = 1.895
  const boardH = 1.775;
  const frameThickness = 0.06;
  const totalH = boardH + frameThickness * 2;

  // 16:9 标准屏幕比例
  const screenW = 2.8;
  const screenH = screenW * (9 / 16);
  const shellW = 3.0; // 与黑板间隙严丝合缝
  const shellH = totalH; // 上下对齐
  const centerX = 0; 
  
  // 屏幕外壳
  const shellMat = new THREE.MeshStandardMaterial({ 
    color: 0x111111, 
    roughness: 0.2, 
    metalness: 0.8 
  });
  const shell = new THREE.Mesh(new THREE.BoxGeometry(shellW, shellH, 0.08), shellMat);
  shell.position.set(centerX, 1.8, -D + 0.04);
  group.add(shell);

  // 创建电脑界面纹理 - 维持 16:9 比例分辨率 (2560x1440)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 2560;
  canvas.height = 1440;

  // 背景：Windows 风格
  const grd = ctx.createLinearGradient(0, 0, 2560, 1440);
  grd.addColorStop(0, '#004a99');
  grd.addColorStop(1, '#0078d7');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 2560, 1440);

  // 任务栏
  ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
  ctx.fillRect(0, 1440 - 80, 2560, 80);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px "Microsoft YaHei"';
  ctx.textAlign = 'center';
  ctx.fillText('⊞', 1280, 1440 - 30);

  // 模拟桌面图标
  const drawIcon = (x, y, color, label) => {
    ctx.fillStyle = color;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, 80, 80, 15);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, 80, 80);
    }
    ctx.fillStyle = 'white';
    ctx.font = '32px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + 40, y + 130);
  };
  drawIcon(80, 80, '#ffffff', '此电脑');
  drawIcon(80, 280, '#ffcc00', '教学课件');

  // 演示窗口
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.fillRect(400, 200, 1800, 1000);
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(400, 200, 1800, 80);
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 50px "Microsoft YaHei"';
  ctx.textAlign = 'center';
  ctx.fillText('正在演示：启明3D虚拟课堂交互教程', 1300, 255);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;

  const screenMat = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 0.12 // 大幅降低发射强度，防止炸屏
  });

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), screenMat);
  screen.position.set(centerX, 1.8, -D + 0.081);
  group.add(screen);

  parent.add(group);
}

/**
 * 讲台（包含地面抬高的台基和老师用的讲桌）
 */
function createPodium(parent, D) {
  const podMat = new THREE.MeshStandardMaterial({ color: 0xf2ead3 }); // 讲台主体更明显的米色（奶油/象牙白）
  const platformMat = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // 讲台地基褐色木质感
    roughness: 0.8,
    metalness: 0.1
  }); 

  // 1. 讲台地坪 (俯视图梯形：绝大部分为直边，仅前端带小切角防止绊倒)
  const pHeight = 0.15;
  const pDepth = 1.3;
  const straightDepth = 1.15; // 绝大部分(1.15m)是直边
  
  // 讲台长边（贴墙侧）延伸至黑板两侧对齐
  // 黑板总宽度计算：一体机(3.0) + 左右黑板(2.4*2) = 7.8
  const wBack = 7.8;  
  const wFront = 7.2; // 前端轻微收窄，形成保护性的小切角
  
  const shape = new THREE.Shape();
  // 以墙面中心为原点 (0,0) 开始绘制
  // y轴在 local 坐标系中旋转后对应 world 坐标系的 Z 轴
  shape.moveTo(-wBack / 2, 0);                 // 后左点 (贴墙)
  shape.lineTo(wBack / 2, 0);                  // 后右点 (贴墙)
  shape.lineTo(wBack / 2, -straightDepth);     // 侧面直边段结束 (右)
  shape.lineTo(wFront / 2, -pDepth);           // 倾斜至前右点
  shape.lineTo(-wFront / 2, -pDepth);          // 前左点
  shape.lineTo(-wBack / 2, -straightDepth);    // 倾斜至侧面直边段开始 (左)
  shape.closePath();

  const platformGeo = new THREE.ExtrudeGeometry(shape, {
    depth: pHeight,
    bevelEnabled: false
  });
  
  const platform = new THREE.Mesh(platformGeo, platformMat);
  // 旋转：将平面的 XY 旋转到 XZ 轴，使挤出的 depth(pHeight) 变为高度 Y
  platform.rotation.x = -Math.PI / 2;
  // 位置：底部着地 (y=0)，且紧贴前墙 (z=-D)
  platform.position.set(0, 0, -D); 
  parent.add(platform);

  // 2. 老师讲桌 (直接放在地板上，位于地坪前方)
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.6), podMat);
  // 讲桌位置：放置在俯视图倒梯形宽边（前沿）的更前方，底部着地 (y=0.5)
  // 地坪深度1.3，讲柜中心移至 -D + 1.6，使其后侧边缘 (-D + 1.3) 与地坪前缘严丝合缝
  body.position.set(0, 0.5, -D + 1.6); 
  parent.add(body);

  // 讲台面板（讲桌顶部的倾斜面板）
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.7), podMat);
  top.position.set(0, 1.02, -D + 1.6);
  parent.add(top);

  // 3. 讲台面板围挡 (防止物品掉落，U型设计：左、右、前)
  const barrierH = 0.08; // 围挡高度
  const barrierT = 0.02; // 围挡厚度
  const deskZ = -D + 1.6;
  const topSurfaceY = 1.04; // top.y(1.02) + thickness/2(0.02)

  // 前部围挡
  const frontBarrier = new THREE.Mesh(new THREE.BoxGeometry(1.3, barrierH, barrierT), podMat);
  frontBarrier.position.set(0, topSurfaceY + barrierH / 2, deskZ + 0.35 - barrierT / 2);
  parent.add(frontBarrier);

  // 左侧围挡
  const leftBarrier = new THREE.Mesh(new THREE.BoxGeometry(barrierT, barrierH, 0.7), podMat);
  leftBarrier.position.set(-0.65 + barrierT / 2, topSurfaceY + barrierH / 2, deskZ);
  parent.add(leftBarrier);

  // 右侧围挡
  const rightBarrier = new THREE.Mesh(new THREE.BoxGeometry(barrierT, barrierH, 0.7), podMat);
  rightBarrier.position.set(0.65 - barrierT / 2, topSurfaceY + barrierH / 2, deskZ);
  parent.add(rightBarrier);
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

  // 书桌堂（桌面下的储物槽）
  const cavityH = 0.12; // 储物槽高度
  const cavityLowerY = 0.705 - cavityH; // 桌面下边缘 y - 高度
  
  // 底板
  const cavityBottom = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.02, 0.46), deskMat);
  cavityBottom.position.set(0, cavityLowerY, 0);
  group.add(cavityBottom);

  // 背板
  const cavityBack = new THREE.Mesh(new THREE.BoxGeometry(0.86, cavityH, 0.02), deskMat);
  cavityBack.position.set(0, cavityLowerY + cavityH / 2, -0.22);
  group.add(cavityBack);

  // 左侧板
  const cavityLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, cavityH, 0.46), deskMat);
  cavityLeft.position.set(-0.42, cavityLowerY + cavityH / 2, 0);
  group.add(cavityLeft);

  // 右侧板
  const cavityRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, cavityH, 0.46), deskMat);
  cavityRight.position.set(0.42, cavityLowerY + cavityH / 2, 0);
  group.add(cavityRight);

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
 * 左墙（带真实窗户缺口和窗外风景）
 */
function createLeftWallWithWindows(parent, W, H, D, wallMat) {
  const group = new THREE.Group();
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    metalness: 0.9,
    roughness: 0.05,
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }); // 铝合金感
  
  const wallX = -W / 2;
  const windowCount = 3;
  const winW = 1.6;
  const winH = 1.8;
  const winY = 1.9; // 稍微抬高一点，给暖气片留位
  const winZGap = D / (windowCount + 1);

  // 1. 分段构建实墙，留下窗户空洞
  const createSeg = (zStart, zEnd, y, h) => {
    const width = Math.abs(zEnd - zStart);
    if (width <= 0) return;
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(width, h), wallMat);
    seg.rotation.y = Math.PI / 2;
    seg.position.set(wallX, y, (zStart + zEnd) / 2);
    group.add(seg);
  };

  // 墙脚（窗台以下）
  createSeg(0, -D, 0.5, 1.0);
  // 墙顶（窗户以上）
  createSeg(0, -D, (winY + winH/2 + H)/2, H - (winY + winH/2));
  // 窗间柱和两端
  createSeg(0, -winZGap + winW/2, winY, winH); // 后角柱
  createSeg(-winZGap - winW/2, -2*winZGap + winW/2, winY, winH); // 柱1
  createSeg(-2*winZGap - winW/2, -3*winZGap + winW/2, winY, winH); // 柱2
  createSeg(-3*winZGap - winW/2, -D, winY, winH); // 前角柱

  // 2. 窗外风景
  const sceneLoader = new THREE.TextureLoader();
  // 模拟一个远景图，这里先用 Canvas 绘制一个简单的自然风景梯度，或者你可以替换为一张图片
  const sceneCanvas = document.createElement('canvas');
  sceneCanvas.width = 1024;
  sceneCanvas.height = 512;
  const sCtx = sceneCanvas.getContext('2d');
  const grd = sCtx.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#4facfe'); // 深天蓝
  grd.addColorStop(0.5, '#00f2fe'); // 浅蓝
  grd.addColorStop(0.6, '#ffffff'); // 地平线白
  grd.addColorStop(0.61, '#96e6a1'); // 浅绿
  grd.addColorStop(1, '#d4fc79'); // 嫩绿
  sCtx.fillStyle = grd;
  sCtx.fillRect(0, 0, 1024, 512);

  // 增加一些云朵
  sCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for(let i=0; i<8; i++) {
    const cx = Math.random() * 1024;
    const cy = Math.random() * 200;
    const cr = 20 + Math.random() * 30;
    sCtx.beginPath();
    sCtx.arc(cx, cy, cr, 0, Math.PI * 2);
    sCtx.arc(cx + cr, cy, cr * 0.8, 0, Math.PI * 2);
    sCtx.arc(cx - cr, cy, cr * 0.8, 0, Math.PI * 2);
    sCtx.fill();
  }
  
  const sceneTex = new THREE.CanvasTexture(sceneCanvas);
  const scenery = new THREE.Mesh(
    new THREE.PlaneGeometry(D * 2, H * 2),
    new THREE.MeshBasicMaterial({ map: sceneTex, side: THREE.DoubleSide })
  );
  scenery.rotation.y = Math.PI / 2;
  scenery.position.set(wallX - 5, H / 2, -D / 2); // 放在窗外 5 米处
  group.add(scenery);

  // 3. 循环创建玻璃、窗框及附件
  for (let i = 0; i < windowCount; i++) {
    const winZ = -(i + 1) * winZGap;

    // 玻璃
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), windowMat);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(wallX, winY, winZ);
    group.add(glass);

    // 窗框
    const frameThick = 0.04;
    const hFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, winW + 0.08), frameMat);
    hFrame.position.set(wallX + 0.02, winY + winH / 2, winZ);
    group.add(hFrame);
    const hFrame2 = hFrame.clone();
    hFrame2.position.y = winY - winH / 2;
    group.add(hFrame2);

    // 大理石台板
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, winW + 0.2), new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.1 }));
    sill.position.set(wallX + 0.15, winY - winH / 2 - 0.02, winZ);
    group.add(sill);

    // 暖气片
    const radiatorGroup = new THREE.Group();
    const radW = winW - 0.2;
    const radH = 0.65;
    const colCount = 12;
    for(let j=0; j<colCount; j++) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.08, radH, 0.08), new THREE.MeshStandardMaterial({color: 0xffffff}));
      col.position.z = (j - (colCount-1)/2) * (radW / colCount);
      radiatorGroup.add(col);
    }
    radiatorGroup.position.set(wallX + 0.1, 0.5, winZ);
    group.add(radiatorGroup);

    // 左右窗框及中分线
    const vFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, winH + 0.08, 0.06), frameMat);
    vFrame.position.set(wallX + 0.02, winY, winZ - winW / 2);
    group.add(vFrame); 
    const vFrameCopy2 = vFrame.clone();
    vFrameCopy2.position.z = winZ + winW / 2;
    group.add(vFrameCopy2);
    
    const midV = new THREE.Mesh(new THREE.BoxGeometry(0.06, winH, 0.04), frameMat);
    midV.position.set(wallX + 0.02, winY, winZ);
    group.add(midV);
  }
  parent.add(group);
}

/**
 * 右墙：包含前后两个教室门和中间的飘窗
 */
function createRightWall(parent, W, H, D, wallMat) {
  const group = new THREE.Group();
  const wallX = W / 2;
  const doorW = 0.9;
  const doorH = 2.0;
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xcd853f }); 
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }); 
  const glassMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.15, 
    metalness: 0.9, 
    roughness: 0.05 
  });

  // 1. 基础实墙（分段拼接，避开门和窗的位置）
  const createWallSegment = (zStart, zEnd, xPos, h, y) => {
    const width = Math.abs(zEnd - zStart);
    if (width <= 0) return;
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(width, h), wallMat);
    seg.rotation.y = -Math.PI / 2;
    seg.position.set(xPos, y, (zStart + zEnd) / 2);
    group.add(seg);
  };

  createWallSegment(0, -0.5, wallX, H, H/2); 
  createWallSegment(-1.4, -3.5, wallX, H, H/2); 
  createWallSegment(-6.5, -8.6, wallX, H, H/2); 
  createWallSegment(-9.5, -10, wallX, H, H/2); 

  // 2. 门逻辑
  const createDoor = (z) => {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.05, doorH, doorW), doorMat);
    door.position.set(wallX, doorH / 2, z);
    group.add(door);
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, doorW + 0.1), frameMat);
    topFrame.position.set(wallX, doorH + 0.025, z);
    group.add(topFrame);
    const doorWin = new THREE.Mesh(new THREE.PlaneGeometry(doorW * 0.4, 0.5), glassMat);
    doorWin.rotation.y = -Math.PI / 2;
    doorWin.position.set(wallX - 0.03, doorH * 0.7, z);
    group.add(doorWin);
    createWallSegment(z - doorW/2, z + doorW/2, wallX, H - doorH - 0.05, (H + doorH + 0.05)/2);
  };

  createDoor(-0.95); 
  createDoor(-9.05); 

  // 3. 飘窗逻辑 (Z: -3.5 ~ -6.5)
  const winW = 3.0;
  const winH = 1.6;
  const winY = 1.8;
  const winDepth = 0.4;
  
  const sill = new THREE.Mesh(new THREE.BoxGeometry(winDepth, 0.1, winW), new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.1 }));
  sill.position.set(wallX - winDepth/2, 1.0, -5.0);
  group.add(sill);
  
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
  glass.rotation.y = -Math.PI / 2;
  glass.position.set(wallX + winDepth, winY, -5.0);
  group.add(glass);

  const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(winDepth, winH), glassMat);
  sideGlass.position.set(wallX + winDepth/2, winY, -5.0 + winW/2);
  group.add(sideGlass);
  const sideGlass2 = sideGlass.clone();
  sideGlass2.position.z = -5.0 - winW/2;
  group.add(sideGlass2);

  const winExtenMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
  const winTop = new THREE.Mesh(new THREE.BoxGeometry(winDepth + 0.01, 0.05, winW + 0.01), winExtenMat);
  winTop.position.set(wallX + winDepth/2, winY + winH/2, -5.0);
  group.add(winTop);
  const winBottom = winTop.clone();
  winBottom.position.y = winY - winH/2;
  group.add(winBottom);

  createWallSegment(-3.5, -6.5, wallX, 1.0, 0.5); 
  createWallSegment(-3.5, -6.5, wallX, H - (winY + winH/2), (H + (winY + winH/2))/2);

  // 右侧风景
  const sceneCanvas = document.createElement('canvas');
  sceneCanvas.width = 1024; sceneCanvas.height = 512;
  const sCtx = sceneCanvas.getContext('2d');
  const grd = sCtx.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#4facfe'); grd.addColorStop(0.5, '#00f2fe'); grd.addColorStop(0.6, '#ffffff'); grd.addColorStop(0.61, '#96e6a1'); grd.addColorStop(1, '#d4fc79');
  sCtx.fillStyle = grd; sCtx.fillRect(0, 0, 1024, 512);
  sCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for(let i=0; i<6; i++) {
    const cx = Math.random() * 1024; const cy = Math.random() * 150; const cr = 25;
    sCtx.beginPath(); sCtx.arc(cx, cy, cr, 0, Math.PI * 2); sCtx.fill();
  }
  const sceneTex = new THREE.CanvasTexture(sceneCanvas);
  const scenery = new THREE.Mesh(new THREE.PlaneGeometry(D * 2, H * 2), new THREE.MeshBasicMaterial({ map: sceneTex, side: THREE.DoubleSide }));
  scenery.rotation.y = -Math.PI / 2;
  scenery.position.set(wallX + 8, H / 2, -D / 2); 
  group.add(scenery);

  parent.add(group);
}

/**
 * 窗户光照效果
 */
function createWindowLights(scene, W, H, D) {
  const windowCount = 3;
  const winSpacing = D / (windowCount + 1);

  // 模拟从左侧窗户射入的阳光
  const sunLight = new THREE.DirectionalLight(0xfff5e1, 0.4);
  sunLight.position.set(-15, 10, -5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.left = -10;
  sunLight.shadow.camera.right = 10;
  sunLight.shadow.camera.top = 10;
  sunLight.shadow.camera.bottom = -10;
  scene.add(sunLight);

  for (let i = 0; i < windowCount; i++) {
    const winZ = -(i + 1) * winSpacing;
    const light = new THREE.PointLight(0xffffee, 0.3, 10);
    light.position.set(-W / 2 + 0.1, 2.0, winZ);
    // 增加一点漫反射感，不投影（投影交给 Sunlight）
    scene.add(light);
  }
}

/**
 * 柜子（右墙靠后方）
 */
/**
 * 柜子（靠后墙一横排）
 */
function createCabinet(parent, W, D) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xa0784a }); // 棕色木柜
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x8a6535 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });

  const cabW = 1.0;
  const cabH = 1.2;
  const cabD = 0.5;
  const count = 8; // 放置8个柜子组成一排
  const totalW = count * cabW;
  const startX = -totalW / 2 + cabW / 2;
  const zPos = -cabD / 2 - 0.05; // 紧贴后墙 (Z=0)

  for (let i = 0; i < count; i++) {
    const group = new THREE.Group();
    const x = startX + i * cabW;

    // 柜体
    const body = new THREE.Mesh(new THREE.BoxGeometry(cabW, cabH, cabD), mat);
    body.position.set(x, cabH / 2, zPos);
    group.add(body);

    // 柜门分隔线
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.01, cabH - 0.1, cabD + 0.02), lineMat);
    line.position.set(x, cabH / 2, zPos);
    group.add(line);

    // 门把手
    const handleL = new THREE.Mesh(new THREE.SphereGeometry(0.02), handleMat);
    handleL.position.set(x - 0.1, cabH * 0.6, zPos + cabD / 2);
    group.add(handleL);
    
    const handleR = handleL.clone();
    handleR.position.x = x + 0.1;
    group.add(handleR);

    parent.add(group);
  }
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
  const wallX = W / 2 - 0.02;
  const zPos = -2.5; // 挪到后门与飘窗之间的实墙上，避免挂在玻璃上

  // 值日表底板
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.5), boardMat);
  board.position.set(wallX, 1.6, zPos);
  group.add(board);

  // 标题区域（红色横条）
  const titleMat = new THREE.MeshStandardMaterial({ color: 0xcc3333 });
  const title = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.48), titleMat);
  title.position.set(wallX, 1.9, zPos);
  group.add(title);

  // 表格线条（横线）
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
  for (let i = 0; i < 5; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.005, 0.48), lineMat);
    line.position.set(wallX, 1.78 - i * 0.12, zPos);
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
  const centerX = 5.4; // 向右移动，为更大的屏幕腾出空间
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
 * 校训文字（分块显示）
 */
function createSchoolMotto(parent, D) {
  const create3DText = (text, x) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // 增加画布宽度，防止文字边缘被切断
    canvas.width = 1024;
    canvas.height = 256;

    // 背景完全透明
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 文字样式
    const textColor = '#cc0000';
    ctx.fillStyle = textColor;
    // 稍微缩小字体比例，留出左右安全边距
    ctx.font = 'bold 160px "SimSun", "STSong", "Songti SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 描边加粗
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 6;
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const group = new THREE.Group();

    // 每一块文字的几何体尺寸 (加大宽度到 2.4，高度 0.6)
    const geometry = new THREE.PlaneGeometry(2.4, 0.6);
    
    // 采用“层叠法”实现镂空立体字效果
    const layers = 12;
    const depth = 0.05; 
    
    for (let i = 0; i < layers; i++) {
        const isFront = i === layers - 1;
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            color: isFront ? 0xffffff : 0x880000, 
            metalness: 0.2,
            roughness: 0.5,
            alphaTest: 0.1
        });

        const layerMesh = new THREE.Mesh(geometry, material);
        layerMesh.position.z = (i / layers) * depth;
        group.add(layerMesh);
    }

    group.position.set(x, 3.0, -D + 0.01);
    parent.add(group);
  };

  // 调整位置，给加宽后的文字留出空间
  create3DText('爱 国 敬 业', -1.5);
  create3DText('求 实 创 新', 1.5);
}

/**
 * 书柜（位于左前角，放满字典）
 */
function createBookshelf(parent, W, D) {
  const group = new THREE.Group();
  const shelfX = -W / 2 + 0.6; // 靠左墙
  const shelfZ = -D + 0.35;     // 靠前墙
  
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee }); // 白色柜子
  
  const shelfW = 1.0;
  const shelfH = 2.0;
  const shelfD = 0.3;
  const thickness = 0.04;

  // 1. 书柜框架
  const frameGroup = new THREE.Group();
  
  // 侧板 (左、右)
  const sideGeo = new THREE.BoxGeometry(thickness, shelfH, shelfD);
  const leftSide = new THREE.Mesh(sideGeo, shelfMat);
  leftSide.position.set(-shelfW/2, shelfH/2, 0);
  frameGroup.add(leftSide);
  
  const rightSide = new THREE.Mesh(sideGeo, shelfMat);
  rightSide.position.set(shelfW/2, shelfH/2, 0);
  frameGroup.add(rightSide);
  
  // 顶底板
  const horGeo = new THREE.BoxGeometry(shelfW + thickness, thickness, shelfD);
  const bottom = new THREE.Mesh(horGeo, shelfMat);
  bottom.position.set(0, thickness/2, 0);
  frameGroup.add(bottom);
  
  const top = new THREE.Mesh(horGeo, shelfMat);
  top.position.set(0, shelfH - thickness/2, 0);
  frameGroup.add(top);
  
  // 背板
  const back = new THREE.Mesh(new THREE.BoxGeometry(shelfW + thickness, shelfH, 0.02), shelfMat);
  back.position.set(0, shelfH/2, -shelfD/2 + 0.01);
  frameGroup.add(back);
  
  // 层级 (增加4层)
  const layerCount = 4;
  const layerSpacing = (shelfH - thickness) / (layerCount + 1);
  for(let i=1; i<=layerCount; i++) {
    const layer = new THREE.Mesh(new THREE.BoxGeometry(shelfW, thickness, shelfD - 0.02), shelfMat);
    layer.position.set(0, i * layerSpacing, 0.01);
    frameGroup.add(layer);
    
    // 在每一层放满书
    fillShelfWithBooks(frameGroup, i * layerSpacing + thickness/2, shelfW, shelfD);
  }

  group.add(frameGroup);
  group.position.set(shelfX, 0, shelfZ);
  parent.add(group);
}

/**
 * 在书架层上填满字典
 */
function fillShelfWithBooks(group, yPos, shelfW, shelfD) {
  const bookW = 0.06; // 字典比较厚
  const bookH = 0.28; // 高度
  const bookD = 0.22; // 深度
  const availableW = shelfW - 0.1;
  const bookCount = Math.floor(availableW / (bookW + 0.01));
  
  // 经典的字典配色：标准中国红、藏青蓝、深森林绿
  const colors = [
    0xb22222, // Firebrick Red (经典的硬壳字典红)
    0x1a237e, // Indigo Blue (稳重的深蓝色)
    0x1b5e20  // Dark Green (标准的工具书绿色)
  ]; 
  
  for(let i=0; i<bookCount; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const bookMat = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.7, // 降低反光，增加纸质感
      metalness: 0.1 
    });
    const book = new THREE.Mesh(new THREE.BoxGeometry(bookW, bookH, bookD), bookMat);
    
    // 随机微调位置和轻微倾斜，模拟真实摆放
    const x = -availableW/2 + i * (bookW + 0.01) + bookW/2;
    const tilt = (Math.random() - 0.5) * 0.04;
    
    book.position.set(x, yPos + bookH/2, 0.02);
    book.rotation.z = tilt;
    group.add(book);
    
    // 书脊加一个深金色的标签，模拟烫金工艺
    const spineMat = new THREE.MeshStandardMaterial({ 
      color: 0xc5a059, // 深金色/古铜色
      metalness: 0.5,
      roughness: 0.3
    });
    const spine = new THREE.Mesh(new THREE.BoxGeometry(bookW * 0.7, bookH * 0.15, 0.01), spineMat); 
    spine.position.set(x, yPos + bookH * 0.75, bookD/2 + 0.006);
    spine.rotation.z = tilt;
    group.add(spine);
  }
}

/**
 * 添加广播喇叭
 */
function addBroadcasters(parent, W, D) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 }); // 浅灰色外壳
  const grillMat = new THREE.MeshStandardMaterial({ color: 0x444444 }); // 深灰色网罩

  const createSpeaker = (x) => {
    const sGroup = new THREE.Group();
    
    // 喇叭箱体
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.2), bodyMat);
    sGroup.add(body);
    
    // 正面网罩 (稍微出来一点点)
    const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.38), grillMat);
    grill.position.z = 0.101;
    sGroup.add(grill);

    // 支架 (连接墙壁)
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.1), bodyMat);
    bracket.position.z = -0.12;
    sGroup.add(bracket);

    sGroup.position.set(x, 3.1, -D + 0.15);
    // 稍微向下倾斜，对准下方学生
    sGroup.rotation.x = Math.PI / 10;
    
    group.add(sGroup);
  };

  // 放在校训的两侧，距离稍远 (约 4m 处)
  createSpeaker(-4.0);
  createSpeaker(4.0);

  parent.add(group);
}
