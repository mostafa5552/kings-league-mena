import * as THREE from 'three';
import { initScene } from './scene.js';
import { Match } from './match.js';
import { CameraManager } from './camera.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';
import { buildAllField } from './field.js';
import { TEAMS, FIELD, PLAYER_CONFIG, MATCH_RULES, WEAPONS } from './config.js';

// ============================================
// متغيرات عالمية
// ============================================
let scene, renderer, clock;
let cameraManager;
let match;
let controls;
let ui;

let currentPlayer = null;
let controlledTeam = null;
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
    const status = document.getElementById('loading-status');

    status && (status.textContent = 'قفل الاتجاه...');
    await lockLandscape();

    // إعداد المشهد
    status && (status.textContent = 'إعداد المشهد...');
    const sceneData = initScene();
    scene = sceneData.scene;
    renderer = sceneData.renderer;
    clock = sceneData.clock;

    // بناء الملعب
    status && (status.textContent = 'بناء الملعب...');
    buildAllField(scene);

    // الكاميرا
    cameraManager = new CameraManager(window.innerWidth / window.innerHeight);

    // اختيار الفرق
    const homeId = 'RA2';
    const awayId = 'DR7';
    const homeData = TEAMS[homeId];
    const awayData = TEAMS[awayId];

    // UI
    status && (status.textContent = 'تحضير الواجهة...');
    ui = new UI();
    ui.setTeams(homeData, awayData);
    ui.showGameHUD();

    // المباراة
    status && (status.textContent = 'بدء المباراة...');
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

    // اختيار اللاعب الأول
    controlledTeam = match.homeTeam;
    selectNewPlayer();

    // إخفاء شاشة التحميل
    document.getElementById('loading').classList.add('hidden');

    // زر الأسلحة
    document.getElementById('btn-weapons').addEventListener('click', () => {
        const isOpen = isWeaponsWindowOpen();
        const teamWeapons = [WEAPONS.PENALTY, WEAPONS.SHOOTOUT, WEAPONS.DOUBLE_GOAL];
        ui.showWeaponsPanel(controlledTeam, teamWeapons, isOpen, (weapon) => {
            match.useWeapon(controlledTeam, weapon.id);
        });
    });

    console.log('✅ اللعبة جاهزة!');

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
    if (now - lastSwitchTime < 300) return;
    lastSwitchTime = now;

    const active = controlledTeam.getActivePlayers().filter(p => !p.isGK && p !== currentPlayer);
    if (active.length === 0) return;
    
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
// أزرار الأكشن
// ============================================
function handleActionButtons(dt) {
    if (!currentPlayer) return;

    if (controls.isPressed(1)) {
        currentPlayer.isSprinting = true;
    } else {
        currentPlayer.isSprinting = false;
    }

    if (controls.wasJustPressed(2)) {
        if (controls.mode === 'attack') shootBall();
        else switchPlayer();
    }

    if (controls.wasJustPressed(3)) {
        if (controls.mode === 'attack') passBall();
        else interceptBall();
    }

    if (controls.isPressed(4)) {
        if (controls.mode === 'attack') {
            currentPlayer.velocity.multiplyScalar(1.05);
        } else {
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
    if (ballDist > 1.5) return;
    
    const goalX = controlledTeam.attackDir * FIELD.length / 2;
    const goal = new THREE.Vector3(goalX, 0, 0);
    const dir = new THREE.Vector3().subVectors(goal, match.ball.position);
    dir.y = 0;
    dir.normalize();
    
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
    
    const teammates = controlledTeam.getActivePlayers().filter(p => 
        p !== currentPlayer && !p.isGK
    );
    if (teammates.length === 0) return;
    
    const sorted = teammates.sort((a, b) => {
        const da = Math.abs(a.position3D.x - controlledTeam.attackDir * FIELD.length / 2);
        const db = Math.abs(b.position3D.x - controlledTeam.attackDir * FIELD.length / 2);
        return da - db;
    });
    
    const target = sorted[0];
    const dir = new THREE.Vector3().subVectors(target.position3D, match.ball.position);
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
    
    const dir = new THREE.Vector3().subVectors(
        match.ball.position, currentPlayer.position3D
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
            const camForward = new THREE.Vector3();
            cameraManager.getCamera().getWorldDirection(camForward);
            camForward.y = 0;
            camForward.normalize();
            
            const camRight = new THREE.Vector3()
                .crossVectors(camForward, new THREE.Vector3(0,1,0))
                .normalize();
            
            const finalDir = new THREE.Vector3()
                .addScaledVector(camRight, moveDir.x)
                .addScaledVector(camForward, -moveDir.y)
                .normalize();
            
            currentPlayer.move(finalDir, dt, currentPlayer.isSprinting);
        } else {
            currentPlayer.move(new THREE.Vector3(0,0,0), dt, false);
        }
    }

    // أزرار الأكشن
    handleActionButtons(dt);

    // تحديث المباراة
    if (match) match.update(dt);

    // تبديل الوضع تلقائياً
    if (match && controlledTeam) {
        const owner = match.getBallOwner();
        if (owner === controlledTeam && controls.mode !== 'attack') {
            controls.setMode('attack');
        } else if (owner && owner !== controlledTeam && controls.mode !== 'defense') {
            controls.setMode('defense');
        }
    }

    // تتبع الكرة - ✅ حماية ضد undefined
    if (match && match.ball && match.ball.position) {
        cameraManager.follow(match.ball.position, dt);
    }

    // رسم
    renderer.render(scene, cameraManager.getCamera());
}

// ============================================
// تشغيل
// ============================================
init().catch(err => {
    console.error('❌ خطأ في التشغيل:', err);
    const errEl = document.getElementById('loading-error');
    if (errEl) errEl.textContent = 'خطأ: ' + err.message;
});