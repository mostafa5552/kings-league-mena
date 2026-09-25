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

        // الكرة
        this.ball = new Ball(scene);

        // الفرق
        this.homeTeam = new Team(scene, homeTeamId, homeData, 'home', false);
        this.awayTeam = new Team(scene, awayTeamId, awayData, 'away', false);
        
        // لو الألوان متشابهة، استخدم الطقم الاحتياطي للفريق الضيف
        // (منطق مبسط - لاحقاً نستخدم canPlayAgainst)

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
        this.state = 'kickoff';  // kickoff | playing | goal | halftime | ended | waiting
        this.currentMinute = 0;
        this.currentSecond = 0;
        this.half = 1;                 // 1 أو 2
        this.gameTime = 0;              // الوقت الحقيقي بالأثواني
        this.realTimeToGameTime = 60;   // كل ثانية حقيقية = دقيقة لعب (لتسريع)
        // (سنعدلها حسب الحاجة - مثلاً 40 دقيقة حقيقية)

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
        this.lastKickoffTime = 0;
        this.waitingForKickoff = 0;
    }

    // ============================================
    // بدء المباراة
    // ============================================
    start() {
        this.state = 'playing';
        this.gameTime = 0;
        this.currentMinute = 0;
        this.currentSecond = 0;
        this.half = 1;
        
        // الدقيقة 0: تصعيد مبدئي = 0 لاعب (سيبدأ بـ 1 ضد 1)
        this.homeTeam.setActiveCount(1);
        this.awayTeam.setActiveCount(1);
        
        this.startKickoff();
    }

    // ============================================
    // الضربة الافتتاحية (الكرة تسقط من الأعلى)
    // ============================================
    startKickoff() {
        this.state = 'kickoff';
        
        // الكرة فوق في المنتصف على ارتفاع عالٍ
        this.ball.setPosition(0, 12, 0);
        this.ball.velocity.set(0, 0, 0);

        // اللاعبين يعودون لمواقعهم
        this.homeTeam.resetPositions();
        this.awayTeam.resetPositions();

        // أبعد اللاعبين قليلاً عن بعضهم في المنتصف
        this.homeTeam.getActivePlayers().forEach(p => {
            p.position.x -= 3;
            p.position.z *= 0.7;
            p.updateMesh();
        });
        this.awayTeam.getActivePlayers().forEach(p => {
            p.position.x += 3;
            p.position.z *= 0.7;
            p.updateMesh();
        });

        this.waitingForKickoff = 0.8; // 0.8 ثانية قبل السماح بالحركة
    }

    // ============================================
    // التحديث الرئيسي (يُستدعى كل إطار)
    // ============================================
    update(dt) {
        // الوقت
        this.updateClock(dt);

        // الحالة
        if (this.state === 'ended') return;

        if (this.waitingForKickoff > 0) {
            this.waitingForKickoff -= dt;
            // تحديث الكرة فقط (تسقط)
            this.ball.update(dt);
            return;
        }

        // تحديث الكرة
        this.ball.update(dt);

        // تحديث اللاعبين
        this.homeTeam.update(dt);
        this.awayTeam.update(dt);

        // تحديث AI
        this.ais.forEach(ai => ai.update(dt));

        // تصادمات اللاعبين مع الكرة
        this.checkBallPlayerCollisions();

        // التحقق من الهدف
        this.checkGoal();

        // إيقاف اللاعبين الموقوفين
        this.checkSuspensions();
    }

    // ============================================
    // إدارة الوقت
    // ============================================
    updateClock(dt) {
        this.gameTime += dt;

        // كل ثانية حقيقية = X ثانية لعب
        // لو عايزين 40 دقيقة لعب في 40 دقيقة حقيقية: 1x
        // لو عايزين أسرع: مثلاً 4x (10 دقائق حقيقية)
        const TIME_SCALE = 4; // 4x - شوطين × 20 دقيقة = 10 دقائق حقيقية
        
        const gameSeconds = this.gameTime * TIME_SCALE;
        this.currentMinute = Math.floor(gameSeconds / 60);
        const oldMinute = this.currentMinute;
        
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
        // الشوط الأول
        if (this.half === 1) {
            // تصعيد اللاعبين (دقيقة 1-5)
            if (minute >= 1 && minute <= 5) {
                const playerCount = Math.min(minute + 1, 7); // دقيقة 1 = 2 لاعبين فعلياً؟ 
                // القاعدة: كل دقيقة يضاف لاعب
                // دقيقة 0 = 1 ضد 1
                // دقيقة 1 = 2 ضد 2
                // دقيقة 5 = 7 ضد 7
                const count = Math.min(minute + 1, 7);
                this.homeTeam.setActiveCount(count);
                this.awayTeam.setActiveCount(count);
            }

            // الدقيقة 17: كرة ملونة
            if (minute === MATCH_RULES.coloredBallMinute && !this.coloredBallActive) {
                this.activateColoredBall();
            }

            // نهاية الشوط الأول (دقيقة 20)
            if (minute >= MATCH_RULES.halfDuration) {
                this.endFirstHalf();
            }
        }

        // الشوط الثاني
        if (this.half === 2) {
            const halfMinute = minute - MATCH_RULES.secondHalfStart;

            // الدقيقة 23 (3 دقائق بعد بداية الشوط الثاني): عودة 7 ضد 7
            if (minute === MATCH_RULES.fullReturnMinute) {
                this.homeTeam.setActiveCount(7);
                this.awayTeam.setActiveCount(7);
                this.coloredBallActive = false;
                this.ball.setColored(false);
            }

            // الدقيقة 36: Match Ball
            if (minute === MATCH_RULES.matchBallMinute) {
                this.startMatchBallStage();
            }

            // Match Ball: يستبعد لاعب كل دقيقة
            if (minute > MATCH_RULES.matchBallMinute && this.state === 'matchBall') {
                const minutesSince = minute - MATCH_RULES.matchBallMinute;
                const newCount = Math.max(7 - minutesSince, 1);
                this.homeTeam.setActiveCount(newCount);
                this.awayTeam.setActiveCount(newCount);
            }

            // نهاية المباراة (دقيقة 40)
            if (minute >= MATCH_RULES.totalDuration) {
                this.endMatch();
            }
        }
    }

    // ============================================
    // تفعيل الكرة الملونة
    // ============================================
    activateColoredBall() {
        this.coloredBallActive = true;
        this.ball.setColored(true);
        if (this.onColoredBall) this.onColoredBall(true);
    }

    // ============================================
    // نهاية الشوط الأول
    // ============================================
    endFirstHalf() {
        this.state = 'halftime';
        this.half = 2;
        
        if (this.onHalfEnd) this.onHalfEnd(1);

        // رمي النرد (يحصل تلقائياً)
        this.rollDice();

        // بعد 3 ثواني، نبدأ الشوط الثاني
        setTimeout(() => {
            this.startSecondHalf();
        }, 3000);
    }

    // ============================================
    // رمي النرد (بداية الشوط الثاني)
    // ============================================
    rollDice() {
        // نرد من 1 إلى 6
        this.diceResult = Math.floor(Math.random() * 6) + 1;
        
        if (this.onDiceRoll) this.onDiceRoll(this.diceResult);
        
        console.log(`🎲 النرد: ${this.diceResult}`);
    }

    // ============================================
    // بدء الشوط الثاني
    // ============================================
    startSecondHalf() {
        this.state = 'playing';
        this.currentMinute = MATCH_RULES.secondHalfStart;
        
        // عدد اللاعبين حسب النرد
        this.homeTeam.setActiveCount(this.diceResult);
        this.awayTeam.setActiveCount(this.diceResult);
        
        this.startKickoff();
    }

    // ============================================
    // بدء Match Ball
    // ============================================
    startMatchBallStage() {
        this.state = 'matchBall';
        
        // لو متعادلين → ركلات ترجيح
        if (this.homeTeam.score === this.awayTeam.score) {
            this.startPenaltyShootout();
        }
    }

    // ============================================
    // ركلات الترجيح
    // ============================================
    startPenaltyShootout() {
        this.state = 'penaltyShootout';
        console.log('⚽ ركلات الترجيح!');
        // منطق ركلات الترجيح يُبنى لاحقاً
    }

    // ============================================
    // نهاية المباراة
    // ============================================
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

    // ============================================
    // من يملك الكرة؟
    // ============================================
    getBallOwner() {
        // اللاعب الأقرب للكرة داخل نطاق معين
        const ballPos = this.ball.position;
        
        let closest = null;
        let minDist = 2.5; // نطاق السيطرة
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
                const dx = p.position.x - ballPos.x;
                const dz = p.position.z - ballPos.z;
                const dy = p.position.y - ballPos.y;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                const minDist = 0.4 + ballRadius;
                
                if (dist < minDist && dist > 0.01) {
                    // اصطدام - ادفع الكرة بعيداً
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const nz = dz / dist;
                    
                    // لو اللاعب بيمشي، الكرة تروح في اتجاه حركته
                    const pushDir = new THREE.Vector3(
                        nx + p.velocity.x * 0.1,
                        ny * 0.3 + 0.2,
                        nz + p.velocity.z * 0.1
                    ).normalize();
                    
                    const speed = Math.max(p.speed * 0.4, 2);
                    this.ball.kick(pushDir, speed);
                    
                    // منع التداخل
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

    // ============================================
    // فحص تسجيل هدف
    // ============================================
    checkGoal() {
        const ballPos = this.ball.position;
        const halfL = FIELD.length / 2;

        const isGoal = (side, scorerTeam, opponentTeam) => {
            const goalX = side === 'left' ? -halfL : halfL;
            const checkSide = side === 'left' 
                ? ballPos.x < goalX - 0.1
                : ballPos.x > goalX + 0.1;
            
            if (checkSide && Math.abs(ballPos.z) < FIELD.goalWidth / 2) {
                // هدف!
                this.onGoal(scorerTeam, opponentTeam);
                return true;
            }
            return false;
        };

        // الهدف في مرمى اليسار = يسجله فريق away
        if (isGoal('left', this.awayTeam, this.homeTeam)) return;
        
        // الهدف في مرمى اليمين = يسجله فريق home
        if (isGoal('right', this.homeTeam, this.awayTeam)) return;
    }

    // ============================================
    // عند تسجيل هدف
    // ============================================
    onGoal(scorerTeam, concededTeam) {
        this.state = 'goal';
        
        // حساب عدد الأهداف (مع المضاعفات)
        let multiplier = 1;
        
        // كرة ملونة = هدفين
        if (this.coloredBallActive) {
            multiplier = 2;
        }
        
        // بطاقة الهدف المضاعف
        if (scorerTeam.isDoubleGoalActive()) {
            multiplier *= 2;
        }
        
        // لاعب نجم (لو الهداف معروف)
        // (سنحدده من آخر لاعب لمس الكرة)
        if (this.lastToucher && this.lastToucher.teamId === scorerTeam.id) {
            if (this.lastToucher.isStar) {
                multiplier *= 2;
            }
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

        // إعادة البدء بعد ثانيتين
        setTimeout(() => {
            // لو المباراة في مرحلة Match Ball وانتهت
            if (this.state === 'matchBall') {
                this.endMatch();
                return;
            }
            
            this.startKickoff();
            this.state = 'playing';
        }, 2000);
    }

    // ============================================
    // تحديد من لمس الكرة آخر مرة (للأهداف)
    // ============================================
    onBallKicked(player) {
        this.lastToucher = player;
    }

    // ============================================
    // إيقاف اللاعبين الموقوفين
    // ============================================
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

    // ============================================
    // واجهة عامة للأسلحة السرية
    // ============================================
    useWeapon(team, weaponId, target = null) {
        const opponent = team === this.homeTeam ? this.awayTeam : this.homeTeam;
        
        switch (weaponId) {
            case 'PENALTY':
                this.grantPenalty(team);
                break;
            case 'SHOOTOUT':
                this.grantShootout(team);
                break;
            case 'DOUBLE_GOAL':
                team.activateDoubleGoal(performance.now() + 4 * 60 * 1000);
                break;
            case 'SUSPENSION':
                if (target) {
                    target.setSuspended(true, performance.now() + 4 * 60 * 1000);
                }
                break;
            case 'STAR_PLAYER':
                if (target) {
                    const idx = team.players.indexOf(target);
                    team.setStarPlayer(idx);
                }
                break;
            case 'REVERSE_PENALTY':
                this.grantReversePenalty(team, opponent);
                break;
            case 'JOKER':
                // منطق الجوكر
                break;
        }
    }

    grantPenalty(team) {
        // سيتم تفعيلها لاحقاً
        console.log(`🎯 ركلة جزاء لـ ${team.id}`);
    }

    grantShootout(team) {
        console.log(`🏃 شووت آوت لـ ${team.id}`);
    }

    grantReversePenalty(team, opponent) {
        console.log(`🔄 عقوبة عكسية لـ ${team.id}`);
    }
}

