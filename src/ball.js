// ============================================
// ball.js - الكرة + الفيزياء
// ============================================
import * as THREE from 'three';
import { BALL_CONFIG, PHYSICS, FIELD } from './config.js';

export class Ball {
    constructor(scene) {
        this.scene = scene;
        this.config = BALL_CONFIG;

        // الميش
        const geometry = new THREE.SphereGeometry(this.config.radius, 24, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.35,
            metalness: 0.1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // تفاصيل النمط (خماسيات سوداء مبسطة)
        this.addPentagons();

        // الحالة الفيزيائية
        this.position = new THREE.Vector3(0, this.config.radius, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        this.isColored = false;
        this.isInPlay = true;

        scene.add(this.mesh);
        this.updateMesh();
    }

    addPentagons() {
        const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const dotGeo = new THREE.CircleGeometry(0.035, 6);
        
        const positions = [
            { x: 0, y: 0, z: this.config.radius + 0.001, rx: 0, ry: 0 },
            { x: 0, y: 0, z: -this.config.radius - 0.001, rx: 0, ry: Math.PI },
            { x: this.config.radius + 0.001, y: 0, z: 0, rx: 0, ry: Math.PI/2 },
            { x: -this.config.radius - 0.001, y: 0, z: 0, rx: 0, ry: -Math.PI/2 },
            { x: 0, y: this.config.radius + 0.001, z: 0, rx: -Math.PI/2, ry: 0 },
            { x: 0, y: -this.config.radius - 0.001, z: 0, rx: Math.PI/2, ry: 0 },
        ];
        
        positions.forEach(p => {
            const dot = new THREE.Mesh(dotGeo, blackMat);
            dot.position.set(p.x, p.y, p.z);
            dot.rotation.set(p.rx, p.ry, 0);
            this.mesh.add(dot);
        });
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.velocity.set(0, 0, 0);
        this.updateMesh();
    }

    kick(direction, power) {
        this.velocity.copy(direction).multiplyScalar(power);
        this.angularVelocity.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
        );
    }

    applyImpulse(force) {
        this.velocity.add(force);
    }

    setColored(colored) {
        this.isColored = colored;
        if (colored) {
            this.mesh.material.color.setHex(0xFFD700);
            this.mesh.material.emissive = new THREE.Color(0xFF8C00);
            this.mesh.material.emissiveIntensity = 0.6;
        } else {
            this.mesh.material.color.setHex(0xffffff);
            this.mesh.material.emissive = new THREE.Color(0x000000);
            this.mesh.material.emissiveIntensity = 0;
        }
    }

    update(dt) {
        if (!this.isInPlay) return;

        const gravity = new THREE.Vector3(0, PHYSICS.gravity, 0);
        this.velocity.addScaledVector(gravity, dt);
        this.velocity.multiplyScalar(1 - this.config.airDrag * dt);
        this.position.addScaledVector(this.velocity, dt);

        // دوران الكرة
        this.mesh.rotation.x += this.angularVelocity.x * dt;
        this.mesh.rotation.y += this.angularVelocity.y * dt;
        this.mesh.rotation.z += this.angularVelocity.z * dt;
        this.angularVelocity.multiplyScalar(1 - 1.5 * dt);

        // اصطدام بالأرض
        if (this.position.y <= this.config.radius) {
            this.position.y = this.config.radius;
            if (this.velocity.y < 0) {
                this.velocity.y = -this.velocity.y * this.config.restitution;
                this.velocity.x *= (1 - this.config.friction);
                this.velocity.z *= (1 - this.config.friction);
            }
        }

        // اصطدام بالحواجز
        const halfL = FIELD.length / 2 - this.config.radius;
        const halfW = FIELD.width / 2 - this.config.radius;

        if (this.position.x > halfL) {
            this.position.x = halfL;
            this.velocity.x *= -this.config.restitution;
        }
        if (this.position.x < -halfL) {
            this.position.x = -halfL;
            this.velocity.x *= -this.config.restitution;
        }
        if (this.position.z > halfW) {
            this.position.z = halfW;
            this.velocity.z *= -this.config.restitution;
        }
        if (this.position.z < -halfW) {
            this.position.z = -halfW;
            this.velocity.z *= -this.config.restitution;
        }

        // إيقاف الحركة البطيئة
        if (this.velocity.lengthSq() < 0.04 && this.position.y <= this.config.radius + 0.01) {
            this.velocity.multiplyScalar(0.85);
            if (this.velocity.lengthSq() < 0.01) this.velocity.set(0, 0, 0);
        }

        this.updateMesh();
    }

    updateMesh() {
        this.mesh.position.copy(this.position);
    }

    reset(center = true) {
        if (center) {
            this.position.set(0, this.config.radius, 0);
        }
        this.velocity.set(0, 0, 0);
        this.updateMesh();
    }

    getPosition() {
        return this.position.clone();
    }

    getSpeed() {
        return this.velocity.length();
    }
}

