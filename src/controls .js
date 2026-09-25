import * as THREE from 'three';

export class Controls {
    constructor() {
        // حالة الأنالوج
        this.joystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickValue = { x: 0, y: 0 };   // من -1 إلى 1
        this.joystickTouchId = null;

        // حالة الأزرار
        this.buttonStates = {
            1: false, 2: false, 3: false, 4: false
        };
        this.buttonPressTime = { 1: 0, 2: 0, 3: 0, 4: 0 };
        this.buttonJustPressed = { 1: false, 2: false, 3: false, 4: false };

        // حالة الهجوم/الدفاع
        this.mode = 'attack';  // attack | defense

        this.initJoystick();
        this.initButtons();
    }

    initJoystick() {
        const joystick = document.getElementById('joystick-left');
        const knob = document.getElementById('joystick-knob');
        const maxDist = 50;

        const getCenter = () => {
            const r = joystick.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        };

        const onStart = (e) => {
            const touch = e.changedTouches ? e.changedTouches[0] : e;
            this.joystickTouchId = touch.identifier ?? 'mouse';
            this.joystickCenter = getCenter();
            this.joystickActive = true;
            this.updateKnob(touch, knob, maxDist);
        };

        const onMove = (e) => {
            if (!this.joystickActive) return;
            let touch = null;
            
            if (e.changedTouches) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === this.joystickTouchId) {
                        touch = e.changedTouches[i];
                        break;
                    }
                }
            } else {
                touch = e;
            }
            
            if (touch) this.updateKnob(touch, knob, maxDist);
        };

        const onEnd = (e) => {
            if (e.changedTouches) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === this.joystickTouchId) {
                        this.reset();
                        return;
                    }
                }
            } else {
                this.reset();
            }
        };

        joystick.addEventListener('touchstart', onStart, { passive: false });
        joystick.addEventListener('touchmove', onMove, { passive: false });
        joystick.addEventListener('touchend', onEnd);
        joystick.addEventListener('touchcancel', onEnd);

        // ماوس (للتجربة على الكمبيوتر)
        joystick.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
    }

    updateKnob(touch, knob, maxDist) {
        const dx = touch.clientX - this.joystickCenter.x;
        const dy = touch.clientY - this.joystickCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        
        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        
        knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        
        // القيم الطبيعية (-1 إلى 1)
        this.joystickValue.x = knobX / maxDist;
        this.joystickValue.y = knobY / maxDist;
    }

    reset() {
        this.joystickActive = false;
        this.joystickValue.x = 0;
        this.joystickValue.y = 0;
        this.joystickTouchId = null;
        const knob = document.getElementById('joystick-knob');
        knob.style.transform = 'translate(-50%, -50%)';
    }

    initButtons() {
        const buttons = document.querySelectorAll('.btn-action');
        
        buttons.forEach(btn => {
            const num = parseInt(btn.dataset.btn);
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.pressButton(num, btn);
            }, { passive: false });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.releaseButton(num, btn);
            }, { passive: false });
            
            btn.addEventListener('touchcancel', (e) => {
                this.releaseButton(num, btn);
            });

            // ماوس
            btn.addEventListener('mousedown', () => this.pressButton(num, btn));
            btn.addEventListener('mouseup', () => this.releaseButton(num, btn));
            btn.addEventListener('mouseleave', () => this.releaseButton(num, btn));
        });
    }

    pressButton(num, btn) {
        if (!this.buttonStates[num]) {
            this.buttonJustPressed[num] = true;
            this.buttonPressTime[num] = performance.now();
        }
        this.buttonStates[num] = true;
        btn.classList.add('pressed');
    }

    releaseButton(num, btn) {
        this.buttonStates[num] = false;
        btn.classList.remove('pressed');
    }

    // ============================================
    // استرجاع الاتجاه للاعب
    // ============================================
    getMoveDirection() {
        // من الأنالوج (y معكوس لأن الشاشة)
        // joystickValue.y > 0 = تحت على الشاشة = للخلف
        // joystickValue.y < 0 = فوق على الشاشة = للأمام
        
        const dir = new THREE.Vector3();
        
        if (Math.abs(this.joystickValue.x) > 0.1) dir.x = this.joystickValue.x;
        if (Math.abs(this.joystickValue.y) > 0.1) dir.z = this.joystickValue.y; // y الشاشة = z العالم
        
        // في اللعبة، الكاميرا على المحور z موجب، واللاعب يتحرك على x z
        // لو الأنالوج لفوق → dir.z = -1 (للأمام نحو المرمى المقابل)
        
        return dir;
    }

    isPressed(num) {
        return this.buttonStates[num];
    }

    wasJustPressed(num) {
        const val = this.buttonJustPressed[num];
        this.buttonJustPressed[num] = false;
        return val;
    }

    getHoldDuration(num) {
        if (!this.buttonStates[num]) return 0;
        return performance.now() - this.buttonPressTime[num];
    }

    // تبديل بين الهجوم والدفاع
    setMode(mode) {
        this.mode = mode;
        const label1 = document.getElementById('label-1');
        const label2 = document.getElementById('label-2');
        const label3 = document.getElementById('label-3');
        const label4 = document.getElementById('label-4');

        if (mode === 'attack') {
            if (label1) label1.textContent = 'جري';
            if (label2) label2.textContent = 'تسديد';
            if (label3) label3.textContent = 'تمرير';
            if (label4) label4.textContent = 'مهارات';
        } else {
            if (label1) label1.textContent = 'جري';
            if (label2) label2.textContent = 'تبديل';
            if (label3) label3.textContent = 'قطع';
            if (label4) label4.textContent = 'ضغط';
        }
    }
}

