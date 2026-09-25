import * as THREE from 'three';
import { FIELD } from './config.js';

export class CameraManager {
    constructor(aspect) {
        this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 500);
        
        this.mode = 'broadcast';
        this.targetPos = new THREE.Vector3(0, 0, 0);
        this.currentLookAt = new THREE.Vector3(0, 0, 0);
        this.offset = new THREE.Vector3();

        // كاميرا تلفزيونية
        this.broadcastHeight = 14;
        this.broadcastDistance = 22;
        this.smoothness = 3;

        // وضع اللعب التكتيكي
        this.tacticalHeight = 38;

        this.setBroadcast();
    }

    setBroadcast() {
        this.mode = 'broadcast';
        this.camera.position.set(0, this.broadcastHeight, this.broadcastDistance);
        this.camera.lookAt(0, 0, 0);
    }

    setTactical() {
        this.mode = 'tactical';
        this.camera.position.set(0, this.tacticalHeight, 0.1);
        this.camera.lookAt(0, 0, 0);
    }

    follow(target, dt) {
        this.targetPos.copy(target);

        if (this.mode === 'broadcast') {
            // كاميرا تلفزيونية تتابع الكرة بلطف
            const targetX = THREE.MathUtils.clamp(target.x * 0.35, -18, 18);
            const targetZ = this.broadcastDistance + target.z * 0.15;
            
            this.camera.position.x += (targetX - this.camera.position.x) * this.smoothness * dt;
            this.camera.position.z += (targetZ - this.camera.position.z) * this.smoothness * dt;
            this.camera.position.y = this.broadcastHeight + Math.abs(target.x) * 0.05;
            
            // نظرة على الكرة
            this.currentLookAt.lerp(
                new THREE.Vector3(target.x * 0.5, 1, target.z * 0.5),
                this.smoothness * dt
            );
            this.camera.lookAt(this.currentLookAt);
        }
        else if (this.mode === 'tactical') {
            // نظرة من فوق - تتحرك ببطء
            this.camera.position.x += (target.x * 0.2 - this.camera.position.x) * dt;
            this.camera.position.z += (target.z * 0.2 - this.camera.position.z) * dt;
            this.camera.lookAt(target.x * 0.2, 0, target.z * 0.2);
        }
    }

    onResize(aspect) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    getCamera() {
        return this.camera;
    }
}

