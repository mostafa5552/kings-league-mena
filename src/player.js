// ============================================
// player.js - اللاعب + Stats + الحركة
// ============================================
import * as THREE from 'three';
import { PLAYER_CONFIG, FIELD, generatePlayerStats } from './config.js';

export class Player {
    constructor(scene, teamId, teamData, number, isGK = false, playerInfo = null) {
        this.scene = scene;
        this.teamId = teamId;
        this.teamData = teamData;
        this.number = number;
        this.isGK = isGK;
        
        // معلومات اللاعب (استخدمنا role بدل position لتجنب التضارب)
        this.name = playerInfo?.name || `Player ${number}`;
        this.role = playerInfo?.position || (isGK ? 'GK' : 'MID');
        
        // Stats
        this.stats = generatePlayerStats(this.role, number);
        this.maxSpeed = this.calculateMaxSpeed();
        this.acceleration = this.calculateAcceleration();
        this.kickPower = this.calculateKickPower();
        
        // حالات
        this.isStar = false;
        this.isSuspended = false;
        this.suspensionEndTime = 0;
        this.hasYellow = false;
        this.hasRed = false;
        this.isSelected = false;
        this.isGoalkeeper = isGK;
        this.active = true;

        // الحالة الحركية - ملاحظة: position3D مش position
        this.position3D = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.targetPosition = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, 1);
        this.homePosition = new THREE.Vector3(0, 0, 0);
        this.speed = 0;
        this.isSprinting = false;
        this.animTime = 0;

        this.kit = teamData.primary;

        this.buildMesh();
        scene.add(this.group);
    }

    calculateMaxSpeed() {
        const base = 4 + (this.stats.speed / 10) * 8;
        return this.isGK ? base * 0.75 : base;
    }

    calculateAcceleration() {
        const speedFactor = this.stats.speed / 10;
        const strengthFactor = this.stats.strength / 10;
        return 15 + (speedFactor * 0.7 + strengthFactor * 0.3) * 10;
    }

    calculateKickPower() {
        const accuracy = this.stats.accuracy / 10;
        const strength = this.stats.strength / 10;
        return 18 + (accuracy * 0.6 + strength * 0.4) * 15;
    }

    buildMesh() {
        this.group = new THREE.Group();

        const { height, bodyRadius, headRadius, legHeight } = PLAYER_CONFIG;

        const bodyMat = new THREE.MeshStandardMaterial({
            color: this.kit.shirt, roughness: 0.75
        });
        const bodyGeo = new THREE.CapsuleGeometry(bodyRadius, height * 0.4, 6, 12);
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = legHeight + height * 0.25;
        this.body.castShadow = true;
        this.group.add(this.body);

        const skinMat = new THREE.MeshStandardMaterial({ color: 0xF4C9A0, roughness: 0.85 });
        const headGeo = new THREE.SphereGeometry(headRadius, 16, 12);
        this.head = new THREE.Mesh(headGeo, skinMat);
        this.head.position.y = legHeight + height * 0.4 + headRadius + 0.1;
        this.head.castShadow = true;
        this.group.add(this.head);

        const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const hairGeo = new THREE.SphereGeometry(headRadius + 0.01, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        this.hair = new THREE.Mesh(hairGeo, hairMat);
        this.hair.position.y = this.head.position.y + 0.02;
        this.group.add(this.hair);

        const shortsMat = new THREE.MeshStandardMaterial({ color: this.kit.shorts, roughness: 0.8 });
        const shortsGeo = new THREE.CylinderGeometry(bodyRadius * 0.95, bodyRadius * 0.85, 0.35, 8);
        this.shorts = new THREE.Mesh(shortsGeo, shortsMat);
        this.shorts.position.y = legHeight + 0.05;
        this.shorts.castShadow = true;
        this.group.add(this.shorts);

        const legMat = new THREE.MeshStandardMaterial({ color: 0xF4C9A0, roughness: 0.85 });
        
        this.leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, legHeight * 0.7, 4, 8), legMat);
        this.leftLeg.position.set(-0.12, legHeight * 0.35, 0);
        this.leftLeg.castShadow = true;
        this.group.add(this.leftLeg);

        this.rightLeg = this.leftLeg.clone();
        this.rightLeg.position.x = 0.12;
        this.group.add(this.rightLeg);

        const armMat = new THREE.MeshStandardMaterial({ color: this.kit.shirt, roughness: 0.75 });
        this.leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.5, 4, 8), armMat);
        this.leftArm.position.set(-(bodyRadius + 0.1), legHeight + height * 0.3, 0);
        this.leftArm.castShadow = true;
        this.group.add(this.leftArm);

        this.rightArm = this.leftArm.clone();
        this.rightArm.position.x = bodyRadius + 0.1;
        this.group.add(this.rightArm);

        // الرقم
        const numberCanvas = document.createElement('canvas');
        numberCanvas.width = 128;
        numberCanvas.height = 128;
        const ctx = numberCanvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.number.toString(), 64, 64);
        
        const numberTexture = new THREE.CanvasTexture(numberCanvas);
        const numberMat = new THREE.MeshBasicMaterial({ map: numberTexture, transparent: true });
        const numberGeo = new THREE.PlaneGeometry(0.35, 0.35);
        this.numberPlane = new THREE.Mesh(numberGeo, numberMat);
        this.numberPlane.position.set(0, legHeight + height * 0.3, -bodyRadius - 0.005);
        this.group.add(this.numberPlane);

        // حلقة الاختيار
        const ringGeo = new THREE.RingGeometry(0.4, 0.5, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xFFD700, side: THREE.DoubleSide, transparent: true, opacity: 0.9
        });
        this.selectRing = new THREE.Mesh(ringGeo, ringMat);
        this.selectRing.rotation.x = -Math.PI / 2;
        this.selectRing.position.y = 0.02;
        this.selectRing.visible = false;
        this.group.add(this.selectRing);

        // حلقة النجمة
        const starRingGeo = new THREE.RingGeometry(0.55, 0.6, 24);
        const starRingMat = new THREE.MeshBasicMaterial({
            color: 0xFFD700, side: THREE.DoubleSide, transparent: true, opacity: 0.7
        });
        this.starRing = new THREE.Mesh(starRingGeo, starRingMat);
        this.starRing.rotation.x = -Math.PI / 2;
        this.starRing.position.y = 0.02;
        this.starRing.visible = false;
        this.group.add(this.starRing);

        this.addNameLabel();
        this.updateMesh();
    }

    addNameLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 512, 128);

        let displayName = this.name;
        if (displayName.length > 18) {
            const parts = displayName.split(' ');
            displayName = parts[parts.length - 1];
        }

        ctx.font = 'bold 44px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = this.isGK ? '#FFD700' : '#FFFFFF';
        ctx.strokeText(displayName, 256, 64);
        ctx.fillText(displayName, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({
            map: texture, transparent: true, depthTest: true, depthWrite: false
        });

        this.nameLabel = new THREE.Sprite(spriteMat);
        this.nameLabel.scale.set(2.2, 0.55, 1);
        this.nameLabel.position.set(0, PLAYER_CONFIG.height + 0.6, 0);
        this.nameLabel.visible = false;
        this.group.add(this.nameLabel);
    }

    setSelected(selected) {
        this.isSelected = selected;
        this.selectRing.visible = selected;
    }

    setStar(isStar) {
        this.isStar = isStar;
        this.starRing.visible = isStar;
    }

    setSuspended(suspended, endTime) {
        this.isSuspended = suspended;
        this.suspensionEndTime = endTime;
        this.group.visible = !suspended;
    }

    showName(show) {
        if (this.nameLabel) this.nameLabel.visible = show;
    }

    move(direction, dt, sprint = false) {
        const dir = direction.clone();
        dir.y = 0;
        
        if (dir.lengthSq() > 0) {
            dir.normalize();
            
            let targetSpeed = this.maxSpeed;
            if (sprint) {
                const sprintBonus = 1 + (this.stats.strength / 10) * 0.4;
                targetSpeed *= sprintBonus;
            }
            
            this.velocity.x += dir.x * this.acceleration * dt;
            this.velocity.z += dir.z * this.acceleration * dt;
            
            const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
            if (currentSpeed > targetSpeed) {
                this.velocity.x = (this.velocity.x / currentSpeed) * targetSpeed;
                this.velocity.z = (this.velocity.z / currentSpeed) * targetSpeed;
            }
            
            this.direction.copy(dir);
        } else {
            this.velocity.x *= (1 - PLAYER_CONFIG.friction * dt);
            this.velocity.z *= (1 - PLAYER_CONFIG.friction * dt);
        }

        this.position3D.x += this.velocity.x * dt;
        this.position3D.z += this.velocity.z * dt;

        const halfL = FIELD.length / 2 - 0.3;
        const halfW = FIELD.width / 2 - 0.3;
        
        this.position3D.x = Math.max(-halfL, Math.min(halfL, this.position3D.x));
        this.position3D.z = Math.max(-halfW, Math.min(halfW, this.position3D.z));

        if (this.velocity.lengthSq() > 0.5) {
            const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
            this.group.rotation.y = this.lerpAngle(this.group.rotation.y, targetAngle, 12 * dt);
        }

        this.animateLimbs(dt);
    }

    lerpAngle(current, target, t) {
        let diff = target - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return current + diff * Math.min(t, 1);
    }

    animateLimbs(dt) {
        this.speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        
        if (this.speed > 0.5) {
            this.animTime += dt * this.speed * 2;
            const swing = Math.sin(this.animTime * 4) * 0.5;
            this.leftLeg.rotation.x = swing;
            this.rightLeg.rotation.x = -swing;
            this.leftArm.rotation.x = -swing * 0.7;
            this.rightArm.rotation.x = swing * 0.7;
        } else {
            this.leftLeg.rotation.x *= 0.9;
            this.rightLeg.rotation.x *= 0.9;
            this.leftArm.rotation.x *= 0.9;
            this.rightArm.rotation.x *= 0.9;
        }
    }

    updateMesh() {
        this.group.position.set(this.position3D.x, this.position3D.y, this.position3D.z);
    }

    update(dt) {
        if (this.isSuspended && performance.now() > this.suspensionEndTime) {
            this.setSuspended(false, 0);
        }
        this.updateMesh();
    }

    getPosition() {
        return this.position3D.clone();
    }

    distanceTo(other) {
        if (other instanceof THREE.Vector3) {
            return this.position3D.distanceTo(other);
        }
        if (other && other.position3D) {
            return this.position3D.distanceTo(other.position3D);
        }
        return 9999;
    }

    applyImpulse(impulse) {
        this.velocity.add(impulse);
    }

    reset(x, z, faceDirection = new THREE.Vector3(1, 0, 0)) {
        this.position3D.set(x, 0, z);
        this.velocity.set(0, 0, 0);
        this.direction.copy(faceDirection);
        this.group.rotation.y = Math.atan2(faceDirection.x, faceDirection.z);
        this.updateMesh();
    }
}