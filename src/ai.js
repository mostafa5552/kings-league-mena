import * as THREE from 'three';
import { FIELD, PLAYER_CONFIG, BALL_CONFIG } from './config.js';

// ============================================
// AI بسيط وفعّال لكل لاعب
// ============================================
export class PlayerAI {
    constructor(player, team, opponentTeam, ball, match) {
        this.player = player;
        this.team = team;
        this.opponent = opponentTeam;
        this.ball = ball;
        this.match = match;
        
        // سلوك اللاعب
        this.role = player.isGK ? 'goalkeeper' : 'field';
        this.chaseThreshold = player.isGK ? 3 : 8;  // مدى المطاردة
    }

    update(dt) {
        if (!this.player.active || this.player.isSuspended) return;
        if (this.player.isSelected) return; // اللاعب الذي يتحكم به المستخدم

        if (this.role === 'goalkeeper') {
            this.updateGoalkeeper(dt);
        } else {
            this.updateFieldPlayer(dt);
        }
    }

    // ============================================
    // حراسة المرمى
    // ============================================
    updateGoalkeeper(dt) {
        const p = this.player;
        const gkX = this.team.defendDir * (FIELD.length / 2 - 1.2);
        const ballX = this.ball.position.x;
        const ballZ = this.ball.position.z;

        // هل الكرة قريبة من المرمى؟
        const ballDistToGoal = Math.abs(ballX - gkX);
        
        let targetX = gkX;
        let targetZ = 0;

        // الحارس يتابع z الكرة دائماً (لكن بحدود المرمى)
        targetZ = THREE.MathUtils.clamp(
            ballZ * 0.7,
            -FIELD.goalWidth / 2 - 0.8,
            FIELD.goalWidth / 2 + 0.8
        );

        // لو الكرة قريبة جداً، يخرج لاعتراضها
        if (ballDistToGoal < 4 && this.ball.position.y < 2) {
            targetX = ballX * 0.6 + gkX * 0.4;
        }

        // تحرك
        const target = new THREE.Vector3(targetX, 0, targetZ);
        const dir = new THREE.Vector3().subVectors(target, p.position);
        dir.y = 0;
        
        if (dir.length() > 0.15) {
            dir.normalize();
            const dist = p.position.distanceTo(target);
            const speedFactor = Math.min(dist, 1); // تخفيف عند الاقتراب
            p.move(dir.multiplyScalar(speedFactor), dt, dist > 3);
        }
    }

    // ============================================
    // لاعب ميدان (هجوم/دفاع)
    // ============================================
    updateFieldPlayer(dt) {
        const p = this.player;
        const ball = this.ball;
        const ballPos = ball.position;
        const ballSpeed = ball.velocity.length();

        // من يملك الكرة؟ (أقرب لاعب للكرة)
        const ownerTeam = this.match.getBallOwner();

        if (ownerTeam === this.team) {
            // ====== فريقي يهجم ======
            this.attackBehavior(dt);
        } else if (ownerTeam === this.opponent) {
            // ====== الخصم يهجم ======
            this.defendBehavior(dt);
        } else {
            // ====== كرة حرة ======
            this.chaseBall(dt);
        }
    }

    // مطاردة الكرة
    chaseBall(dt) {
        const p = this.player;
        const ball = this.ball;
        
        // هل أنا الأقرب للكرة؟
        const myDist = p.distanceTo(ball.position);
        const teammates = this.team.getActivePlayers().filter(t => t !== p && !t.isGK);
        const closestTeammateDist = teammates.length > 0 
            ? Math.min(...teammates.map(t => t.distanceTo(ball.position)))
            : Infinity;

        // لو مش الأقرب، أرجع لمكاني
        if (myDist > closestTeammateDist + 1) {
            this.returnToPosition(dt);
            return;
        }

        // أركض نحو الكرة
        const dir = new THREE.Vector3().subVectors(ball.position, p.position);
        dir.y = 0;
        
        if (dir.length() > 0.1) {
            dir.normalize();
            p.move(dir, dt, myDist > 3);
            
            // محاولة تسديد/تمرير لو قريب جداً
            if (myDist < 1.2 && ball.position.y < 0.5) {
                this.decideAction();
            }
        }
    }

    // سلوك الهجوم - يتحرك في منطقة الهجوم + يبحث عن الكرة
    attackBehavior(dt) {
        const p = this.player;
        const ball = this.ball;
        const myDistToBall = p.distanceTo(ball.position);
        
        // إذا الكرة قريبة مني، اقترب منها
        if (myDistToBall < 6) {
            this.chaseBall(dt);
            return;
        }

        // وإلا، تحرك في منطقة الهجوم
        const attackX = this.team.attackDir * FIELD.length * 0.3;
        const naturalZ = p.homePosition.z * 1.5; // تمدد في العرض عند الهجوم
        
        // اتبع الكرة بذكاء
        const followBall = ball.position.z * 0.4;
        const targetZ = THREE.MathUtils.clamp(naturalZ + followBall, -FIELD.width / 2 + 1, FIELD.width / 2 - 1);
        const targetX = THREE.MathUtils.clamp(
            attackX + ball.position.x * 0.3,
            -FIELD.length / 2 + 2,
            FIELD.length / 2 - 2
        );
        
        const target = new THREE.Vector3(targetX, 0, targetZ);
        const dir = new THREE.Vector3().subVectors(target, p.position);
        dir.y = 0;
        
        if (dir.length() > 0.4) {
            dir.normalize();
            p.move(dir, dt, dir.length() > 4);
        }
    }

    // سلوك الدفاع - يعود لمنطقة الدفاع + يضغط صاحب الكرة
    defendBehavior(dt) {
        const p = this.player;
        const ball = this.ball;
        const myDist = p.distanceTo(ball.position);
        
        // اقرب لاعب يضغط صاحب الكرة
        const teammates = this.team.getActivePlayers().filter(t => t !== p && !t.isGK);
        const isClosestToBall = teammates.every(t => t.distanceTo(ball.position) >= myDist);
        
        if (isClosestToBall && myDist < 10) {
            // اضغط على صاحب الكرة
            const dir = new THREE.Vector3().subVectors(ball.position, p.position);
            dir.y = 0;
            if (dir.length() > 0.3) {
                dir.normalize();
                p.move(dir, dt, myDist > 3);
                
                // محاولة قطع الكرة
                if (myDist < 1 && ball.position.y < 1) {
                    this.tryIntercept();
                }
            }
        } else {
            // ارجع لمنطقة الدفاع
            this.returnToPosition(dt, true);
        }
    }

    // الرجوع للمركز الأساسي مع مراعاة موقع الكرة
    returnToPosition(dt, defensive = false) {
        const p = this.player;
        const ball = this.ball;
        
        const home = p.homePosition.clone();
        
        // زحف خفيف نحو الكرة
        home.x += ball.position.x * (defensive ? 0.15 : 0.25);
        home.z += ball.position.z * 0.3;
        
        // حدود
        home.x = THREE.MathUtils.clamp(home.x, -FIELD.length / 2 + 1, FIELD.length / 2 - 1);
        home.z = THREE.MathUtils.clamp(home.z, -FIELD.width / 2 + 1, FIELD.width / 2 - 1);

        const dir = new THREE.Vector3().subVectors(home, p.position);
        dir.y = 0;
        
        if (dir.length() > 0.4) {
            dir.normalize();
            p.move(dir, dt, false);
        }
    }

    // قرار سريع: تسديد أو تمرير
    decideAction() {
        const p = this.player;
        const ball = this.ball;
        
        // المسافة للمرمى
        const goalX = this.team.attackDir * FIELD.length / 2;
        const distToGoal = Math.abs(goalX - p.position.x) + Math.abs(p.position.z) * 0.5;

        // لو قريب من المرمى → سدد
        if (distToGoal < 12) {
            const goal = new THREE.Vector3(goalX, 0, 0);
            const dir = new THREE.Vector3().subVectors(goal, ball.position);
            dir.y = 0;
            dir.normalize();
            // شوية عشوائية
            dir.x += (Math.random() - 0.5) * 0.15;
            dir.z += (Math.random() - 0.5) * 0.4;
            ball.kick(dir, PLAYER_CONFIG.shootPower);
            this.match.onBallKicked(p);
        } else {
            // مرر لأقرب زميل في الأمام
            const teammates = this.team.getActivePlayers().filter(t => t !== p && !t.isGK);
            const forward = teammates.filter(t => 
                Math.abs(t.position.x - goalX) < Math.abs(p.position.x - goalX)
            );
            
            if (forward.length > 0) {
                const target = forward[Math.floor(Math.random() * forward.length)];
                const dir = new THREE.Vector3().subVectors(target.position, ball.position);
                dir.y = 0;
                dir.normalize();
                ball.kick(dir, PLAYER_CONFIG.passPower);
                this.match.onBallKicked(p);
            }
        }
    }

    // محاولة اعتراض الكرة
    tryIntercept() {
        // 70% فرصة للنجاح
        if (Math.random() < 0.7) {
            const p = this.player;
            const ball = this.ball;
            const dir = new THREE.Vector3().subVectors(ball.position, p.position);
            dir.y = 0;
            if (dir.length() > 0) dir.normalize();
            ball.kick(dir, PLAYER_CONFIG.passPower * 0.7);
            this.match.onBallKicked(p);
        }
    }
}

