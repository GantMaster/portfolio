document.addEventListener('DOMContentLoaded', () => {

    // ===== счётчик посещений (как в старые добрые времена) =====
    const STORAGE_KEY = 'web1_hit_counter';
    let hits = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (isNaN(hits)) hits = 4210;
    hits += 1;
    localStorage.setItem(STORAGE_KEY, String(hits));
    const padded = String(hits).padStart(6, '0');

    document.querySelectorAll('#hitCounter, #hitCounterInline').forEach(el => {
        el.textContent = padded;
    });

    // ===== даты =====
    const now = new Date();
    document.querySelectorAll('#year, #yearFooter').forEach(el => {
        el.textContent = now.getFullYear();
    });

    // ===== огненный шлейф за курсором, как делали на "пылающем" тексте в старом вебе =====
    let lastSpawn = 0;

    function spawnFlame(x, y) {
        const size = 5 + Math.random() * 6;
        const drift = (Math.random() - 0.5) * 26;
        const rise = 28 + Math.random() * 26;
        const duration = 650 + Math.random() * 350;

        const flame = document.createElement('div');
        flame.style.cssText = `
            position:fixed;
            left:${x - size / 2}px;
            top:${y - size / 2}px;
            width:${size}px;
            height:${size}px;
            background:#fff3a0;
            box-shadow:0 0 6px 1px #ffb300;
            pointer-events:none;
            z-index:99999;
        `;
        document.body.appendChild(flame);

        const anim = flame.animate([
            { transform: 'translate(0,0) scale(1)', backgroundColor: '#fff3a0', boxShadow: '0 0 6px 1px #ffc400', offset: 0 },
            { transform: `translate(${drift * 0.35}px, ${-rise * 0.5}px) scale(0.85)`, backgroundColor: '#ff9800', boxShadow: '0 0 9px 2px #ff6d00', offset: 0.45 },
            { transform: `translate(${drift}px, ${-rise}px) scale(0.3)`, backgroundColor: '#7f0000', boxShadow: '0 0 2px 0 #4a0000', opacity: 0, offset: 1 }
        ], { duration, easing: 'ease-out' });

        anim.onfinish = () => flame.remove();
    }

    document.addEventListener('mousemove', e => {
        const now = Date.now();
        if (now - lastSpawn < 45) return;
        lastSpawn = now;
        spawnFlame(e.clientX, e.clientY);
    });

});
