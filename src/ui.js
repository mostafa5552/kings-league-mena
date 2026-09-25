import { TEAMS, WEAPONS, RARITY_COLORS } from './config.js';

export class UI {
    constructor() {
        this.hideAll();
    }

    hideAll() {
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('btn-weapons').classList.add('hidden');
        document.getElementById('btn-pause').classList.add('hidden');
    }

    showGameHUD() {
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('controls').classList.remove('hidden');
        document.getElementById('btn-weapons').classList.remove('hidden');
        document.getElementById('btn-pause').classList.remove('hidden');
    }

    // ============================================
    // النتيجة
    // ============================================
    updateScore(homeTeam, awayTeam) {
        document.getElementById('home-score').textContent = homeTeam.score;
        document.getElementById('away-score').textContent = awayTeam.score;
    }

    setTeams(homeData, awayData) {
        document.getElementById('home-logo').src = homeData.logo;
        document.getElementById('home-name').textContent = homeData.name;
        document.getElementById('away-logo').src = awayData.logo;
        document.getElementById('away-name').textContent = awayData.name;
    }

    // ============================================
    // الوقت
    // ============================================
    updateTime(minute, second, half) {
        const mm = String(minute).padStart(2, '0');
        const ss = String(second).padStart(2, '0');
        document.getElementById('time-display').textContent = `${mm}:${ss}`;
        document.getElementById('half-indicator').textContent = 
            half === 1 ? 'الشوط الأول' : 'الشوط الثاني';
    }

    // ============================================
    // كرة ملونة
    // ============================================
    setColoredBall(active) {
        const el = document.getElementById('ball-type');
        if (active) {
            el.textContent = '⚽ كرة ملونة × 2';
            el.classList.add('special');
        } else {
            el.textContent = '⚽ كرة عادية';
            el.classList.remove('special');
        }
    }

    // ============================================
    // تنبيهات
    // ============================================
    showToast(message, duration = 2500) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ============================================
    // شاشة الأسلحة السرية
    // ============================================
    showWeaponsPanel(team, weapons, isOpen, onUse) {
        // overlay
        const overlay = document.createElement('div');
        overlay.className = 'weapons-overlay';
        
        const panel = document.createElement('div');
        panel.className = 'weapons-panel';

        const title = document.createElement('h2');
        title.textContent = `🃏 أسلحة ${team.data.name}`;
        title.style.cssText = 'color: gold; margin-bottom: 15px; text-align: center;';
        panel.appendChild(title);

        if (!isOpen) {
            const msg = document.createElement('p');
            msg.textContent = 'لا يمكن تفعيل الأسلحة في هذا الوقت';
            msg.style.cssText = 'color: #aaa; text-align: center;';
            panel.appendChild(msg);
        } else {
            const grid = document.createElement('div');
            grid.className = 'weapons-grid';

            weapons.forEach(weapon => {
                const card = document.createElement('div');
                card.className = 'weapon-card';
                
                const rarityColor = '#' + RARITY_COLORS[weapon.rarity].toString(16).padStart(6, '0');
                card.style.borderColor = rarityColor;
                card.style.boxShadow = `0 0 15px ${rarityColor}44`;
                
                card.innerHTML = `
                    <div class="weapon-icon">${weapon.icon}</div>
                    <div class="weapon-name">${weapon.name}</div>
                    <div class="weapon-desc">${weapon.desc}</div>
                `;
                
                card.addEventListener('click', () => {
                    onUse(weapon);
                    overlay.remove();
                });
                
                grid.appendChild(card);
            });

            panel.appendChild(grid);
        }

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.className = 'weapons-close';
        closeBtn.addEventListener('click', () => overlay.remove());
        panel.appendChild(closeBtn);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }
}

