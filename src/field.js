
// ============================================
// field.js - بناء الملعب الكامل لـ Kings League MENA
// ============================================
// يحتوي على:
// - الأرضية والعشب الصناعي مع شرائط
// - كل خطوط الملعب الرسمية (حدود، جزاء، منتصف)
// - الحواجز الشفافة المميزة (Kings League signature)
// - المرمى المصغر مع الشبكات
// - المدرجات مع مقاعد ملونة
// - الإضاءة الاحترافية (Directional + Spotlights)
// - الشاشات LED ولوحات الإعلانات
// - هيكل سقف الصالة
// ============================================

import * as THREE from 'three';
import { FIELD } from './config.js';

// ============================================
// 1. بناء الأرضية والعشب والخطوط
// ============================================
export function buildField(scene) {
    // ---------- الأرضية الخارجية (أرضية الصالة) ----------
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a1a,
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // ---------- العشب الصناعي الرئيسي ----------
    const grassGeo = new THREE.PlaneGeometry(FIELD.length, FIELD.width);
    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x1a7a1a,
        roughness: 0.85,
        metalness: 0.05
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0;
    grass.receiveShadow = true;
    scene.add(grass);

    // ---------- شرائط العشب (نمط كلاسيكي) ----------
    const stripeCount = 10;
    const stripeWidth = FIELD.length / stripeCount;
    const stripeMat = new THREE.MeshStandardMaterial({
        color: 0x229922,
        roughness: 0.85,
        transparent: true,
        opacity: 0.55
    });

    for (let i = 0; i < stripeCount; i++) {
        if (i % 2 === 0) {
            const stripeGeo = new THREE.PlaneGeometry(stripeWidth, FIELD.width);
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(
                -FIELD.length / 2 + stripeWidth / 2 + i * stripeWidth,
                0.005,
                0
            );
            stripe.receiveShadow = true;
            scene.add(stripe);
        }
    }

    // ---------- خطوط الملعب ----------
    buildLines(scene);
}

// ============================================
// 2. خطوط الملعب الكاملة
// ============================================
function buildLines(scene) {
    const lineMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        toneMapped: false
    });
    
    const L = FIELD.length;
    const W = FIELD.width;
    const T = FIELD.lineThickness;

    // دالة مساعدة لإضافة خط أفقي
    const addLine = (x, z, width, depth) => {
        const geo = new THREE.PlaneGeometry(width, depth);
        const line = new THREE.Mesh(geo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(x, 0.015, z);
        scene.add(line);
    };

    // ---------- الحدود الخارجية ----------
    addLine(0, -W / 2, L, T);   // خط علوي
    addLine(0, W / 2, L, T);    // خط سفلي
    addLine(-L / 2, 0, T, W);   // خط يسار
    addLine(L / 2, 0, T, W);    // خط يمين

    // ---------- خط المنتصف ----------
    addLine(0, 0, T, W);

    // ---------- دائرة المنتصف ----------
    const circleGeo = new THREE.RingGeometry(3 - T, 3, 64);
    const circle = new THREE.Mesh(circleGeo, lineMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.015;
    scene.add(circle);

    // ---------- نقطة المنتصف ----------
    const centerDot = new THREE.Mesh(
        new THREE.CircleGeometry(0.2, 16),
        lineMat
    );
    centerDot.rotation.x = -Math.PI / 2;
    centerDot.position.y = 0.015;
    scene.add(centerDot);

    // ---------- منطقتا الجزاء ----------
    buildPenaltyArea(scene, 'left', lineMat);
    buildPenaltyArea(scene, 'right', lineMat);

    // ---------- أقواس الزوايا ----------
    buildCornerArcs(scene, lineMat);
}

// منطقة الجزاء لجهة معينة
function buildPenaltyArea(scene, side, lineMat) {
    const L = FIELD.length;
    const W = FIELD.width;
    const T = FIELD.lineThickness;
    const xDir = side === 'left' ? -1 : 1;
    const x0 = xDir * L / 2;

    const addLine = (x, z, width, depth) => {
        const geo = new THREE.PlaneGeometry(width, depth);
        const line = new THREE.Mesh(geo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(x, 0.015, z);
        scene.add(line);
    };

    // خط عرض المنطقة (الموازي للمرمى)
    addLine(
        x0 - xDir * FIELD.penaltyDepth,
        0,
        T,
        FIELD.penaltyWidth
    );

    // خطا الطول للمنطقة
    addLine(
        x0 - xDir * FIELD.penaltyDepth / 2,
        -FIELD.penaltyWidth / 2,
        FIELD.penaltyDepth,
        T
    );
    addLine(
        x0 - xDir * FIELD.penaltyDepth / 2,
        FIELD.penaltyWidth / 2,
        FIELD.penaltyDepth,
        T
    );

    // نقطة الجزاء
    const spot = new THREE.Mesh(
        new THREE.CircleGeometry(0.15, 16),
        lineMat
    );
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(x0 - xDir * FIELD.penaltySpot, 0.015, 0);
    scene.add(spot);

    // قوس منطقة الجزاء (خارج المنطقة)
    const arcRadius = 2.5;
    const arcThetaStart = side === 'left' ? Math.PI * 1.5 : Math.PI * 0.5;
    const arcThetaLength = Math.PI;
    
    const arcGeo = new THREE.RingGeometry(
        arcRadius - T,
        arcRadius,
        32, 1,
        arcThetaStart,
        arcThetaLength
    );
    const arc = new THREE.Mesh(arcGeo, lineMat);
    arc.rotation.x = -Math.PI / 2;
    arc.position.set(x0 - xDir * FIELD.penaltySpot, 0.015, 0);
    scene.add(arc);
}

// أقواس الزوايا (اختياري - تكمل الشكل الرسمي)
function buildCornerArcs(scene, lineMat) {
    const L = FIELD.length;
    const W = FIELD.width;
    const T = FIELD.lineThickness;
    const radius = 1;

    const corners = [
        { x: -L/2, z: -W/2, start: 0 },
        { x:  L/2, z: -W/2, start: Math.PI / 2 },
        { x:  L/2, z:  W/2, start: Math.PI },
        { x: -L/2, z:  W/2, start: Math.PI * 1.5 },
    ];

    corners.forEach(c => {
        const arcGeo = new THREE.RingGeometry(
            radius - T,
            radius,
            16, 1,
            c.start,
            Math.PI / 2
        );
        const arc = new THREE.Mesh(arcGeo, lineMat);
        arc.rotation.x = -Math.PI / 2;
        arc.position.set(c.x, 0.015, c.z);
        scene.add(arc);
    });
}

// ============================================
// 3. الحواجز الشفافة (Kings League signature)
// ============================================
export function buildWalls(scene) {
    // مادة الحواجز (زجاجي شفاف)
    const wallMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.18,
        roughness: 0.1,
        metalness: 0.2,
        transmission: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    // مادة الإطار المعدني
    const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.85
    });

    const L = FIELD.length;
    const W = FIELD.width;
    const H = FIELD.wallHeight;
    const wallThick = 0.06;

    // تعريف الأربع حواجز
    const walls = [
        // الجانب البعيد (z = -W/2)
        { w: L, h: H, d: wallThick, x: 0, y: H/2, z: -W/2 },
        // الجانب القريب (z = +W/2)
        { w: L, h: H, d: wallThick, x: 0, y: H/2, z: W/2 },
        // الجانب الأيسر (x = -L/2)
        { w: wallThick, h: H, d: W, x: -L/2, y: H/2, z: 0 },
        // الجانب الأيمن (x = +L/2)
        { w: wallThick, h: H, d: W, x: L/2, y: H/2, z: 0 },
    ];

    walls.forEach(w => {
        // الجسم الزجاجي
        const geo = new THREE.BoxGeometry(w.w, w.h, w.d);
        const wall = new THREE.Mesh(geo, wallMat);
        wall.position.set(w.x, w.y, w.z);
        scene.add(wall);

        // الإطار العلوي الأفقي
        const frameGeo = new THREE.BoxGeometry(
            w.w + 0.1,
            0.12,
            w.d === wallThick ? 0.15 : w.d + 0.1
        );
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(w.x, H + 0.06, w.z);
        frame.castShadow = true;
        scene.add(frame);

        // الإطار السفلي
        const bottomFrameGeo = new THREE.BoxGeometry(
            w.w + 0.1,
            0.08,
            w.d === wallThick ? 0.15 : w.d + 0.1
        );
        const bottomFrame = new THREE.Mesh(bottomFrameGeo, frameMat);
        bottomFrame.position.set(w.x, 0.04, w.z);
        scene.add(bottomFrame);
    });

    // أعمدة في الزوايا الأربع
    const corners = [
        [-L/2, -W/2], [L/2, -W/2],
        [-L/2, W/2], [L/2, W/2]
    ];

    corners.forEach(([x, z]) => {
        const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, H, 8);
        const pillar = new THREE.Mesh(pillarGeo, frameMat);
        pillar.position.set(x, H/2, z);
        pillar.castShadow = true;
        scene.add(pillar);
    });

    // أعمدة داعمة إضافية على الجوانب الطويلة
    const sideCount = 4;
    for (let i = 0; i <= sideCount; i++) {
        const xPos = -L/2 + (L / sideCount) * i;
        
        // على الجانبين البعيد والقريب
        if (i > 0 && i < sideCount) {
            [-W/2, W/2].forEach(z => {
                const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, H, 6);
                const pillar = new THREE.Mesh(pillarGeo, frameMat);
                pillar.position.set(xPos, H/2, z);
                scene.add(pillar);
            });
        }
    }
}

// ============================================
// 4. المرمى مع الشبكات
// ============================================
export function buildGoals(scene) {
    // مادة القوائم (أبيض لامع)
    const goalMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.4,
        emissive: 0x333333,
        emissiveIntensity: 0.15
    });

    // مادة الشبكة (شبكة بيضاء شبه شفافة)
    const netMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        wireframe: true
    });

    const goals = {};

    const buildGoal = (side) => {
        const xDir = side === 'left' ? -1 : 1;
        const xPos = xDir * FIELD.length / 2;
        
        const goalGroup = new THREE.Group();
        goalGroup.name = `goal-${side}`;
        
        const postRadius = 0.08;
        const gw = FIELD.goalWidth;
        const gh = FIELD.goalHeight;
        const netDepth = 1.0;

        // ---------- القائمان العموديان ----------
        const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, gh, 12);
        
        const postTop = new THREE.Mesh(postGeo, goalMat);
        postTop.position.set(0, gh/2, -gw/2);
        postTop.castShadow = true;
        goalGroup.add(postTop);
        
        const postBottom = new THREE.Mesh(postGeo, goalMat);
        postBottom.position.set(0, gh/2, gw/2);
        postBottom.castShadow = true;
        goalGroup.add(postBottom);

        // ---------- العارضة الأفقية ----------
        const crossGeo = new THREE.CylinderGeometry(postRadius, postRadius, gw, 12);
        const cross = new THREE.Mesh(crossGeo, goalMat);
        cross.rotation.x = Math.PI / 2;
        cross.position.set(0, gh, 0);
        cross.castShadow = true;
        goalGroup.add(cross);

        // ---------- الشبكة الخلفية ----------
        const netBackGeo = new THREE.PlaneGeometry(gw, gh, 12, 6);
        const netBack = new THREE.Mesh(netBackGeo, netMat);
        netBack.position.set(xDir * -netDepth, gh/2, 0);
        goalGroup.add(netBack);

        // ---------- الشبكات الجانبية ----------
        const netSideGeo = new THREE.PlaneGeometry(netDepth, gh, 4, 6);
        
        const netSideLeft = new THREE.Mesh(netSideGeo, netMat);
        netSideLeft.position.set(xDir * -netDepth/2, gh/2, -gw/2);
        netSideLeft.rotation.y = Math.PI / 2;
        goalGroup.add(netSideLeft);
        
        const netSideRight = netSideLeft.clone();
        netSideRight.position.z = gw/2;
        goalGroup.add(netSideRight);

        // ---------- الشبكة العلوية ----------
        const netTopGeo = new THREE.PlaneGeometry(netDepth, gw, 4, 12);
        const netTop = new THREE.Mesh(netTopGeo, netMat);
        netTop.rotation.x = Math.PI / 2;
        netTop.position.set(xDir * -netDepth/2, gh, 0);
        goalGroup.add(netTop);

        // ---------- تفاصيل القوائم السفلية (قواعد) ----------
        const baseGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.15, 8);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.5
        });
        
        [-gw/2, gw/2].forEach(z => {
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.set(0, 0.075, z);
            goalGroup.add(base);
        });

        goalGroup.position.x = xPos;
        scene.add(goalGroup);

        return goalGroup;
    };

    goals.home = buildGoal('left');
    goals.away = buildGoal('right');

    return goals;
}

// ============================================
// 5. المدرجات
// ============================================
export function buildStands(scene) {
    // مادة المدرجات (رمادي داكن)
    const standMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.9,
        metalness: 0.1
    });

    // ألوان المقاعد (مستوحاة من Kings League)
    const seatColors = [
        0xEAB308,  // ذهبي
        0x1E40AF,  // أزرق
        0xDC2626,  // أحمر
        0x10B981,  // أخضر
        0x7C3AED,  // بنفسجي
        0xF97316   // برتقالي
    ];

    const L = FIELD.length;
    const W = FIELD.width;

    // دالة بناء صف مدرجات
    const buildStandRow = (sideZ, rows, offsetFromField, length, offsetX = 0) => {
        const stepDepth = 1.0;
        const stepHeight = 0.55;

        for (let r = 0; r < rows; r++) {
            // ---------- الصف (المقعد الطويل) ----------
            const stepGeo = new THREE.BoxGeometry(length, stepHeight, stepDepth);
            const step = new THREE.Mesh(stepGeo, standMat);
            step.position.set(
                offsetX,
                stepHeight / 2 + r * stepHeight,
                sideZ + Math.sign(sideZ) * (offsetFromField + r * stepDepth + stepDepth/2)
            );
            step.castShadow = true;
            step.receiveShadow = true;
            scene.add(step);

            // ---------- المقاعد الفردية الملونة ----------
            const seatSpacing = 1.0;
            const seatCount = Math.floor(length / seatSpacing);
            
            for (let i = 0; i < seatCount; i++) {
                // ليس كل مقعد ملوّن (عشوائي واقعي)
                if (Math.random() > 0.65) {
                    const color = seatColors[Math.floor(Math.random() * seatColors.length)];
                    const seatGeo = new THREE.BoxGeometry(0.65, 0.14, 0.55);
                    const seatMat = new THREE.MeshStandardMaterial({
                        color: color,
                        emissive: color,
                        emissiveIntensity: 0.12,
                        roughness: 0.7
                    });
                    
                    const seat = new THREE.Mesh(seatGeo, seatMat);
                    seat.position.set(
                        offsetX - length/2 + i * seatSpacing + 0.5,
                        r * stepHeight + stepHeight + 0.07,
                        sideZ + Math.sign(sideZ) * (offsetFromField + r * stepDepth + stepDepth/2)
                    );
                    scene.add(seat);
                }
            }
        }
    };

    // ---------- المدرجات الرئيسية على الجانبين الطويلين ----------
    // الجانب البعيد (خلف الملعب من منظور الكاميرا) - 6 صفوف
    buildStandRow(
        -W/2 - 1.5,     // z البداية
        6,              // عدد الصفوف
        0,              // إزاحة إضافية
        L + 6           // الطول
    );

    // الجانب القريب (أمام الملعب) - 3 صفوف فقط (حتى لا تحجب الرؤية)
    buildStandRow(
        W/2 + 1.5,
        3,
        0,
        L + 6
    );

    // ---------- المدرجات خلف المرمى (اختيارية) ----------
    // مدرجات صغيرة خلف مرمى اليسار
    buildStandRow(
        -W/2 - 1.5,
        4,
        0,
        6,
        -L/2 - 3.5
    );
    
    // مدرجات صغيرة خلف مرمى اليمين
    buildStandRow(
        -W/2 - 1.5,
        4,
        0,
        6,
        L/2 + 3.5
    );
}

// ============================================
// 6. الإضاءة الاحترافية
// ============================================
export function buildLights(scene) {
    // ---------- إضاءة محيطة خفيفة ----------
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambient);

    // ---------- إضاءة نصف كروية (لمحاكاة سماء الصالة) ----------
    const hemisphere = new THREE.HemisphereLight(0x88aaff, 0x111122, 0.7);
    scene.add(hemisphere);

    // ---------- الضوء الرئيسي (من فوق بتجاهل) ----------
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.1);
    mainLight.position.set(10, 40, 15);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    mainLight.shadow.camera.left = -50;
    mainLight.shadow.camera.right = 50;
    mainLight.shadow.camera.top = 50;
    mainLight.shadow.camera.bottom = -50;
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.bias = -0.0005;
    mainLight.shadow.normalBias = 0.02;
    scene.add(mainLight);

    // ---------- 4 كشافات في الزوايا (Spotlights) ----------
    const spotPositions = [
        [-25, 22, -18],
        [ 25, 22, -18],
        [-25, 22,  18],
        [ 25, 22,  18]
    ];

    // مادة جسم الكشاف
    const housingMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.9,
        roughness: 0.2
    });

    // مادة الوجه المضيء
    const faceMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        toneMapped: false
    });

    spotPositions.forEach(([x, y, z]) => {
        // ---------- الكشاف نفسه ----------
        const spot = new THREE.SpotLight(
            0xffffff,
            1.4,
            90,               // المدى
            Math.PI / 4,      // زاوية المخروط
            0.5,              // Penumbra
            1                 // Decay
        );
        spot.position.set(x, y, z);
        spot.target.position.set(0, 0, 0);
        spot.castShadow = true;
        spot.shadow.mapSize.set(1024, 1024);
        spot.shadow.bias = -0.0005;
        scene.add(spot);
        scene.add(spot.target);

        // ---------- جسم الكشاف المرئي ----------
        const housingGeo = new THREE.BoxGeometry(2, 0.8, 1.5);
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.position.set(x, y, z);
        housing.lookAt(0, 0, 0);
        housing.castShadow = true;
        scene.add(housing);

        // ---------- الوجه المضيء ----------
        const faceGeo = new THREE.PlaneGeometry(1.8, 0.6);
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.copy(housing.position);
        face.lookAt(0, 0, 0);
        face.translateZ(0.76);
        scene.add(face);

        // ---------- Point Light صغير للتوهج ----------
        const glowLight = new THREE.PointLight(0xfff8dc, 0.4, 5);
        glowLight.position.set(x, y, z);
        scene.add(glowLight);
    });
}

// ============================================
// 7. التفاصيل المحيطية (شاشات LED، إعلانات، سقف)
// ============================================
export function buildAmbientDetails(scene) {
    buildLEDScreens(scene);
    buildCeilingStructure(scene);
    buildBannerAds(scene);
}

// شاشات LED على الحواجز
function buildLEDScreens(scene) {
    const L = FIELD.length;
    const W = FIELD.width;
    const screenColors = [
        0xEAB308,  // ذهبي
        0x1E40AF,  // أزرق
        0xDC2626,  // أحمر
        0x7C3AED,  // بنفسجي
        0x10B981   // أخضر
    ];

    const addScreen = (x, y, z, rotY, width, color) => {
        const screenGeo = new THREE.PlaneGeometry(width, 0.7);
        const screenMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            toneMapped: false
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(x, y, z);
        screen.rotation.y = rotY;
        scene.add(screen);

        // إضاءة ملونة صغيرة للشاشة
        const pLight = new THREE.PointLight(color, 0.3, 8);
        pLight.position.set(x, y + 0.6, z);
        scene.add(pLight);
    };

    // شاشات على الجانبين الطويلين
    const screenCount = 8;
    for (let i = 0; i < screenCount; i++) {
        const x = -L/2 + 4 + i * (L - 8) / (screenCount - 1);
        const color = screenColors[i % screenColors.length];

        // الجانب البعيد
        addScreen(x, FIELD.wallHeight - 0.4, -W/2 + 0.05, 0, 3, color);
        
        // الجانب القريب
        const color2 = screenColors[(i + 3) % screenColors.length];
        addScreen(x, FIELD.wallHeight - 0.4, W/2 - 0.05, Math.PI, 3, color2);
    }

    // شاشات صغيرة على الجانبين القصيرين
    const shortScreens = 3;
    for (let i = 0; i < shortScreens; i++) {
        const z = -W/2 + 4 + i * (W - 8) / (shortScreens - 1);
        const color1 = screenColors[(i + 2) % screenColors.length];
        const color2 = screenColors[(i + 5) % screenColors.length];
        
        // الجانب الأيسر
        addScreen(-L/2 + 0.05, FIELD.wallHeight - 0.4, z, Math.PI / 2, 2.5, color1);
        
        // الجانب الأيمن
        addScreen(L/2 - 0.05, FIELD.wallHeight - 0.4, z, -Math.PI / 2, 2.5, color2);
    }
}

// هيكل السقف (جسور معدنية)
function buildCeilingStructure(scene) {
    const L = FIELD.length;
    const W = FIELD.width;

    // مادة معدنية داكنة
    const metalMat = new THREE.MeshStandardMaterial({
        color: 0x0f0f18,
        metalness: 0.75,
        roughness: 0.45
    });

    // ---------- عوارض طولية (3 عوارض) ----------
    const beamLength = L + 20;
    const beamGeo = new THREE.BoxGeometry(beamLength, 0.3, 0.3);

    for (let i = -1; i <= 1; i++) {
        const beam = new THREE.Mesh(beamGeo, metalMat);
        beam.position.set(0, 26, i * 14);
        beam.castShadow = false;
        scene.add(beam);
    }

    // ---------- عوارض عرضية (7 عوارض) ----------
    const crossBeamLength = W + 20;
    const crossBeamGeo = new THREE.BoxGeometry(0.3, 0.3, crossBeamLength);

    for (let i = -3; i <= 3; i++) {
        const crossBeam = new THREE.Mesh(crossBeamGeo, metalMat);
        crossBeam.position.set(i * 8, 27, 0);
        scene.add(crossBeam);
    }

    // ---------- شبكة رقيقة أعلى الملعب ----------
    const gridMat = new THREE.MeshBasicMaterial({
        color: 0x1a1a2e,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const gridGeo = new THREE.PlaneGeometry(L + 15, W + 15, 15, 10);
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = Math.PI / 2;
    grid.position.y = 28;
    scene.add(grid);

    // ---------- أنوار صغيرة على العوارض (ambient light points) ----------
    for (let i = -2; i <= 2; i++) {
        for (let j = -1; j <= 1; j++) {
            const tinyLight = new THREE.PointLight(0xfff8dc, 0.15, 15);
            tinyLight.position.set(i * 12, 25, j * 10);
            scene.add(tinyLight);
        }
    }
}

// لوحات إعلانية
function buildBannerAds(scene) {
    const L = FIELD.length;
    const W = FIELD.width;

    // خلف المرامي - لوحات كبيرة
    const bannerMat = new THREE.MeshBasicMaterial({
        color: 0x0a0a14,
        transparent: true,
        opacity: 0.9
    });

    // لوحة خلف المرمى الأيسر
    const bannerLeftGeo = new THREE.PlaneGeometry(W, 1.2);
    const bannerLeft = new THREE.Mesh(bannerLeftGeo, bannerMat);
    bannerLeft.position.set(-L/2 - 3, 0.6, 0);
    bannerLeft.rotation.y = Math.PI / 2;
    scene.add(bannerLeft);

    // لوحة خلف المرمى الأيمن
    const bannerRight = bannerLeft.clone();
    bannerRight.position.x = L/2 + 3;
    bannerRight.rotation.y = -Math.PI / 2;
    scene.add(bannerRight);

    // إضافة حدود ذهبية للوحات
    const borderMat = new THREE.MeshBasicMaterial({
        color: 0xEAB308,
        toneMapped: false
    });

    // حدود اللوحة اليسرى
    const borders = [
        // علوي
        { w: W, h: 0.05, d: 0.02, x: -L/2 - 3, y: 1.2, z: 0, rotY: Math.PI/2 },
        // سفلي
        { w: W, h: 0.05, d: 0.02, x: -L/2 - 3, y: 0, z: 0, rotY: Math.PI/2 },
    ];

    borders.forEach(b => {
        const bGeo = new THREE.PlaneGeometry(b.w, b.h);
        const border = new THREE.Mesh(bGeo, borderMat);
        border.position.set(b.x, b.y, b.z);
        border.rotation.y = b.rotY;
        scene.add(border);
    });

    // نفس للوحة اليمنى
    borders.forEach(b => {
        const bGeo = new THREE.PlaneGeometry(b.w, b.h);
        const border = new THREE.Mesh(bGeo, borderMat);
        border.position.set(b.x === -L/2 - 3 ? L/2 + 3 : b.x, b.y, b.z);
        border.rotation.y = -Math.PI / 2;
        scene.add(border);
    });
}

// ============================================
// 8. دالة رئيسية لبناء كل الملعب
// ============================================
export function buildAllField(scene) {
    console.log('🏟️ بناء الملعب الكامل...');
    
    buildField(scene);
    console.log('  ✅ الأرضية والعشب والخطوط');
    
    buildWalls(scene);
    console.log('  ✅ الحواجز الشفافة');
    
    const goals = buildGoals(scene);
    console.log('  ✅ المرمى');
    
    buildStands(scene);
    console.log('  ✅ المدرجات');
    
    buildLights(scene);
    console.log('  ✅ الإضاءة');
    
    buildAmbientDetails(scene);
    console.log('  ✅ التفاصيل المحيطية');
    
    console.log('🏟️ اكتمل بناء الملعب!');
    
    return {
        goals,
        // يمكن إرجاع عناصر أخرى للتفاعل لاحقاً
    };
}
