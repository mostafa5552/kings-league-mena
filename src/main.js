import * as THREE from 'three';
import { initScene } from './scene.js';
import { Match } from './match.js';
import { CameraManager } from './camera.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';
import { TEAMS, FIELD, PLAYER_CONFIG, MATCH_RULES } from './config.js';

// ============================================
// متغيرات عالمية
// ============================================
let scene, renderer, clock;
let cameraManager;
let match;
let controls;
let ui;

let currentPlayer = null;         // اللاعب الذي يتحكم به المستخدم
let controlledTeam = null;        // الفريق الحالي
let lastSwitchTime = 0;

// ============================================
// قفل الوضع الأفقي
// ============================================
async function lockLandscape() {
    try {
        if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape');
        }
    } catch (e) {}
}

// ============================================
// التهيئة
// ============================================
async function init() {
    await lockLandscape();

    // إعداد المشهد
    const sceneData = initScene();
    scene = sceneData.scene;
    renderer = sceneData.renderer;
    clock = sceneData.clock;

    // بناء الملعب
    await buildField();

    // الكاميرا
    cameraManager = new CameraManager(window.innerWidth / window.innerHeight);

    // اختيار الفرق (تجربة: RA2 ضد DR7)
    const homeId = 'RA2';
    const awayId = 'DR7';
    const homeData = TEAMS[homeId];
    const awayData = TEAMS[awayId];

    // UI
    ui = new UI();
    ui.setTeams(homeData, awayData);
    ui.showGameHUD();

    // المباراة
    match = new Match(scene, homeId, awayId, homeData, awayData);
    match.start();

    // ربط الأحداث
    match.onMinuteChanged = (minute) => {
        ui.updateTime(minute, match.currentSecond, match.half);
    };
    match.onGoalScored = (data) => {
        ui.updateScore(match.homeTeam, match.awayTeam);
        ui.showToast(`⚽ ${data.multiplier > 1 ? `x${data.multiplier} ` : ''}هدف!`);
    };
    match.onColoredBall = (active) => {
        ui.setColoredBall(active);
        if (active) ui.showToast('🌟 كرة ملونة! كل هدف = 2');
    };
    match.onDiceRoll = (value) => {
        ui.showToast(`🎲 النرد: ${value}`);
    };
    match.onHalfEnd = (half) => {
        ui.showToast('⏸️ نهاية الشوط الأول');
    };
    match.onMatchEnd = (data) => {
        const winner = data.winner === 'home' ? homeData.name :
                       data.winner === 'away' ? awayData.name : 'تعادل';
        ui.showToast(`🏆 انتهت! ${winner}`, 5000);
    };

    // التحكم
    controls = new Controls();

    // اختيار اللاعب الأول (المستخدم يتحكم في فريق home دائماً)
    controlledTeam = match.homeTeam;
    selectNewPlayer();

    // إخفاء التحميل
    document.getElementById('loading').classList.add('hidden');

    // زر الأسلحة
    document.getElementById('btn-weapons').addEventListener('click', () => {
        const isOpen = isWeaponsWindowOpen();
        const teamWeapons = [WEAPONS.PENALTY, WEAPONS.SHOOTOUT, WEAPONS.DOUBLE_GOAL]; // تجربة
        ui.showWeaponsPanel(controlledTeam, teamWeapons, isOpen, (weapon) => {
            match.useWeapon(controlledTeam, weapon.id);
        });
    });

    // بدء الحلقة
    animate();
}

// ============================================
// هل يمكن استخدام الأسلحة الآن؟
// ============================================
function isWeaponsWindowOpen() {
    const m = match.currentMinute;
    if (match.half === 1) {
        return m >= MATCH_RULES.weaponsOpenFirstHalf && 
               m < MATCH_RULES.weaponsCloseFirstHalf;
    } else {
        return m >= MATCH_RULES.weaponsOpenSecondHalf && 
               m < MATCH_RULES.weaponsCloseSecondHalf;
    }
}

// ============================================
// اختيار لاعب جديد للتحكم
// ============================================
function selectNewPlayer() {
    if (!controlledTeam) return;
    
    // اختر اللاعب الأقرب للكرة (غير الحارس)
    const closest = controlledTeam.getClosestPlayerTo(match.ball.position);
    
    if (closest && closest !== currentPlayer) {
        if (currentPlayer) currentPlayer.setSelected(false);
        currentPlayer = closest;
        currentPlayer.setSelected(true);
    }
}

// ============================================
// تبديل اللاعب
// ============================================
function switchPlayer() {
    const now = performance.now();
    if (now - lastSwitchTime < 300) return; // منع السبام
    lastSwitchTime = now;

    const active = controlledTeam.getActivePlayers().filter(p => !p.isGK && p !== currentPlayer);
    if (active.length === 0) return;
    
    // اختر الأقرب للكرة من غير الحالي
    let best = active[0];
    let bestDist = best.distanceTo(match.ball.position);
    
    for (const p of active) {
        const d = p.distanceTo(match.ball.position);
        if (d < bestDist) {
            bestDist = d;
            best = p;
        }
    }
    
    if (currentPlayer) currentPlayer.setSelected(false);
    currentPlayer = best;
    currentPlayer.setSelected(true);
}

// ============================================
// التعامل مع أزرار الأكشن
// ============================================
function handleActionButtons(dt) {
    if (!currentPlayer) return;

    // زر 1: جري
    if (controls.isPressed(1)) {
        currentPlayer.isSprinting = true;
    } else {
        currentPlayer.isSprinting = false;
    }

    // زر 2
    if (controls.wasJustPressed(2)) {
        if (controls.mode === 'attack') {
            // تسديد
            shootBall();
        } else {
            // تبديل اللاعب
            switchPlayer();
        }
    }

    // زر 3
    if (controls.wasJustPressed(3)) {
        if (controls.mode === 'attack') {
            // تمرير
            passBall();
        } else {
            // قطع الكرة
            interceptBall();
        }
    }

    // زر 4
    if (controls.isPressed(4)) {
        if (controls.mode === 'attack') {
            // مهارات (تجربة: دوران سريع)
            currentPlayer.velocity.multiplyScalar(1.05);
        } else {
            // ضغط متواصل (يزيد السرعة قليلاً ويضغط على الخصم)
            currentPlayer.velocity.multiplyScalar(1.03);
        }
    }
}

// ============================================
// تسديد
// ============================================
function shootBall() {
    if (!currentPlayer) return;
    
    const ballDist = currentPlayer.distanceTo(match.ball.position);
    if (ballDist > 1.5) return; // بعيد عن الكرة
    
    const goalX = controlledTeam.attackDir * FIELD.length / 2;
    const goal = new THREE.Vector3(goalX, 0, 0);
    const dir = new THREE.Vector3().subVectors(goal, match.ball.position);
    dir.y = 0;
    dir.normalize();
    
    // دقة حسب قرب اللاعب من الكرة
    const accuracy = 1 - Math.min(ballDist / 2, 1) * 0.4;
    dir.x += (Math.random() - 0.5) * (1 - accuracy);
    dir.z += (Math.random() - 0.5) * (1 - accuracy) * 0.5;
    dir.normalize();
    
    match.ball.kick(dir, PLAYER_CONFIG.shootPower);
    match.onBallKicked(currentPlayer);
}

// ============================================
// تمرير
// ============================================
function passBall() {
    if (!currentPlayer) return;
    
    const ballDist = currentPlayer.distanceTo(match.ball.position);
    if (ballDist > 1.5) return;
    
    // ابحث عن أفضل زميل (أمامي)
    const teammates = controlledTeam.getActivePlayers().filter(p => 
        p !== currentPlayer && !p.isGK
    );
    
    if (teammates.length === 0) return;
    
    const myGoalDist = Math.abs(match.ball.position.x - controlledTeam.attackDir * FIELD.length / 2);
    
    // رتب حسب القرب من مرمى الخصم
    const sorted = teammates.sort((a, b) => {
        const da = Math.abs(a.position.x - controlledTeam.attackDir * FIELD.length / 2);
        const db = Math.abs(b.position.x - controlledTeam.attackDir * FIELD.length / 2);
        return da - db;
    });
    
    // اختر الأقرب للمرمى (المهاجم)
    const target = sorted[0];
    const dir = new THREE.Vector3().subVectors(target.position, match.ball.position);
    dir.y = 0;
    dir.normalize();
    
    match.ball.kick(dir, PLAYER_CONFIG.passPower);
    match.onBallKicked(currentPlayer);
}

// ============================================
// قطع الكرة
// ============================================
function interceptBall() {
    if (!currentPlayer) return;
    
    const ballDist = currentPlayer.distanceTo(match.ball.position);
    if (ballDist > 2) return;
    
    // اقطع في اتجاه الكرة
    const dir = new THREE.Vector3().subVectors(
        match.ball.position, currentPlayer.position
    );
    dir.y = 0;
    dir.normalize();
    
    match.ball.kick(dir, PLAYER_CONFIG.passPower * 0.8);
    match.onBallKicked(currentPlayer);
}

// ============================================
// الحلقة الرئيسية
// ============================================
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    // تحكم اللاعب
    if (currentPlayer && currentPlayer.active && !currentPlayer.isSuspended) {
        const moveDir = controls.getMoveDirection();
        if (moveDir.lengthSq() > 0.01) {
            // تحويل من إحداثيات الشاشة إلى العالم
            // الكاميرا تلفزيونية: x الشاشة = x العالم، y الشاشة = z العالم (بمقلوب)
            const worldDir = new THREE.Vector3(
                moveDir.x,
                0,
                moveDir.y  // y الأنالوج لفوق = -1 = للأمام نحو مرمى الخصم (الموجب x)
            );
            
            // في كاميرا تلفزيونية، اللاعب في الفريق "home" يهاجم في اتجاه +x
            // لذا الأنالوج لفوق (y=-1) = حركة في +x
            // لكن حسب إعدادنا: moveDir.z = moveDir.y، والكاميرا شايفا الأبعاد عادية
            
            // التصحيح: الكاميرا على +z تنظر نحو -z، فمحور x للشاشة = x العالم
            // والمحور y للشاشة (لفوق) = -z العالم (لو كاميرا في وضع مستقيم)
            // لكن كاميرا تلفزيونية موضوعة على +z، فمحور y للشاشة = z العالم بشكل مقلوب
            // والأنالوج y<0 (لفوق) = z<0 = للأمام في اتجاه الخصم (لأن مرمى الخصم في +x في هذه الحالة)
            // ⚠️ فيه التباس هنا - سنصلحه لاحقاً بالتجربة
            
            // الحل الأبسط: نستخدم اتجاه الكاميرا
            const camForward = new THREE.Vector3();
            cameraManager.getCamera().getWorldDirection(camForward);
            camForward.y = 0;
            camForward.normalize();
            
            const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0,1,0)).normalize();
            
            const finalDir = new THREE.Vector3()
                .addScaledVector(camRight, moveDir.x)
                .addScaledVector(camForward, -moveDir.y)  // سالب لأن y الأنالوج مقلوب
                .normalize();
            
            currentPlayer.move(finalDir, dt, currentPlayer.isSprinting);
        } else {
            currentPlayer.move(new THREE.Vector3(0,0,0), dt, false);
        }
    }

    // أزرار الأكشن
    handleActionButtons(dt);

    // تحديث المباراة
    match.update(dt);

    // تبديل الوضع تلقائياً حسب من يملك الكرة
    const owner = match.getBallOwner();
    if (owner === controlledTeam && controls.mode !== 'attack') {
        controls.setMode('attack');
    } else if (owner && owner !== controlledTeam && controls.mode !== 'defense') {
        controls.setMode('defense');
    }

    // تتبع الكرة بالكاميرا
    cameraManager.follow(match.ball.position, dt);

    // رسم
    renderer.render(scene, cameraManager.getCamera());
}

// ============================================
// بناء الملعب (نستورد من field.js لاحقاً)
// ============================================
async function buildField() {
    // ... كود بناء الملعب (نفس اللي عملناه سابقاً)
    // سأنقله لملف field.js منفصل في التحديث القادم
    const mod = await import('./field.js');
    mod.buildAllField(scene);
}

// ============================================
// تشغيل
// ============================================
init().catch(err => {
    console.error('❌ خطأ في التشغيل:', err);
    document.getElementById('loading').innerHTML = 
        `<p style="color:red">خطأ: ${err.message}</p>`;
});

