import * as THREE from 'three';
import { Team } from './team.js';
import { PlayerAI } from './ai.js';
import { Ball } from './ball.js';
import { MATCH_RULES, FIELD, WEAPONS } from './config.js';

export class Match {
    constructor(scene, homeTeamId, awayTeamId, homeData, awayData) {
        this.scene = scene;
        this.homeTeamId = homeTeamId;
        this.awayTeamId = awayTeamId;

        this.ball = new Ball(scene);

        this.homeTeam = new Team(scene, homeTeamId, homeData, 'home', false);
        this.awayTeam = new Team(scene, awayTeamId, awayData, 'away', false);

        this.homeTeam.createPlayers();
        this.awayTeam.createPlayers();

        // AI لكل لاعب
        this.ais = [];
        this.homeTeam.players.forEach(p => {
            this.ais.push(new PlayerAI(p, this.homeTeam, this.awayTeam, this.ball, this));
        });
        this.awayTeam.players.forEach(p => {
            this.ais.push(new PlayerAI(p, this.awayTeam, this.homeTeam, this.ball, this));
        });

        // حالة المباراة
        this.state = 'kickoff';
        this.currentMinute = 0;
        this.currentSecond = 0;
        this.half = 1;
        this.gameTime = 0;

        // أحداث
        this.onGoalScored = null;
        this.onMinuteChanged = null;
        this.onHalfEnd = null;
        this.onMatchEnd = null;
        this.onColoredBall = null;
        this.onDiceRoll = null;

        // حالة أخرى
        this.coloredBallActive = false;
        this.diceResult = null;
        this.waitingForKickoff = 0;
        this.lastToucher = null;
    }

    start() {
        this.state = 'playing';
        this.gameTime = 0;
        this.currentMinute = 0;
        this.currentSecond = 0;
        this.half = 1;

        this.homeTeam.setActiveCount(1);
        this.awayTeam.setActiveCount(1);

        this.startKickoff();
    }

    // ============================================
    // الضربة الافتتاحية
    // ============================================
    startKickoff() {
        this.state = 'kickoff';

        this.ball.setPosition(0, 12, 0);
        this.ball.velocity.set(0, 0, 0);

        this.homeTeam.resetPositions();
        this.awayTeam.resetPositions();

        // ✅ استخدام position3D بدل position
        this.homeTeam.getActivePlayers().forEach(p => {
            p.position3D.x -= 3;
            p.position3D.z *= 0.7;
            p.updateMesh();
        });
        this.awayTeam.getActivePlayers().forEach(p => {
            p.position3D.x += 3;
            p.position3D.z *= 0.7;
            p.updateMesh();
        });

        this.waitingForKickoff = 0.8;
    }

    // ============================================
    // التحديث الرئيسي
    // ============================================
    update(dt) {
        this.updateClock(dt);

        if (this.state === 'ended') return;

        if (this.waitingForKickoff > 0) {
            this.waitingForKickoff -= dt;
            this.ball.update(dt);
            return;
        }

        this.ball.update(dt);
        this.homeTeam.update(dt);
        this.awayTeam.update(dt);

        this.ais.forEach(ai => ai.update(dt));

        this.checkBallPlayerCollisions();
        this.checkGoal();
        this.checkSuspensions();
    }

    // ============================================
    // إدارة الوقت
    // ============================================
    updateClock(dt) {
        this.gameTime += dt;

        const TIME_SCALE = 4;
        const gameSeconds = this.gameTime * TIME_SCALE;
        const oldMinute = this.currentMinute;
        this.currentMinute = Math.floor(gameSeconds / 60);
        this.currentSecond = Math.floor(gameSeconds % 60);

        if (oldMinute !== this.currentMinute) {
            this.onMinuteReached(this.currentMinute);
            if (this.onMinuteChanged) this.onMinuteChanged(this.currentMinute);
        }
    }

    // ============================================
    // أحداث دقيقة معينة
    // ============================================
    onMinuteReached(minute) {
        if (this.half === 1) {
            if (minute >= 1 && minute <= 5) {
                const count = Math.min(minute + 1, 7);
                this.homeTeam.setActiveCount(count);
                this.awayTeam.setActiveCount(count);
            }

            if (minute === MATCH_RULES.coloredBallMinute && !this.coloredBallActive) {
                this.activateColoredBall();
            }

            if (minute >= MATCH_RULES.halfDuration) {
                this.endFirstHalf();
            }
        }

        if (this.half === 2) {
            if (minute === MATCH_RULES.fullReturnMinute) {
                this.homeTeam.setActiveCount(7);
                this.awayTeam.setActiveCount(7);
                this.coloredBallActive = false;
                this.ball.setColored(false);
            }

            if (minute === MATCH_RULES.matchBallMinute) {
                this.startMatchBallStage();
            }

            if (minute > MATCH_RULES.matchBallMinute && this.state === 'matchBall') {
                const minutesSince = minute - MATCH_RULES.matchBallMinute;
                const newCount = Math.max(7 - minutesSince, 1);
                this.homeTeam.setActiveCount(newCount);
                this.awayTeam.setActiveCount(newCount);
            }

            if (minute >= MATCH_RULES.totalDuration) {
                this.endMatch();
            }
        }
    }

    activateColoredBall() {
        this.coloredBallActive = true;
        this.ball.setColored(true);
        if (this.onColoredBall) this.onColoredBall(true);
    }

    endFirstHalf() {
        this.state = 'halftime';
        this.half = 2;

        if (this.onHalfEnd) this.onHalfEnd(1);

        this.rollDice();

        setTimeout(() => {
            this.startSecondHalf();
        }, 3000);
    }

    rollDice() {
        this.diceResult = Math.floor(Math.random() * 6) + 1;
        if (this.onDiceRoll) this.onDiceRoll(this.diceResult);
        console.log(`🎲 النرد: ${this.diceResult}`);
    }

    startSecondHalf() {
        this.state = 'playing';
        this.currentMinute = MATCH_RULES.secondHalfStart;

        this.homeTeam.setActiveCount(this.diceResult);
        this.awayTeam.setActiveCount(this.diceResult);

        this.startKickoff();
    }

    startMatchBallStage() {
        this.state = 'matchBall';
        if (this.homeTeam.score === this.awayTeam.score) {
            this.startPenaltyShootout();
        }
    }

    startPenaltyShootout() {
        this.state = 'penaltyShootout';
        console.log('⚽ ركلات الترجيح!');
    }

    endMatch() {
        this.state = 'ended';
        if (this.onMatchEnd) {
            this.onMatchEnd({
                home: this.homeTeam.score,
                away: this.awayTeam.score,
                winner: this.homeTeam.score > this.awayTeam.score ? 'home' :
                        this.awayTeam.score > this.homeTeam.score ? 'away' : 'draw'
            });
        }
    }

    getBallOwner() {
        const ballPos = this.ball.position;
        let closest = null;
        let minDist = 2.5;
        let ownerTeam = null;

        const checkTeam = (team) => {
            team.getActivePlayers().forEach(p => {
                const d = p.distanceTo(ballPos);
                if (d < minDist) {
                    minDist = d;
                    closest = p;
                    ownerTeam = team;
                }
            });
        };

        checkTeam(this.homeTeam);
        checkTeam(this.awayTeam);

        return ownerTeam;
    }

    // ============================================
    // اصطدامات الكرة باللاعبين
    // ============================================
    checkBallPlayerCollisions() {
        const ballPos = this.ball.position;
        const ballRadius = this.ball.config.radius;

        const checkTeam = (team) => {
            team.getActivePlayers().forEach(p => {
                // ✅ استخدام position3D
                const dx = p.position3D.x - ballPos.x;
                const dz = p.position3D.z - ballPos.z;
                const dy = p.position3D.y - ballPos.y;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                const minDist = 0.4 + ballRadius;

                if (dist < minDist && dist > 0.01) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const nz = dz / dist;

                    const pushDir = new THREE.Vector3(
                        nx + p.velocity.x * 0.1,
                        ny * 0.3 + 0.2,
                        nz + p.velocity.z * 0.1
                    ).normalize();

                    const speed = Math.max((p.speed || 0) * 0.4, 2);
                    this.ball.kick(pushDir, speed);

                    const overlap = minDist - dist;
                    this.ball.position.x += nx * overlap;
                    this.ball.position.z += nz * overlap;
                    this.ball.updateMesh();
                }
            });
        };

        checkTeam(this.homeTeam);
        checkTeam(this.awayTeam);
    }

    checkGoal() {
        const ballPos = this.ball.position;
        const halfL = FIELD.length / 2;

        const isGoal = (side, scorerTeam, opponentTeam) => {
            const goalX = side === 'left' ? -halfL : halfL;
            const checkSide = side === 'left'
                ? ballPos.x < goalX - 0.1
                : ballPos.x > goalX + 0.1;

            if (checkSide && Math.abs(ballPos.z) < FIELD.goalWidth / 2) {
                this.onGoal(scorerTeam, opponentTeam);
                return true;
            }
            return false;
        };

        if (isGoal('left', this.awayTeam, this.homeTeam)) return;
        if (isGoal('right', this.homeTeam, this.awayTeam)) return;
    }

    onGoal(scorerTeam, concededTeam) {
        this.state = 'goal';

        let multiplier = 1;

        if (this.coloredBallActive) multiplier = 2;
        if (scorerTeam.isDoubleGoalActive()) multiplier *= 2;

        if (this.lastToucher && this.lastToucher.teamId === scorerTeam.id) {
            if (this.lastToucher.isStar) multiplier *= 2;
        }

        scorerTeam.scoreGoal(multiplier);

        if (this.onGoalScored) {
            this.onGoalScored({
                team: scorerTeam.id,
                score: scorerTeam.score,
                opponentScore: concededTeam.score,
                multiplier
            });
        }

        setTimeout(() => {
            if (this.state === 'matchBall') {
                this.endMatch();
                return;
            }
            this.startKickoff();
            this.state = 'playing';
        }, 2000);
    }

    onBallKicked(player) {
        this.lastToucher = player;
    }

    checkSuspensions() {
        const now = performance.now();
        [this.homeTeam, this.awayTeam].forEach(team => {
            team.players.forEach(p => {
                if (p.isSuspended && now >= p.suspensionEndTime) {
                    p.setSuspended(false, 0);
                }
            });
        });
    }

    useWeapon(team, weaponId, target = null) {
        const opponent = team === this.homeTeam ? this.awayTeam : this.homeTeam;

        switch (weaponId) {
            case 'PENALTY': this.grantPenalty(team); break;
            case 'SHOOTOUT': this.grantShootout(team); break;
            case 'DOUBLE_GOAL':
                team.activateDoubleGoal(performance.now() + 4 * 60 * 1000);
                break;
            case 'SUSPENSION':
                if (target) target.setSuspended(true, performance.now() + 4 * 60 * 1000);
                break;
            case 'STAR_PLAYER':
                if (target) {
                    const idx = team.players.indexOf(target);
                    team.setStarPlayer(idx);
                }
                break;
            case 'REVERSE_PENALTY': this.grantReversePenalty(team, opponent); break;
            case 'JOKER': break;
        }
    }

    grantPenalty(team) { console.log(`🎯 ركلة جزاء لـ ${team.id}`); }
    grantShootout(team) { console.log(`🏃 شووت آوت لـ ${team.id}`); }
    grantReversePenalty(team, opponent) { console.log(`🔄 عقوبة عكسية لـ ${team.id}`); }
}