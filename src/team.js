// ============================================
// team.js - نسخة مبسطة للاختبار
// ============================================
import * as THREE from 'three';
import { Player } from './player.js';
import { FIELD } from './config.js';

export class Team {
    constructor(scene, teamId, teamData, side, useSecondary = false) {
        this.scene = scene;
        this.id = teamId;
        this.data = teamData;
        this.side = side;
        this.useSecondary = useSecondary;
        
        this.kit = useSecondary ? teamData.secondary : teamData.primary;

        this.defendDir = side === 'home' ? -1 : 1;
        this.attackDir = -this.defendDir;

        this.players = [];
        this.activeCount = 0;
        this.score = 0;
        this.doubleGoalEndTime = 0;
        this.starPlayerIndex = -1;
    }

    // ============================================
    // إنشاء اللاعبين (7 لاعبين ثابتين بأرقام بسيطة)
    // ============================================
    createPlayers() {
        console.log(`⚽ فريق ${this.id}: إنشاء 7 لاعبين`);

        // مواضع ثابتة لكل فريق
        const positions = [
            { x: 0.95, z: 0,    isGK: true  },   // حارس
            { x: 0.60, z: -0.40, isGK: false },  // مدافع 1
            { x: 0.60, z: 0.40,  isGK: false },  // مدافع 2
            { x: 0.25, z: -0.55, isGK: false },  // وسط 1
            { x: 0.25, z: 0.55,  isGK: false },  // وسط 2
            { x: -0.10, z: -0.20, isGK: false }, // مهاجم 1
            { x: -0.10, z: 0.20,  isGK: false }, // مهاجم 2
        ];

        for (let i = 0; i < 7; i++) {
            const pos = positions[i];
            const isGK = pos.isGK;

            // حساب الموضع الحقيقي
            const x = pos.x * this.defendDir * FIELD.length / 2;
            const z = pos.z * FIELD.width / 2;

            // إنشاء اللاعب
            const player = new Player(
                this.scene,
                this.id,
                { ...this.data, primary: this.kit },
                i + 1,
                isGK,
                { number: i + 1, name: `Player ${i + 1}`, position: isGK ? 'GK' : 'MID' }
            );

            player.reset(x, z, new THREE.Vector3(this.attackDir, 0, 0));

            if (isGK) {
                player.isGoalkeeper = true;
                player.homePosition = new THREE.Vector3(
                    this.defendDir * (FIELD.length / 2 - 1.5), 0, 0
                );
            } else {
                player.homePosition = new THREE.Vector3(x, 0, z);
            }

            this.players.push(player);
        }

        this.setActiveCount(0);
    }

    setActiveCount(count) {
        this.activeCount = Math.min(count, 7);
        
        this.players.forEach((p, i) => {
            if (p.isGK) {
                p.group.visible = true;
                p.active = true;
            } else {
                const isActive = (i < this.activeCount);
                p.active = isActive;
                p.group.visible = isActive;
            }
        });
    }

    getActivePlayers() {
        return this.players.filter(p => p.active && !p.isSuspended);
    }

    getGoalkeeper() {
        return this.players.find(p => p.isGK);
    }

    getClosestPlayerTo(pos) {
        const active = this.getActivePlayers().filter(p => !p.isGK);
        if (active.length === 0) return null;
        
        let closest = active[0];
        let minDist = active[0].distanceTo(pos);
        
        for (let i = 1; i < active.length; i++) {
            const d = active[i].distanceTo(pos);
            if (d < minDist) {
                minDist = d;
                closest = active[i];
            }
        }
        return closest;
    }

    resetPositions() {
        this.players.forEach((p, i) => {
            // نستخدم نفس المواضع
            const positions = [
                { x: 0.95, z: 0,    isGK: true  },
                { x: 0.60, z: -0.40, isGK: false },
                { x: 0.60, z: 0.40,  isGK: false },
                { x: 0.25, z: -0.55, isGK: false },
                { x: 0.25, z: 0.55,  isGK: false },
                { x: -0.10, z: -0.20, isGK: false },
                { x: -0.10, z: 0.20,  isGK: false },
            ];
            const pos = positions[i];
            if (!pos) return;
            
            const x = pos.x * this.defendDir * FIELD.length / 2;
            const z = pos.z * FIELD.width / 2;
            p.reset(x, z, new THREE.Vector3(this.attackDir, 0, 0));
        });
    }

    scoreGoal(multiplier = 1) {
        this.score += multiplier;
        return multiplier;
    }

    activateDoubleGoal(endTime) {
        this.doubleGoalEndTime = endTime;
    }

    isDoubleGoalActive() {
        return performance.now() < this.doubleGoalEndTime;
    }

    setStarPlayer(index) {
        if (this.starPlayerIndex >= 0 && this.players[this.starPlayerIndex]) {
            this.players[this.starPlayerIndex].setStar(false);
        }
        this.starPlayerIndex = index;
        if (index >= 0 && this.players[index]) {
            this.players[index].setStar(true);
        }
    }

    update(dt) {
        this.players.forEach(p => p.update(dt));
    }

    getTeamCenter() {
        const active = this.getActivePlayers();
        if (active.length === 0) return new THREE.Vector3(0, 0, 0);
        
        const center = new THREE.Vector3();
        active.forEach(p => center.add(p.position3D));
        center.divideScalar(active.length);
        return center;
    }

    showAllNames(show = true) {
        this.players.forEach(p => p.showName(show));
    }
}