// Next, React
import React from 'react';
import { FC, useState} from 'react';
import pkg from '../../../package.json';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN – central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake “feed card” top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};

const ToggleSwitch: FC<{ label: string, enabled: boolean, onChange: () => void }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between w-full p-4 bg-slate-800/80 rounded-xl border border-white/10">
        <span className="text-white font-bold">{label}</span>
        <button
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ enabled ? 'bg-cyan-400' : 'bg-slate-700' }`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ enabled ? 'translate-x-5' : 'translate-x-0' }`} />
        </button>
    </div>
);


// ✅ THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// Replace this entire GameSandbox component with the one AI generates.
// Keep the name `GameSandbox` and the `FC` type.

const GameSandbox: FC = () => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // UI State
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
    const [scores, setScores] = useState({ jen: 0, jason: 0 });
    const [displayMultiplier, setDisplayMultiplier] = useState(1.0);
    const [winner, setWinner] = useState<string | null>(null);
    const [gameMode, setGameMode] = useState<'duel' | 'survival' | 'target' | 'bossrush' | null>(null);
    const [highScores, setHighScores] = useState({ duel: 0, survival: 0, target: 0, bossrush: 0 });
    const [menuScreen, setMenuScreen] = useState<'main' | 'settings'>('main');
    const [settings, setSettings] = useState({ sound: true, vibration: true, difficulty: 'medium' });
    const [isPaused, setIsPaused] = useState(false);
    const [resumeCountdown, setResumeCountdown] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [totalScore, setTotalScore] = useState(0);
    const [displayedTotalScore, setDisplayedTotalScore] = useState(0);
    const [audioError, setAudioError] = useState<string | null>(null);

    // Game Loop Refs
    const requestRef = React.useRef<number>();
    const bgmRef = React.useRef<HTMLAudioElement | null>(null);
    const state = React.useRef({
        balls: [] as { x: number, y: number, vx: number, vy: number, radius: number, speed: number, stuck?: boolean, stuckOffsetX?: number, lastHitBy?: 'player' | 'ai' }[],
        paddleP: { x: 0.5, w: 0.2, h: 0.02 }, // Bottom (Jen)
        paddleO: { x: 0.5, w: 0.2, h: 0.02 }, // Top (Jasonn)
        bricks: [] as { x: number, y: number, w: number, h: number, active: boolean, color: string, vx?: number, isGolden?: boolean }[],

        particles: [] as { x: number, y: number, vx: number, vy: number, life: number, color: string, w?: number, h?: number }[],
        powerups: [] as { x: number, y: number, vy: number, type: 'wide' | 'fire' | 'multiball' | 'laser' | 'sticky' | 'bomb' | 'shield' | 'blackhole', active: boolean }[],
        activePowerup: null as 'wide' | 'fire' | 'laser' | 'sticky' | 'bomb' | 'blackhole' | null,
        shieldActive: false,
        lasers: [] as { x: number, y: number, vy: number }[],
        laserCooldown: 0,
        powerupTimer: 0,
        multiplier: 1.0,
        width: 0,
        height: 0,
        shake: 0,
        boss: { active: false, x: 0, y: 0, w: 0, h: 0, hp: 0, maxHp: 0, vx: 0 },
        bossProjectiles: [] as { x: number, y: number, vy: number, w: number, h: number }[],
        bossShootTimer: 0,
        bricksBroken: 0,
        audioCtx: null as AudioContext | null,
        scoreP: 0,
        scoreO: 0,
        suddenDeath: false,
        gameMode: null as 'duel' | 'survival' | 'target' | 'bossrush' | null,
        brickSpawnTimer: 0,
        aiTaunt: null as { text: string, timer: number } | null,
        bossLevel: 1,
        targetTimer: 0,
    });

    React.useEffect(() => {
        const savedScores = localStorage.getItem('arcadeHighScores');
        if (savedScores) {
            try { setHighScores(JSON.parse(savedScores)); } catch (e) { console.error(e); }
        }
        const savedSettings = localStorage.getItem('arcadeSettings');
        if (savedSettings) {
            try { setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) })); } catch (e) { console.error(e); }
        }
        const savedTotal = localStorage.getItem('arcadeTotalScore');
        if (savedTotal) {
            setTotalScore(parseInt(savedTotal, 10));
        }
    }, []);

    React.useEffect(() => {
        if (gameState === 'menu' && menuScreen === 'main') {
            let animationFrameId: number;
            const startTimestamp = performance.now();
            const duration = 2000;
            const startValue = 0;
            const endValue = totalScore;

            const step = (currentTime: number) => {
                const elapsed = currentTime - startTimestamp;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out
                setDisplayedTotalScore(Math.floor(startValue + (endValue - startValue) * ease));
                if (progress < 1) animationFrameId = requestAnimationFrame(step);
            };
            animationFrameId = requestAnimationFrame(step);
            return () => cancelAnimationFrame(animationFrameId);
        }
    }, [gameState, menuScreen, totalScore]);

    React.useEffect(() => {
        // 1. Initialize audio on launch (Menu)
        if (!bgmRef.current) {
            bgmRef.current = new Audio('bg-music.mp3');
            bgmRef.current.loop = true;
            bgmRef.current.volume = 0.3;
        }

        // 2. Attempt to play immediately (handles "play as i launch")
        const tryPlay = () => {
            if (bgmRef.current && settings.sound) {
                bgmRef.current.play().catch(() => {
                    // If blocked, wait for first click to start
                    const onInteract = () => {
                        if (bgmRef.current && settings.sound) bgmRef.current.play().catch(() => {});
                        window.removeEventListener('click', onInteract);
                    };
                    window.addEventListener('click', onInteract);
                });
            }
        };
        tryPlay();
    }, []);

    React.useEffect(() => {
        // 3. Manage Playback & Volume based on state
        if (!bgmRef.current) return;

        if (settings.sound) {
            bgmRef.current.play().catch(() => {});
            // Reduce volume when paused (0.1), otherwise normal (0.3)
            bgmRef.current.volume = isPaused ? 0.1 : 0.3;
        } else {
            bgmRef.current.pause();
        }
    }, [gameState, isPaused, settings.sound]);

    React.useEffect(() => {
        return () => { bgmRef.current?.pause(); };
    }, []);

    const initGame = (mode: 'duel' | 'survival' | 'target' | 'bossrush') => {
        if (!containerRef.current || !canvasRef.current) return;
        
        // Ensure audio is ready (don't reset if already playing from menu)
        if (!bgmRef.current) {
            bgmRef.current = new Audio('bg-music.mp3');
            bgmRef.current.loop = true;
        }
        // Reset volume to normal for gameplay
        bgmRef.current.volume = 0.3;

        if (settings.sound) {
            bgmRef.current.play().catch((e) => console.error("Start Game Audio Error:", e));
        }

        const { width, height } = containerRef.current.getBoundingClientRect();
        
        // Setup canvas resolution
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        state.current.width = width;
        state.current.height = height;

        setGameMode(mode);
        state.current.gameMode = mode;

        // Reset State
        state.current.multiplier = 1.0;
        state.current.balls = [{ 
            x: width / 2, 
            y: height - 50, 
            vx: (Math.random() - 0.5) * 4, 
            vy: -4, 
            radius: 5,
            speed: 4,
            stuck: false,
            stuckOffsetX: 0,
            lastHitBy: 'player',
        }];
        state.current.paddleP = { x: 0.5, w: 0.2, h: 0.02 };
        state.current.paddleO = { x: 0.5, w: 0.2, h: 0.02 };
        state.current.particles = [];
        state.current.powerups = [];
        state.current.activePowerup = null;
        state.current.powerupTimer = 0;
        state.current.lasers = [];
        state.current.laserCooldown = 0;
        state.current.shieldActive = false;
        state.current.boss = { active: false, x: 0, y: 0, w: 0, h: 0, hp: 0, maxHp: 0, vx: 0 };
        state.current.bossProjectiles = [];
        state.current.bossShootTimer = 0;
        state.current.bricksBroken = 0;
        state.current.scoreP = 0;
        state.current.scoreO = 0;
        state.current.suddenDeath = false;
        state.current.aiTaunt = null;
        state.current.bossLevel = 1;
        state.current.targetTimer = 60 * 60; // 60 seconds at 60fps
        setTimeLeft(60);

        // Build Wall (Middle 30%)
        const rows = (mode === 'target' || mode === 'bossrush') ? 0 : (mode === 'survival' ? 4 : 8);
        const cols = 6;
        const brickW = (width * 0.8) / cols;
        const brickH = (height * 0.25) / rows;
        const startX = width * 0.1;
        const startY = mode === 'survival' ? height * 0.15 : height * 0.35;
        
        const newBricks = [];
        const colors = ['#f472b6', '#c084fc', '#818cf8', '#22d3ee'];
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                newBricks.push({
                    x: startX + c * brickW,
                    y: startY + r * brickH,
                    w: brickW - 2,
                    h: brickH - 2,
                    active: true,
                    color: colors[r % colors.length]
                });
            }
        }
        state.current.bricks = newBricks;

        if (mode === 'survival' || mode === 'target' || mode === 'bossrush') {
            state.current.paddleO.w = 0; // Hide AI paddle
            state.current.brickSpawnTimer = mode === 'target' ? 60 : 400; 
        } else {
            state.current.paddleO.w = 0.2; // Ensure AI paddle is visible
        }

        if (mode === 'bossrush') {
            state.current.boss = {
                active: true,
                x: width / 2 - 60,
                y: height * 0.15,
                w: 120,
                h: 60,
                hp: 50,
                maxHp: 50,
                vx: 3
            };
        }
        
        setScores({ jen: 0, jason: 0 });
        setDisplayMultiplier(1.0);
        setGameState('playing');
        setWinner(null);
        setIsPaused(false);
        setResumeCountdown(0);
    };

    const spawnParticles = (x: number, y: number, color: string) => {
        for(let i=0; i<6; i++) {
            state.current.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1.0,
                color
            });
        }
    };

    const spawnSparkles = (x: number, y: number) => {
        for(let i=0; i<20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            state.current.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.2, // a bit longer life
                color: Math.random() > 0.3 ? '#facc15' : '#ffffff' // gold and white
            });
        }
    };

    const explodeBrick = (b: typeof state.current.bricks[0]) => {
        const cols = 4;
        const rows = 2;
        const w = b.w / cols;
        const h = b.h / rows;
        
        for(let i=0; i<cols; i++) {
            for(let j=0; j<rows; j++) {
                state.current.particles.push({
                    x: b.x + i * w,
                    y: b.y + j * h,
                    vx: (Math.random() - 0.5) * 10 + (b.vx || 0),
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0,
                    color: b.color,
                    w: w,
                    h: h
                });
            }
        }
    };

    const playBrickSound = () => {
        if (!settings.sound) return;
        const s = state.current;
        if (!s.audioCtx) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) s.audioCtx = new AudioContext();
        }
        if (!s.audioCtx) return;
        if (s.audioCtx.state === 'suspended') s.audioCtx.resume();

        const osc = s.audioCtx.createOscillator();
        const gain = s.audioCtx.createGain();

        osc.connect(gain);
        gain.connect(s.audioCtx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, s.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, s.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, s.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, s.audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(s.audioCtx.currentTime + 0.1);
    };

    const playAiScoreSound = () => {
        if (!settings.sound) return;
        const s = state.current;
        if (!s.audioCtx) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) s.audioCtx = new AudioContext();
        }
        if (!s.audioCtx) return;
        if (s.audioCtx.state === 'suspended') s.audioCtx.resume();

        const osc = s.audioCtx.createOscillator();
        const gain = s.audioCtx.createGain();

        osc.connect(gain);
        gain.connect(s.audioCtx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, s.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, s.audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.05, s.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, s.audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(s.audioCtx.currentTime + 0.2);
    };

    const playGoldenSound = () => {
        if (!settings.sound) return;
        const s = state.current;
        if (!s.audioCtx) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) s.audioCtx = new AudioContext();
        }
        if (!s.audioCtx) return;
        if (s.audioCtx.state === 'suspended') s.audioCtx.resume();

        const osc = s.audioCtx.createOscillator();
        const gain = s.audioCtx.createGain();

        osc.connect(gain);
        gain.connect(s.audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, s.audioCtx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, s.audioCtx.currentTime + 0.1); // A6
        gain.gain.setValueAtTime(0.1, s.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, s.audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(s.audioCtx.currentTime + 0.5);
    };

    const triggerAiTaunt = () => {
        const taunts = ["Nice try!", "Too slow!", "My point!", "Get rekt!", "Easy.", "Is that all?"];
        const s = state.current;
        s.aiTaunt = {
            text: taunts[Math.floor(Math.random() * taunts.length)],
            timer: 120 // 2 seconds at 60fps
        };
    };

    const vibrate = (pattern: number | number[]) => {
        if (settings.vibration && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };

    const updateSettings = (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('arcadeSettings', JSON.stringify(newSettings));
    };

    const addScore = (amount: number) => {
        setTotalScore(prev => {
            const newVal = prev + amount;
            localStorage.setItem('arcadeTotalScore', newVal.toString());
            return newVal;
        });
    };

    const handleGameOver = (winnerText: string) => {
        const s = state.current;
        const mode = s.gameMode;
        if (mode) {
            const saved = JSON.parse(localStorage.getItem('arcadeHighScores') || '{"duel":0,"survival":0,"target":0,"bossrush":0}');
            if (s.scoreP > (saved[mode] || 0)) {
                saved[mode] = s.scoreP;
                localStorage.setItem('arcadeHighScores', JSON.stringify(saved));
                setHighScores(saved);
            }
        }
        setGameState('gameover');
        setWinner(winnerText);
        vibrate([100, 50, 100]);
    };

    const update = () => {
        const s = state.current;
        const w = s.width;
        const h = s.height;
        const pY = h * (1 - 0.05);

        if (s.gameMode === 'survival') {
            s.brickSpawnTimer--;
            if (s.brickSpawnTimer <= 0) {
                const cols = 6;
                const brickW = (w * 0.8) / cols;
                const brickH = (h * 0.25) / 8; // Keep brick size consistent
                const startX = w * 0.1;
                const colors = ['#f472b6', '#c084fc', '#818cf8', '#22d3ee'];
                const newRow = [];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                for(let c=0; c<cols; c++) {
                    newRow.push({
                        x: startX + c * brickW,
                        y: h * 0.1, // Spawn near the top
                        w: brickW - 2,
                        h: brickH - 2,
                        active: true,
                        color: randomColor
                    });
                }
                s.bricks.push(...newRow);
                s.brickSpawnTimer = Math.max(100, 400 - (s.scoreP * 2)); // Spawn faster as score increases
            }
    
            const descentSpeed = 0.05 + (s.scoreP * 0.001); // Descend faster as score increases
            for (const b of s.bricks) {
                if (b.active) {
                    b.y += descentSpeed;
                    if (b.y + b.h >= pY) {
                        handleGameOver('The Wall');
                        return;
                    }
                }
            }
        } else if (s.gameMode === 'target') {
            s.targetTimer--;
            if (s.targetTimer % 60 === 0) {
                setTimeLeft(Math.ceil(s.targetTimer / 60));
            }
            if (s.targetTimer <= 0) {
                handleGameOver('Time Up!');
                return;
            }
            s.brickSpawnTimer--;
            if (s.brickSpawnTimer <= 0) {
                const size = w * 0.1;
                const isGolden = Math.random() < 0.15; // 15% chance

                if (isGolden) {
                    s.bricks.push({
                        x: Math.random() * (w - size),
                        y: Math.random() * (h * 0.5) + (h * 0.05),
                        w: size,
                        h: size * 0.6,
                        active: true,
                        color: '#facc15', // Gold
                        vx: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random()), // Faster
                        isGolden: true,
                    });
                } else {
                    const colors = ['#f472b6', '#c084fc', '#818cf8', '#22d3ee'];
                    s.bricks.push({
                        x: Math.random() * (w - size),
                        y: Math.random() * (h * 0.5) + (h * 0.05),
                        w: size,
                        h: size * 0.6,
                        active: true,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        vx: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random()),
                        isGolden: false,
                    });
                }
                // Spawn faster as score increases
                s.brickSpawnTimer = Math.max(30, 100 - (s.scoreP)); 
            }

            // Move targets
            for (let i = s.bricks.length - 1; i >= 0; i--) {
                const b = s.bricks[i];
                if (b.active && b.vx) {
                    b.x += b.vx;
                    if (b.x <= 0 || b.x + b.w >= w) {
                        b.vx *= -1;
                    }
                }
            }
        }

        // Boss Movement
        if (s.boss.active) {
            s.boss.x += s.boss.vx;
            if (s.boss.x <= 0 || s.boss.x + s.boss.w >= w) {
                s.boss.vx *= -1;
            }
            
            s.bossShootTimer--;
            if (s.bossShootTimer <= 0) {
                if (!s.bossProjectiles) s.bossProjectiles = [];
                s.bossProjectiles.push({
                    x: s.boss.x + s.boss.w / 2 - 4,
                    y: s.boss.y + s.boss.h,
                    vy: 5,
                    w: 8,
                    h: 16
                });
                s.bossShootTimer = 40 + Math.random() * 40;
            }
        }

        // Update Boss Projectiles
        const effectivePW_proj = s.activePowerup === 'wide' ? s.paddleP.w * 1.5 : s.paddleP.w;
        const pW_proj = w * effectivePW_proj;
        const pX_proj = w * s.paddleP.x - pW_proj/2;

        for (let i = (s.bossProjectiles?.length || 0) - 1; i >= 0; i--) {
            const p = s.bossProjectiles[i];
            p.y += p.vy;
            
            // Collision with Player
            if (p.y + p.h >= pY && p.y <= pY + 15 && p.x + p.w >= pX_proj && p.x <= pX_proj + pW_proj) {
                s.shake = 20;
                s.multiplier = 1.0;
                setDisplayMultiplier(1.0);
                s.bossProjectiles.splice(i, 1);
                vibrate([50, 30, 50]);
                continue;
            }
            
            if (p.y > h) s.bossProjectiles.splice(i, 1);
        }

        // Iterate backwards to safely remove balls
        for (let i = s.balls.length - 1; i >= 0; i--) {
            const ball = s.balls[i];

            if (ball.stuck) {
                const effectivePW = s.activePowerup === 'wide' ? s.paddleP.w * 1.5 : s.paddleP.w;
                const pCenter = w * s.paddleP.x;
                ball.x = pCenter + (ball.stuckOffsetX || 0);
                ball.y = h * (1 - 0.05) - ball.radius;
                continue;
            }

            // 1. Move Ball
            if (s.activePowerup === 'blackhole') {
                const dx = w / 2 - ball.x;
                const dy = h / 2 - ball.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 20) {
                    const force = 0.15 * s.multiplier;
                    ball.vx += (dx / dist) * force;
                    ball.vy += (dy / dist) * force;
                }
            }
            ball.x += ball.vx * s.multiplier;
            ball.y += ball.vy * s.multiplier;

            // Boss Collision
            if (s.boss.active) {
                if (ball.x + ball.radius > s.boss.x && ball.x - ball.radius < s.boss.x + s.boss.w &&
                    ball.y + ball.radius > s.boss.y && ball.y - ball.radius < s.boss.y + s.boss.h) {
                    
                    s.boss.hp--;
                    
                    const ratio = Math.max(0, s.boss.hp / s.boss.maxHp);
                    const r = Math.floor(239 + (168 - 239) * ratio);
                    const g = Math.floor(68 + (85 - 68) * ratio);
                    const b = Math.floor(68 + (247 - 68) * ratio);
                    const bossColor = `rgb(${r}, ${g}, ${b})`;
                    spawnParticles(ball.x, ball.y, bossColor);
                    s.shake = 5;
                    
                    const overlapX = Math.min(Math.abs(ball.x - s.boss.x), Math.abs(ball.x - (s.boss.x + s.boss.w)));
                    const overlapY = Math.min(Math.abs(ball.y - s.boss.y), Math.abs(ball.y - (s.boss.y + s.boss.h)));
                    
                    if (overlapX < overlapY) ball.vx *= -1;
                    else ball.vy *= -1;

                    if (s.boss.hp <= 0) {
                        s.boss.active = false;
                        s.shake = 20;
                        
                        if (s.gameMode === 'bossrush') {
                            s.scoreP += 500 * s.bossLevel;
                            addScore(500 * s.bossLevel);
                            setScores({ jen: s.scoreP, jason: s.scoreO });
                            s.bossLevel++;
                            
                            // Spawn next boss
                            s.boss = {
                                active: true,
                                x: w / 2 - 60,
                                y: h * 0.15,
                                w: 120,
                                h: 60,
                                hp: 50 + (s.bossLevel * 25),
                                maxHp: 50 + (s.bossLevel * 25),
                                vx: 3 + (s.bossLevel * 0.5)
                            };
                            
                            s.powerups.push({
                                x: s.boss.x + s.boss.w/2,
                                y: s.boss.y + s.boss.h/2,
                                vy: 2,
                                type: 'multiball',
                                active: true
                            });
                        } else {
                            s.powerups.push({
                                x: s.boss.x + s.boss.w/2,
                                y: s.boss.y + s.boss.h/2,
                                vy: 2,
                                type: 'multiball',
                                active: true
                            });
                        }
                    }
                }
            }

            // 2. Wall Collisions (Left/Right)
            if (ball.x < ball.radius) {
                ball.x = ball.radius;
                ball.vx *= -1;
            } else if (ball.x > w - ball.radius) {
                ball.x = w - ball.radius;
                ball.vx *= -1;
            }

            // 3. Paddle Collisions
            // Player (Bottom)
            const effectivePW = s.activePowerup === 'wide' ? s.paddleP.w * 1.5 : s.paddleP.w;
            const pW = w * effectivePW;
            const pX = w * s.paddleP.x - pW/2;
            
            if (ball.y + ball.radius >= pY && ball.y - ball.radius <= pY + 10) {
                if (ball.x >= pX && ball.x <= pX + pW) {
                    if (s.activePowerup === 'sticky') {
                        ball.stuck = true;
                        ball.stuckOffsetX = ball.x - (w * s.paddleP.x);
                        ball.vx = 0;
                        ball.vy = 0;
                        ball.lastHitBy = 'player';
                    } else {
                        ball.vy = -Math.abs(ball.vy);
                        // Add "English" (angle)
                        const hitPoint = (ball.x - (pX + pW/2)) / (pW/2);
                        ball.vx = hitPoint * 6;
                        s.multiplier = Math.min(3.0, s.multiplier + 0.1);
                        setDisplayMultiplier(parseFloat(s.multiplier.toFixed(1)));
                        s.shake = 5;
                        ball.lastHitBy = 'player';
                        vibrate(20);
                    }
                }
            }

            // Opponent (Top)
            if (s.gameMode === 'duel') {
                const oY = h * 0.05 + 10;
                const effectiveOW = s.activePowerup === 'wide' ? s.paddleO.w * 1.5 : s.paddleO.w;
                const oW = w * effectiveOW;
                const oX = w * s.paddleO.x - oW/2;

                if (ball.y - ball.radius <= oY && ball.y + ball.radius >= oY - 10) {
                    if (ball.x >= oX && ball.x <= oX + oW) {
                        ball.vy = Math.abs(ball.vy);
                        const hitPoint = (ball.x - (oX + oW/2)) / (oW/2);
                        ball.vx = hitPoint * 6;
                        s.multiplier = Math.min(3.0, s.multiplier + 0.1);
                        ball.lastHitBy = 'ai';
                        setDisplayMultiplier(parseFloat(s.multiplier.toFixed(1)));
                        vibrate(20);
                    }
                }
            } else { // survival mode top wall collision
                if (ball.y - ball.radius <= 0) {
                    ball.y = ball.radius;
                    ball.vy *= -1;
                }
            }

            // 4. Brick Collisions
            let hitBrick = false;
            for (let b of s.bricks) {
                if (!b.active) continue;
                if (ball.x > b.x && ball.x < b.x + b.w &&
                    ball.y > b.y && ball.y < b.y + b.h) {
                    
                    b.active = false;
                    hitBrick = true;
                    vibrate(10);
                    s.bricksBroken++;
                    if (s.gameMode === 'duel') {
                        if (ball.lastHitBy === 'ai') {
                            s.scoreO++;
                            triggerAiTaunt();
                            playAiScoreSound();
                        } else {
                            s.scoreP++;
                            addScore(1);
                            playBrickSound();
                        }
                    } else { // survival or target
                        const points = (s.gameMode === 'target' && b.isGolden) ? 5 : 1;
                        s.scoreP += points;
                        addScore(points);
                        if (s.gameMode === 'target' && b.isGolden) {
                            playGoldenSound();
                        } else {
                            playBrickSound();
                        }
                    }
                    setScores({ jen: s.scoreP, jason: s.scoreO });

                    if (s.bricksBroken > 0 && s.bricksBroken % 50 === 0 && !s.boss.active) {
                        s.boss = {
                            active: true,
                            x: w / 2 - 60,
                            y: h / 3,
                            w: 120,
                            h: 60,
                            hp: 20,
                            maxHp: 20,
                            vx: 2
                        };
                    }

                    if (s.gameMode === 'target' && b.isGolden) {
                        spawnSparkles(b.x + b.w / 2, b.y + b.h / 2);
                        explodeBrick(b);
                    } else {
                        explodeBrick(b);
                    }

                    if (s.activePowerup === 'bomb') {
                        for (let other of s.bricks) {
                            if (other.active && Math.abs(other.x - b.x) < b.w + 4 && Math.abs(other.y - b.y) < b.h + 4) {
                                other.active = false;
                                if (s.gameMode === 'target' && other.isGolden) {
                                    spawnSparkles(other.x + other.w / 2, other.y + other.h / 2);
                                    explodeBrick(other);
                                } else {
                                    explodeBrick(other);
                                }
                                s.bricksBroken++;
                                if (ball.lastHitBy === 'ai') {
                                    if (s.gameMode === 'duel') { s.scoreO++; playAiScoreSound(); }
                                    else playBrickSound();
                                } else {
                                    s.scoreP++;
                                    addScore(1);
                                    playBrickSound();
                                }
                                setScores({ jen: s.scoreP, jason: s.scoreO });
                            }
                        }
                        s.shake = 10;
                    }

                    // Spawn Powerup (15% chance)
                    if (Math.random() < 0.15) {
                        const types = ['wide', 'fire', 'multiball', 'laser', 'sticky', 'bomb', 'shield', 'blackhole'] as const;
                        s.powerups.push({
                            x: b.x + b.w/2,
                            y: b.y + b.h/2,
                            vy: ball.vy > 0 ? -2 : 2,
                            type: types[Math.floor(Math.random() * types.length)],
                            active: true
                        });
                    }
                    
                    // Simple reflection logic
                    // If fireball, don't reflect
                    if (s.activePowerup !== 'fire') {
                        const overlapX = Math.min(Math.abs(ball.x - b.x), Math.abs(ball.x - (b.x + b.w)));
                        const overlapY = Math.min(Math.abs(ball.y - b.y), Math.abs(ball.y - (b.y + b.h)));
                        
                        if (overlapX < overlapY) ball.vx *= -1;
                        else ball.vy *= -1;
                    }
                    
                    break; // Only hit one brick per frame to prevent tunneling issues
                }
            }
            if (hitBrick) {
                s.multiplier += 0.02;
                setDisplayMultiplier(parseFloat(s.multiplier.toFixed(1)));
            }

            // 5. Scoring (Goals)
            if (ball.y > h + 20) {
                if (s.shieldActive) {
                    s.shieldActive = false;
                    ball.y = pY - ball.radius;
                    ball.vy *= -1;
                    s.shake = 10;
                } else {
                    if ((s.gameMode === 'survival' || s.gameMode === 'bossrush') && s.balls.length === 1) {
                        handleGameOver(s.gameMode === 'survival' ? 'The Void' : 'Defeated');
                        return;
                    }
                    s.balls.splice(i, 1);
                }
            } else if (ball.y < -20) {
                s.balls.splice(i, 1);
            }
        }

        if (s.balls.length === 0) {
            if (s.gameMode === 'survival' || s.gameMode === 'bossrush') {
                handleGameOver(s.gameMode === 'survival' ? 'The Void' : 'Defeated');
                return;
            } else {
                resetBall(true);
            }
        }

        // Laser Logic
        if (s.activePowerup === 'laser') {
            if (s.laserCooldown > 0) s.laserCooldown--;
            else {
                const effectivePW = s.paddleP.w;
                const pW = w * effectivePW;
                const pX = w * s.paddleP.x - pW/2;
                s.lasers.push({ x: pX, y: pY, vy: -8 });
                s.lasers.push({ x: pX + pW, y: pY, vy: -8 });

                if (s.gameMode === 'duel') {
                    const effectiveOW = s.paddleO.w;
                    const oW = w * effectiveOW;
                    const oX = w * s.paddleO.x - oW/2;
                    const oY = h * 0.05 + 10;
                    s.lasers.push({ x: oX, y: oY, vy: 8 });
                    s.lasers.push({ x: oX + oW, y: oY, vy: 8 });
                    s.laserCooldown = 30;
                }
            }
        }

        // Update Lasers
        for (let i = s.lasers.length - 1; i >= 0; i--) {
            const l = s.lasers[i];
            l.y += l.vy;
            let hit = false;
            for (let b of s.bricks) {
                if (!b.active) continue;
                if (l.x > b.x && l.x < b.x + b.w && l.y > b.y && l.y < b.y + b.h) {
                    b.active = false;
                    if (s.gameMode === 'target' && b.isGolden) {
                        spawnSparkles(b.x + b.w / 2, b.y + b.h / 2);
                        explodeBrick(b);
                    } else {
                        explodeBrick(b);
                    }
                    hit = true;
                    s.bricksBroken++;
                    if (s.gameMode === 'duel' && l.vy > 0) { // AI Laser
                        s.scoreO++;
                        triggerAiTaunt();
                        playAiScoreSound();
                    } else { // Player Laser (or survival)
                        s.scoreP++;
                        addScore(1);
                        playBrickSound();
                    }
                    setScores({ jen: s.scoreP, jason: s.scoreO });

                    if (Math.random() < 0.1) {
                        const types = ['wide', 'fire', 'multiball', 'laser', 'blackhole'] as const;
                        s.powerups.push({
                            x: b.x + b.w/2,
                            y: b.y + b.h/2,
                            vy: l.vy > 0 ? -2 : 2,
                            type: types[Math.floor(Math.random() * types.length)],
                            active: true
                        });
                    }
                    break;
                }
            }
            if (hit || l.y < 0 || l.y > h) s.lasers.splice(i, 1);
        }

        // 6. AI Movement (Predictive tracking)
        if (s.gameMode === 'duel') {
            let targetX = s.paddleO.x;
            const balls = s.balls;
            const powerups = s.powerups;
            const aiY = h * 0.05 + 10; // Approximate impact Y
            
            // 1. Identify Threats (Balls moving towards AI)
            const threats = balls
                .filter(b => b.vy < 0 && b.y > aiY)
                .sort((a, b) => a.y - b.y); // Closest to top first

            // 2. Identify Opportunities (Powerups)
            const goodPowerups = powerups
                .filter(p => p.vy < 0 && p.type !== 'bomb' && p.y > aiY)
                .sort((a, b) => a.y - b.y);

            let chosenBall = threats.length > 0 ? threats[0] : null;

            if (chosenBall) {
                // Predictive tracking
                const dy = chosenBall.y - aiY;
                const time = dy / Math.abs(chosenBall.vy);
                let predX = chosenBall.x + chosenBall.vx * time;
                
                // Handle wall bounces
                const r = chosenBall.radius;
                let bounces = 0;
                while ((predX < r || predX > w - r) && bounces < 5) {
                    if (predX < r) predX = r + (r - predX);
                    if (predX > w - r) predX = (w - r) - (predX - (w - r));
                    bounces++;
                }
                targetX = predX / w;
            } else if (goodPowerups.length > 0) {
                // Aim for powerup
                targetX = goodPowerups[0].x / w;
            } else {
                // Track closest ball loosely or return to center
                const closestBall = balls.sort((a, b) => a.y - b.y)[0];
                if (closestBall) {
                    targetX = closestBall.x / w;
                } else {
                    targetX = 0.5;
                }
            }

            // Dynamic reaction speed
            const dist = Math.abs(targetX - s.paddleO.x);
            
            let baseLerp = 0.1;
            if (settings.difficulty === 'easy') baseLerp = 0.05;
            else if (settings.difficulty === 'hard') baseLerp = 0.18;
            const lerpFactor = dist > 0.2 ? baseLerp * 1.5 : baseLerp;

            s.paddleO.x += (targetX - s.paddleO.x) * lerpFactor;
            // Clamp AI
            const effectiveOW = s.activePowerup === 'wide' ? s.paddleO.w * 1.5 : s.paddleO.w;
            s.paddleO.x = Math.max(effectiveOW/2, Math.min(1 - effectiveOW/2, s.paddleO.x));
        }

        // 7. Particles
        for (let p of s.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
        }
        s.particles = s.particles.filter(p => p.life > 0);

        // 8. Powerups
        const effectivePW = s.activePowerup === 'wide' ? s.paddleP.w * 1.5 : s.paddleP.w;
        const pW = w * effectivePW;
        const pX = w * s.paddleP.x - pW/2;

        for (let p of s.powerups) {
            p.y += p.vy * s.multiplier;
            // Collision with player paddle
            if (p.active && p.y >= pY && p.y <= pY + 20 && p.x >= pX && p.x <= pX + pW) {
                p.active = false;
                if (p.type === 'shield') {
                    s.shieldActive = true;
                }
                else if (p.type === 'multiball') {
                    const newBalls: typeof s.balls = [];
                    s.balls?.forEach(b => {
                        newBalls.push({ ...b, vx: b.vx - 2, vy: b.vy });
                        newBalls.push({ ...b, vx: b.vx + 2, vy: b.vy });
                    });
                    s.balls.push(...newBalls);
                } else {
                    s.activePowerup = p.type;
                    s.powerupTimer = 600; // 10 seconds at 60fps
                }
            }

            // Collision with AI paddle
            if (s.gameMode === 'duel') {
                const effectiveOW = s.activePowerup === 'wide' ? s.paddleO.w * 1.5 : s.paddleO.w;
                const oY = h * 0.05;
                const oW = w * effectiveOW;
                const oX = w * s.paddleO.x - oW/2;
                if (p.active && p.y <= oY + 20 && p.y >= oY && p.x >= oX && p.x <= oX + oW) {
                    p.active = false;
                    if (p.type === 'shield') {
                        // AI consumes shield (denies player)
                    } else if (p.type === 'multiball') {
                        const newBalls: typeof s.balls = [];
                        s.balls?.forEach(b => {
                            newBalls.push({ ...b, vx: b.vx - 2, vy: b.vy });
                            newBalls.push({ ...b, vx: b.vx + 2, vy: b.vy });
                        });
                        s.balls.push(...newBalls);
                    } else {
                        s.activePowerup = p.type;
                        s.powerupTimer = 600;
                    }
                }
            }

            if (p.y > h) p.active = false;
        }
        s.powerups = s.powerups.filter(p => p.active);

        if (s.powerupTimer > 0) {
            s.powerupTimer--;
            if (s.powerupTimer <= 0) s.activePowerup = null;
        }

        // Shake decay
        if (s.shake > 0) s.shake *= 0.9;
        if (s.shake < 0.5) s.shake = 0;

        // AI Taunt timer
        if (s.aiTaunt && s.aiTaunt.timer > 0) {
            s.aiTaunt.timer--;
        } else if (s.aiTaunt) {
            s.aiTaunt = null;
        }

        // Win Condition
        if (s.gameMode === 'duel' && s.bricks.length > 0 && s.bricks.every(b => !b.active)) {
            if (s.scoreP === s.scoreO) {
                if (!s.suddenDeath) {
                    s.suddenDeath = true;
                    s.shake = 30;
                    s.multiplier = Math.max(s.multiplier, 1.5);
                    
                    // Spawn Sudden Death Bricks
                    const cx = w / 2;
                    const cy = h / 2;
                    const size = w * 0.08;
                    const offsets = [
                        {x:0, y:0}, {x:-1, y:0}, {x:1, y:0}, {x:0, y:-1}, {x:0, y:1}
                    ];
                    offsets.forEach(o => {
                        s.bricks.push({
                            x: cx + o.x * size - size/2,
                            y: cy + o.y * size - size/2,
                            w: size - 2,
                            h: size - 2,
                            active: true,
                            color: '#ef4444'
                        });
                    });
                    resetBall(Math.random() > 0.5);
                }
            } else {
                handleGameOver(s.scoreP > s.scoreO ? 'Player' : 'CPU');
            }
        }
    };

    const releaseBalls = () => {
        const s = state.current;
        if (gameState !== 'playing' || isPaused) return;
        
        s.balls?.forEach(ball => {
            if (ball.stuck) {
                ball.stuck = false;
                ball.vy = -4; // Launch up
                // Calculate angle based on offset relative to paddle width
                const effectivePW = s.activePowerup === 'wide' ? s.paddleP.w * 1.5 : s.paddleP.w;
                const pW = s.width * effectivePW;
                const hitPoint = (ball.stuckOffsetX || 0) / (pW/2);
                ball.vx = hitPoint * 6;
            }
        });
    };

    const resetBall = (playerLost: boolean) => {
        const s = state.current;
        s.balls = [{
            x: s.width / 2,
            y: s.height / 2,
            vx: 0,
            vy: playerLost ? -4 : 4,
            radius: 5,
            speed: 4,
            stuck: false,
            stuckOffsetX: 0,
            lastHitBy: playerLost ? 'ai' : 'player',
        }];
        s.multiplier = 1.0;
        setDisplayMultiplier(1.0);
        s.activePowerup = null;
        s.powerupTimer = 0;
        s.powerups = [];
        s.shieldActive = false;
        s.lasers = [];
    };

    const draw = () => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        const s = state.current;

        // Background
        let bgDrawn = false;
        if (s.activePowerup) {
            const bgColors: Record<string, string> = {
                wide: '#022c22',      // teal-950
                fire: '#431407',      // orange-950
                laser: '#4c0519',     // rose-950
                sticky: '#422006',    // yellow-950
                bomb: '#450a0a',      // red-950
                blackhole: '#1e1b4b'  // indigo-950
            };
            const color = bgColors[s.activePowerup];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, s.width, s.height);
                bgDrawn = true;
            }
        } else if (s.shieldActive) {
            ctx.fillStyle = '#172554'; // blue-950
            ctx.fillRect(0, 0, s.width, s.height);
            bgDrawn = true;
        }

        if (!bgDrawn) {
            ctx.clearRect(0, 0, s.width, s.height);
        }

        // Shake offset
        const dx = (Math.random() - 0.5) * s.shake;
        const dy = (Math.random() - 0.5) * s.shake;
        ctx.save();
        ctx.translate(dx, dy);

        // Sudden Death Text
        if (s.suddenDeath) {
            ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.font = '900 40px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SUDDEN', s.width / 2, s.height / 2 - 25);
            ctx.fillText('DEATH', s.width / 2, s.height / 2 + 25);
        }

        // Draw Bricks
        s.bricks?.forEach(b => {
            if (!b.active) return;
            ctx.fillStyle = b.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.shadowBlur = 0;
        });

        // Draw Boss
        if (s.boss.active) {
            const ratio = Math.max(0, s.boss.hp / s.boss.maxHp);
            const r = Math.floor(239 + (168 - 239) * ratio);
            const g = Math.floor(68 + (85 - 68) * ratio);
            const b = Math.floor(68 + (247 - 68) * ratio);
            const bossColor = `rgb(${r}, ${g}, ${b})`;

            ctx.fillStyle = bossColor;
            ctx.shadowBlur = 20;
            ctx.shadowColor = bossColor;
            ctx.fillRect(s.boss.x, s.boss.y, s.boss.w, s.boss.h);
            ctx.shadowBlur = 0;
            
            // Health bar
            ctx.fillStyle = '#000';
            ctx.fillRect(s.boss.x, s.boss.y - 10, s.boss.w, 6);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(s.boss.x, s.boss.y - 10, s.boss.w * (s.boss.hp / s.boss.maxHp), 6);
            
            // Face
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(s.boss.x + s.boss.w * 0.3, s.boss.y + s.boss.h * 0.4, 6, 0, Math.PI*2);
            ctx.arc(s.boss.x + s.boss.w * 0.7, s.boss.y + s.boss.h * 0.4, 6, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(s.boss.x + s.boss.w * 0.3, s.boss.y + s.boss.h * 0.7);
            ctx.lineTo(s.boss.x + s.boss.w * 0.7, s.boss.y + s.boss.h * 0.7);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw Boss Projectiles
        ctx.fillStyle = '#fbbf24';
        s.bossProjectiles?.forEach(p => {
            ctx.fillRect(p.x, p.y, p.w, p.h);
        });

        // Draw Lasers
        ctx.fillStyle = '#f43f5e';
        s.lasers?.forEach(l => {
            ctx.fillRect(l.x - 2, l.y, 4, 10);
        });

        // Draw Powerups
        s.powerups?.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = p.type === 'wide' ? '#4ade80' : (p.type === 'fire' ? '#f97316' : (p.type === 'multiball' ? '#c084fc' : (p.type === 'laser' ? '#f43f5e' : (p.type === 'sticky' ? '#facc15' : (p.type === 'bomb' ? '#ef4444' : (p.type === 'blackhole' ? '#1e293b' : '#3b82f6'))))));
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.type === 'wide' ? 'W' : (p.type === 'fire' ? 'F' : (p.type === 'multiball' ? 'M' : (p.type === 'laser' ? 'L' : (p.type === 'sticky' ? 'S' : (p.type === 'bomb' ? 'B' : (p.type === 'blackhole' ? 'BH' : 'H')))))), p.x, p.y);
        });

        const pY = s.height * (1 - 0.05);

        // Draw Shield
        if (s.shieldActive) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'; // a semi-transparent blue
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#3b82f6';
            ctx.fillRect(0, pY - 5, s.width, 5);
            ctx.shadowBlur = 0;
        }

        // Draw Black Hole Effect
        if (s.activePowerup === 'blackhole') {
            ctx.beginPath();
            ctx.arc(s.width / 2, s.height / 2, 30, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)'; // Purple glow
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // Draw Paddles
        ctx.fillStyle = '#38bdf8'; // Cyan for Player
        const effectivePW = s.activePowerup === 'wide' ? s.paddleP.w * 1.5 : s.paddleP.w;
        const pW = s.width * effectivePW;
        const pX = s.width * s.paddleP.x - pW/2;
        ctx.fillRect(pX, pY, pW, 10);

        if (s.gameMode === 'duel') {
            ctx.fillStyle = '#f472b6'; // Pink for Opponent
            const effectiveOW = s.activePowerup === 'wide' ? s.paddleO.w * 1.5 : s.paddleO.w;
            const oW = s.width * effectiveOW;
            const oX = s.width * s.paddleO.x - oW/2;
            const oY = s.height * 0.05;
            ctx.fillRect(oX, oY, oW, 10);

            // Draw AI Taunt Bubble
            if (s.aiTaunt) {
                ctx.font = 'bold 12px sans-serif';
                const textWidth = ctx.measureText(s.aiTaunt.text).width;
                const bubbleW = textWidth + 20;
                const bubbleH = 24;
                const bubbleX = s.width * s.paddleO.x - bubbleW / 2;
                const bubbleY = oY + 15; // Below the paddle

                // Clamp to screen
                const clampedX = Math.max(5, Math.min(s.width - bubbleW - 5, bubbleX));

                // Fade out effect
                const alpha = Math.min(1, s.aiTaunt.timer / 30);

                // Bubble
                ctx.fillStyle = `rgba(244, 114, 182, ${alpha * 0.9})`; // Pink with alpha
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (typeof (ctx as any).roundRect === 'function') {
                    (ctx as any).roundRect(clampedX, bubbleY, bubbleW, bubbleH, 8);
                } else {
                    ctx.rect(clampedX, bubbleY, bubbleW, bubbleH);
                }
                ctx.fill();
                ctx.stroke();

                // Text
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(s.aiTaunt.text, clampedX + bubbleW / 2, bubbleY + bubbleH / 2);
            }
        }

        // Draw Ball (with trail effect)
        s.balls?.forEach(ball => {
            const playerColor = '#38bdf8'; // Cyan
            const aiColor = '#f472b6'; // Pink
            const glowColor = ball.lastHitBy === 'player' ? playerColor : aiColor;

            ctx.shadowBlur = 15;
            ctx.shadowColor = glowColor;

            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = s.activePowerup === 'fire' ? '#f97316' : (s.activePowerup === 'bomb' ? '#ef4444' : (s.activePowerup === 'blackhole' ? '#a855f7' : '#fff'));
            ctx.fill();

            ctx.shadowBlur = 0;

            // Simple trail
            const trailBaseColor = ball.lastHitBy === 'player' 
                ? 'rgba(56, 189, 248, 0.4)' // Cyan with alpha
                : 'rgba(244, 114, 182, 0.4)'; // Pink with alpha

            ctx.beginPath();
            ctx.moveTo(ball.x, ball.y);
            ctx.lineTo(ball.x - ball.vx * 3, ball.y - ball.vy * 3);
            ctx.strokeStyle = s.activePowerup === 'fire' ? 'rgba(249,115,22,0.4)' : (s.activePowerup === 'bomb' ? 'rgba(239,68,68,0.4)' : (s.activePowerup === 'blackhole' ? 'rgba(168,85,247,0.4)' : trailBaseColor));
            ctx.lineWidth = ball.radius * 2;
            ctx.stroke();
        });

        // Draw Particles
        s.particles?.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.w || 3, p.h || 3);
        });
        ctx.globalAlpha = 1.0;

        ctx.restore();
    };

    const loop = () => {
        if (gameState === 'playing') {
            if (!isPaused) {
                update();
            } else if (state.current.shake > 0) {
                // Allow shake to decay even when paused (for countdown effect)
                state.current.shake *= 0.9;
                if (state.current.shake < 0.5) state.current.shake = 0;
            }
        }
        draw();
        requestRef.current = requestAnimationFrame(loop);
    };

    React.useEffect(() => {
        requestRef.current = requestAnimationFrame(loop);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, isPaused, settings]);

    React.useEffect(() => {
        if (resumeCountdown > 0) {
            // Trigger shake and vibration on each count
            state.current.shake = 15;
            vibrate(50);

            const timer = setTimeout(() => {
                if (resumeCountdown === 1) {
                    setIsPaused(false);
                }
                setResumeCountdown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resumeCountdown]);

    // Input Handling
    const handleInput = (clientX: number) => {
        if (!containerRef.current || isPaused) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const normalized = x / rect.width;
        // Clamp paddle
        const halfW = state.current.paddleP.w / 2;
        state.current.paddleP.x = Math.max(halfW, Math.min(1 - halfW, normalized));
    };

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">
            {/* Audio Debug Error Message */}
            {audioError && (
                <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-[10px] font-bold p-1 text-center z-50 animate-pulse">
                    ⚠️ {audioError} - Check console (F12) for details
                </div>
            )}

            {/* Background Ambient Glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[50%] bg-purple-900/20 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[140%] h-[50%] bg-cyan-900/20 blur-[100px] pointer-events-none" />

            {/* Header Scoreboard */}
            <div className={`relative shrink-0 w-full flex items-center px-3 py-2 bg-slate-900/90 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg z-10 ${gameMode === 'duel' || gameMode === 'target' ? 'justify-between' : 'justify-center'}`}>
                {gameMode === 'duel' && (
                    <div className="flex flex-col items-start w-1/3">
                        <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider">CPU</span>
                        <span className="text-xl font-black text-white leading-none">{scores.jason}</span>
                    </div>
                )}
                {gameMode === 'target' && (
                    <div className="flex flex-col items-start w-1/3">
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">TIME</span>
                        <span className="text-xl font-black text-white leading-none">{timeLeft}</span>
                    </div>
                )}
                
                {/* Multiplier Bubble */}
                <div className={`w-1/3 flex justify-center`}>
                    <div className={`
                        flex flex-col items-center justify-center w-10 h-10 rounded-full 
                        bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg border-2 border-white/20
                        transition-transform duration-100
                        ${displayMultiplier > 1.5 ? 'scale-110' : 'scale-100'}
                    `}>
                        <span className="text-[8px] font-bold text-black/60 leading-none">SPEED</span>
                        <span className="text-xs font-black text-black leading-none">{displayMultiplier}x</span>
                    </div>
                </div>

                <div className={`flex flex-col w-1/3 ${gameMode === 'duel' ? 'items-end' : 'items-center'}`}>
                    <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
                        {gameMode === 'duel' ? 'PLAYER' : 'SCORE'}
                    </span>
                    <span className="text-xl font-black text-white leading-none">{scores.jen}</span>
                </div>
            </div>

            {/* Game Container */}
            <div 
                ref={containerRef}
                className="relative flex-1 w-full mt-2 mb-2 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl touch-none ring-1 ring-white/5"
                onMouseMove={(e) => handleInput(e.clientX)}
                onTouchMove={(e) => handleInput(e.touches[0].clientX)}
                onTouchStart={(e) => handleInput(e.touches[0].clientX)}
                onClick={releaseBalls}
            >
                <canvas ref={canvasRef} className="block w-full h-full" />

                {/* Pause Button */}
                {gameState === 'playing' && !isPaused && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsPaused(true); }}
                        className="absolute top-3 right-3 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm transition-all z-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                )}

                {/* Pause Overlay */}
                {isPaused && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm z-30">
                        {resumeCountdown > 0 ? (
                            <h2 className="text-8xl font-black text-white tracking-widest drop-shadow-lg animate-pulse">
                                {resumeCountdown}
                            </h2>
                        ) : (
                            <>
                                <h2 className="text-4xl font-black text-white mb-8 tracking-widest drop-shadow-lg">PAUSED</h2>
                                <div className="flex flex-col gap-4 w-48">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setResumeCountdown(3); }}
                                        className="px-6 py-3 bg-white text-black font-black rounded-full hover:scale-105 transition-transform shadow-lg"
                                    >
                                        RESUME
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsPaused(false);
                                            setGameState('menu');
                                            setMenuScreen('main');
                                        }}
                                        className="px-6 py-3 bg-slate-800 text-white font-bold rounded-full border border-white/10 hover:bg-slate-700 transition-colors"
                                    >
                                        QUIT
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Start / Menu Overlay */}
                {gameState === 'menu' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-20 p-6 transition-opacity duration-300">
                        {menuScreen === 'main' && (
                            <>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
                                
                                <button 
                                    onClick={() => setMenuScreen('settings')} 
                                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/10 rounded-full z-30"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>

                                <h2 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-white to-pink-400 mb-4 drop-shadow-sm text-center mt-4">
                                    ARCADE<br/>ARENA
                                </h2>
                                <div className="mb-6 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Lifetime Score</span>
                                    <span className="text-lg font-black text-cyan-400 font-mono">{displayedTotalScore.toLocaleString()}</span>
                                </div>
                                <div className="w-full grid grid-cols-2 gap-3 max-w-xs">
                                    {/* Duel Button */}
                                    <button onClick={() => initGame('duel')} className="group relative aspect-square flex flex-col items-center justify-center text-center p-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 hover:border-cyan-400/50 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] active:scale-[0.98]">
                                        <span className="text-3xl font-black text-cyan-400/50 group-hover:text-cyan-300 transition-colors">VS</span>
                                        <h3 className="text-sm font-bold text-white mt-1">Demolition Duel</h3>
                                        <span className="absolute bottom-2 text-[10px] text-slate-500 font-mono">HI: {highScores.duel}</span>
                                    </button>

                                    {/* Survival Button */}
                                    <button onClick={() => initGame('survival')} className="group relative aspect-square flex flex-col items-center justify-center text-center p-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 hover:border-amber-400/50 transition-all hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] active:scale-[0.98]">
                                        <span className="text-3xl font-black text-amber-400/50 group-hover:text-amber-300 transition-colors">SOLO</span>
                                        <h3 className="text-sm font-bold text-white mt-1">Brickfall Survival</h3>
                                        <span className="absolute bottom-2 text-[10px] text-slate-500 font-mono">HI: {highScores.survival}</span>
                                    </button>

                                    {/* Target Button */}
                                    <button onClick={() => initGame('target')} className="group relative aspect-square flex flex-col items-center justify-center text-center p-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 hover:border-emerald-400/50 transition-all hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] active:scale-[0.98]">
                                        <span className="text-3xl font-black text-emerald-400/50 group-hover:text-emerald-300 transition-colors">AIM</span>
                                        <h3 className="text-sm font-bold text-white mt-1">Target Practice</h3>
                                        <span className="absolute bottom-2 text-[10px] text-slate-500 font-mono">HI: {highScores.target}</span>
                                    </button>

                                    {/* Boss Rush Button */}
                                    <button onClick={() => initGame('bossrush')} className="group relative aspect-square flex flex-col items-center justify-center text-center p-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 hover:border-rose-400/50 transition-all hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] active:scale-[0.98]">
                                        <span className="text-3xl font-black text-rose-400/50 group-hover:text-rose-300 transition-colors">BOSS</span>
                                        <h3 className="text-sm font-bold text-white mt-1">Boss Rush</h3>
                                        <span className="absolute bottom-2 text-[10px] text-slate-500 font-mono">HI: {highScores.bossrush}</span>
                                    </button>
                                </div>
                            </>
                        )}
                        {menuScreen === 'settings' && (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                <h2 className="text-2xl font-black text-white mb-8">SETTINGS</h2>
                                <div className="w-full flex flex-col gap-3 max-w-xs mb-8">
                                    <ToggleSwitch label="Sound" enabled={settings.sound} onChange={() => updateSettings('sound', !settings.sound)} />
                                    <ToggleSwitch label="Vibration" enabled={settings.vibration} onChange={() => updateSettings('vibration', !settings.vibration)} />
                                    
                                    {/* Debug Audio Button */}
                                    <button 
                                        onClick={() => {
                                            const audio = new Audio('bg-music.mp3');
                                            audio.volume = 0.5;
                                            audio.play()
                                                .then(() => alert("🎵 Success! Music is playing. If you hear this, the file is correct."))
                                                .catch(e => alert("❌ Error: " + e.message + "\n\nMake sure 'bg-music.mp3' is in the 'public' folder."));
                                        }}
                                        className="w-full py-3 mt-2 bg-slate-800 text-cyan-400 font-bold rounded-xl border border-cyan-400/30 hover:bg-slate-700 transition-colors"
                                    >
                                        Test Music File
                                    </button>

                                    <div className="flex flex-col gap-2 p-4 bg-slate-800/80 rounded-xl border border-white/10">
                                        <span className="text-white font-bold">Difficulty (CPU)</span>
                                        <div className="flex gap-2">
                                            {['easy', 'medium', 'hard'].map((d) => (
                                                <button
                                                    key={d}
                                                    onClick={() => updateSettings('difficulty', d)}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
                                                        settings.difficulty === d 
                                                            ? 'bg-cyan-400 text-black shadow-lg' 
                                                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setMenuScreen('main')} className="px-8 py-3 bg-white text-black font-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform">
                                    DONE
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameState === 'gameover' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-20 p-6">
                        <div className="text-center mb-8">
                            <h2 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-rose-400 to-red-600 drop-shadow-lg mb-2">
                                GAME OVER
                            </h2>
                            <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                <p className="text-sm font-medium text-slate-300">
                                    {gameMode === 'survival' || gameMode === 'target' || gameMode === 'bossrush'
                                        ? `You destroyed`
                                        : winner === 'Player' ? 'Victory!' : 'Defeat'}
                                </p>
                                <p className="text-3xl font-black text-white mt-1">
                                    {gameMode === 'survival' || gameMode === 'target' || gameMode === 'bossrush'
                                        ? scores.jen
                                        : winner === 'Player' ? 'YOU WON' : 'AI WINS'}
                                </p>
                                {(gameMode === 'survival' || gameMode === 'target' || gameMode === 'bossrush') && (
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">
                                        {gameMode === 'target' ? 'Targets' : (gameMode === 'bossrush' ? 'Score' : 'Bricks')}
                                    </p>
                                )}
                                <div className="mt-3 pt-2 border-t border-white/10 w-full flex justify-between items-center gap-8">
                                    <span className="text-xs text-slate-400 uppercase tracking-wider">High Score</span>
                                    <span className="text-sm font-bold text-white font-mono">{highScores[gameMode!]}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <button 
                                // Go back to menu instead of restarting same mode
                                onClick={() => { setGameState('menu'); setMenuScreen('main'); }}
                                className="group relative w-full px-8 py-4 bg-white text-black font-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transition-all active:scale-95"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    PLAY AGAIN
                                    <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </span>
                            </button>
                            
                            <button 
                                onClick={() => {
                                    const text = `I scored ${scores.jen} in ${gameMode} mode on Arcade Arena! 🎮✨ #ArcadeArena`;
                                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className="w-full px-8 py-3 bg-[#1DA1F2] text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                SHARE SCORE
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Hint */}
            <div className="shrink-0 flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] text-slate-400 font-medium backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"/>
                <span>Drag to move</span>
                <span className="text-slate-600">•</span>
                <span>Click to release</span>
            </div>
        </div>
    );
};