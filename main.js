// ===== PIXEL COSMOS MAIN JS =====

(function() {
'use strict';

// ===== STATE =====
let currentLang = localStorage.getItem('lang') || 'en';
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentPage = 'home';
let currentPost = null;
const data = window.SITE_DATA;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  applyTheme();
  initStarfield();
  buildTopBar();
  buildNavbar();
  buildPages();
  navigateTo('home');
  updateLang();
  initSearch();
  setTimeout(initHeroCanvas, 50);
});

// ===== THEME =====
function applyTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme === 'light' ? 'light' : '');
}
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  applyTheme();
  updateThemeBtn();
}
function updateThemeBtn() {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  const t = data.i18n[currentLang];
  btn.textContent = currentTheme === 'dark' ? t.theme_day : t.theme_night;
  btn.title = currentTheme === 'dark' ? 'Switch to Day' : 'Switch to Night';
}

// ===== LANG =====
function toggleLang() {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  localStorage.setItem('lang', currentLang);
  updateLang();
  // Rebuild pages with new lang
  buildPages();
  if (currentPost) {
    openPost(currentPost.id, currentPost.type);
  } else {
    showPage(currentPage);
  }
  showToast(currentLang === 'en' ? 'Switched to English' : '已切换为中文');
}
function t(key) {
  return data.i18n[currentLang][key] || key;
}
function updateLang() {
  updateThemeBtn();
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = t('lang_btn');
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(el => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
  // Update section titles
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (!el.classList.contains('nav-link')) {
      const key = el.dataset.i18n;
      if (key) el.textContent = t(key);
    }
  });
  // Update search title
  const st = document.querySelector('.search-title');
  if (st) st.textContent = t('search_title');
  const si = document.getElementById('search-input');
  if (si) si.placeholder = t('search_placeholder');
}

// ===== TOP BAR =====
function buildTopBar() {
  const bar = document.createElement('div');
  bar.id = 'top-bar';
  bar.innerHTML = `
    <div class="top-left-controls">
      <button class="pixel-btn" id="lang-btn" onclick="window.COSMOS.toggleLang()">${t('lang_btn')}</button>
      <button class="pixel-btn icon-btn" id="theme-btn" onclick="window.COSMOS.toggleTheme()"></button>
      <button class="pixel-btn icon-btn" id="search-open-btn" onclick="window.COSMOS.openSearch()" title="Search">🔍</button>
    </div>
  `;
  const mc = document.getElementById('main-content');
  mc.parentNode.insertBefore(bar, mc);
  updateThemeBtn();
}

// ===== NAVBAR =====
function buildNavbar() {
  const nav = document.createElement('nav');
  nav.id = 'navbar';
  const pages = [
    { id: 'home', key: 'nav_home' },
    { id: 'research', key: 'nav_research' },
    { id: 'about', key: 'nav_about' },
    { id: 'blogs', key: 'nav_blogs' },
  ];
  nav.innerHTML = pages.map(p => `
    <a href="#" class="nav-link" data-page="${p.id}" data-i18n="${p.key}" onclick="window.COSMOS.navigateTo('${p.id}'); return false;">${t(p.key)}</a>
  `).join('');
  // Append navbar INTO top-bar on the right side
  document.getElementById('top-bar').appendChild(nav);
}

function setActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// ===== PAGES =====
function buildPages() {
  const mc = document.getElementById('main-content');
  mc.innerHTML = `
    ${buildHomePage()}
    ${buildResearchPage()}
    ${buildAboutPage()}
    ${buildBlogsPage()}
  `;
  // Post view
  mc.insertAdjacentHTML('beforeend', `
    <div id="post-view">
      <button class="back-btn" onclick="window.COSMOS.closePost()">◀ <span data-i18n="back">${t('back')}</span></button>
      <div id="post-view-content"></div>
    </div>
  `);
}

function buildHomePage() {
  // Latest 3: combine research+blogs sorted by date
  const all = [
    ...data.research.map(p => ({...p, type:'research'})),
    ...data.blogs.map(p => ({...p, type:'blog'}))
  ].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,3);

  return `
    <section class="page" id="page-home">
      <div class="hero">
        <div class="hero-hud">
          <div class="hud-corner tl"></div>
          <div class="hud-corner tr"></div>
        </div>
        <div class="hero-cosmos-wrap">
          <canvas id="hero-canvas" width="440" height="440"></canvas>
        </div>
        <div class="hero-status-row">
          <span class="status-dot"></span>
          <span class="status-label" id="hero-badge">SYSTEM ONLINE</span>
        </div>
        <h1 class="hero-title" data-i18n="hero_greeting">${t('hero_greeting')}</h1>
        <p class="hero-subtitle typing-cursor" data-i18n="hero_subtitle">${t('hero_subtitle')}</p>
      </div>
      <div class="section-header">
        <h2 class="section-title" data-i18n="latest_posts">${t('latest_posts')}</h2>
        <div class="pixel-divider"></div>
      </div>
      <div class="post-grid">
        ${all.map(p => buildPostCard(p)).join('')}
      </div>
    </section>
  `;
}

function buildResearchPage() {
  return `
    <section class="page" id="page-research">
      <div class="section-header">
        <h2 class="section-title" data-i18n="research_title">${t('research_title')}</h2>
        <div class="pixel-divider"></div>
      </div>
      <div class="post-grid">
        ${data.research.map(p => buildPostCard({...p, type:'research'})).join('')}
      </div>
    </section>
  `;
}

function buildBlogsPage() {
  return `
    <section class="page" id="page-blogs">
      <div class="section-header">
        <h2 class="section-title" data-i18n="blogs_title">${t('blogs_title')}</h2>
        <div class="pixel-divider"></div>
      </div>
      <div class="post-grid">
        ${data.blogs.map(p => buildPostCard({...p, type:'blog'})).join('')}
      </div>
    </section>
  `;
}

function buildAboutPage() {
  const ab = data.about;
  const name = currentLang === 'zh' ? ab.name_zh : ab.name;
  const tagline = currentLang === 'zh' ? ab.tagline_zh : ab.tagline;
  const bio = currentLang === 'zh' ? ab.bio.zh : ab.bio.en;
  const bioLines = bio.split('\n').map(l => `<p>${l}</p>`).join('');
  const skills = ab.skills.map(s => {
    const label = currentLang === 'zh' ? s.label_zh : s.label;
    return `
      <li class="skill-bar-item">
        <div class="skill-label">${label}</div>
        <div class="skill-bar-track">
          <div class="skill-bar-fill" style="width:${s.level}%"></div>
        </div>
      </li>
    `;
  }).join('');
  const socials = ab.socials.map(s => `<a href="${s.url}" class="social-link" target="_blank">${s.label}</a>`).join('');
  const avatarHtml = ab.avatar
    ? `<img src="${ab.avatar}" alt="avatar">`
    : `<div class="avatar-placeholder">${ab.avatar_emoji}</div>`;

  return `
    <section class="page" id="page-about">
      <div class="about-container">
        <div class="avatar-frame">
          ${avatarHtml}
          <div class="avatar-badge" data-i18n="about_badge">${t('about_badge')}</div>
        </div>
        <h2 class="about-name">${name}</h2>
        <p class="about-tagline">${tagline}</p>
        <div class="about-bio">${bioLines}</div>
        <ul class="skill-bar-list">${skills}</ul>
        <div class="social-links">${socials}</div>
      </div>
    </section>
  `;
}

function buildPostCard(post) {
  const title = currentLang === 'zh' ? post.title_zh : post.title;
  const excerpt = currentLang === 'zh' ? post.excerpt_zh : post.excerpt;
  const tag = post.type === 'research' ? t('tag_research') : t('tag_blog');
  const thumb = post.image
    ? `<img class="post-thumb" src="${post.image}" alt="${title}" loading="lazy">`
    : `<div class="post-thumb-placeholder">${post.emoji}</div>`;

  return `
    <article class="post-card" onclick="window.COSMOS.openPost('${post.id}', '${post.type}')">
      <div class="pixel-corner tl"></div>
      <div class="pixel-corner tr"></div>
      <div class="card-scan"></div>
      ${thumb}
      <div class="post-body">
        <div class="post-tag">${tag}</div>
        <h3 class="post-title">${title}</h3>
        <p class="post-excerpt">${excerpt}</p>
        <div class="post-card-footer">
          <span class="post-date">${post.date}</span>
          <span class="read-more">${t('read_more')}</span>
        </div>
      </div>
      <div class="pixel-corner bl"></div>
      <div class="pixel-corner br"></div>
    </article>
  `;
}

// ===== NAVIGATION =====
window.COSMOS = {
  navigateTo,
  openPost,
  closePost,
  toggleLang,
  toggleTheme,
  openSearch,
  closeSearch,
  doSearch
};

function navigateTo(page) {
  currentPost = null;
  currentPage = page;
  showPage(page);
  setActiveNav(page);
  document.getElementById('post-view').classList.remove('active');
  window.scrollTo(0, 0);
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
}

// ===== POST VIEW =====
function openPost(id, type) {
  const list = type === 'research' ? data.research : data.blogs;
  const post = list.find(p => p.id === id);
  if (!post) return;
  currentPost = { id, type };

  const title = currentLang === 'zh' ? post.title_zh : post.title;
  const content = currentLang === 'zh' ? post.content_zh : post.content;
  const tag = type === 'research' ? t('tag_research') : t('tag_blog');
  const thumb = post.image
    ? `<img class="post-full-hero" src="${post.image}" alt="${title}" loading="lazy">`
    : `<div class="post-full-hero-placeholder">${post.emoji}</div>`;

  const postView = document.getElementById('post-view');
  document.getElementById('post-view-content').innerHTML = `
    <div class="post-tag">${tag}</div>
    <h1 class="post-full-title">${title}</h1>
    <div class="post-full-meta">
      <span>${t('posted_on')} ${post.date}</span>
    </div>
    ${thumb}
    <div class="post-content">${renderMarkdown(content)}</div>
  `;

  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  postView.classList.add('active');
  window.scrollTo(0, 0);
}

function closePost() {
  currentPost = null;
  document.getElementById('post-view').classList.remove('active');
  showPage(currentPage);
  window.scrollTo(0, 0);
}

// ===== MARKDOWN RENDERER (lightweight) =====
function renderMarkdown(md) {
  if (!md) return '';
  let html = md.trim();

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="lang-${lang}">${escHtml(code.trim())}</code></pre>`);
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // HR
  html = html.replace(/^---$/gm, '<hr>');
  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  // Tables
  html = html.replace(/((\|.+\|\n)+)/g, function(match) {
    const rows = match.trim().split('\n').filter(r => !/^\|[\s\-|]+\|$/.test(r));
    const tableRows = rows.map((row, i) => {
      const cells = row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1);
      const tag2 = i === 0 ? 'th' : 'td';
      return `<tr>${cells.map(c => `<${tag2}>${c.trim()}</${tag2}>`).join('')}</tr>`;
    });
    return `<table>${tableRows.join('')}</table>`;
  });
  // Unordered lists
  html = html.replace(/((?:^- .+\n?)+)/gm, match => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });
  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, match => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });
  // Paragraphs
  html = html.split(/\n{2,}/).map(block => {
    if (/^<(h[1-6]|ul|ol|pre|blockquote|hr|table)/.test(block.trim())) return block;
    return `<p>${block.trim()}</p>`;
  }).join('\n');

  return html;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== SEARCH =====
function initSearch() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeSearch();
  });
  document.getElementById('search-input').addEventListener('input', function() {
    doSearch(this.value);
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSearch();
  });
}

function openSearch() {
  document.getElementById('search-overlay').classList.add('active');
  setTimeout(() => document.getElementById('search-input').focus(), 100);
}

function closeSearch() {
  document.getElementById('search-overlay').classList.remove('active');
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
}

function doSearch(query) {
  const results = document.getElementById('search-results');
  if (!query || query.length < 2) { results.innerHTML = ''; return; }
  query = query.toLowerCase();
  const all = [
    ...data.research.map(p => ({...p, type:'research'})),
    ...data.blogs.map(p => ({...p, type:'blog'}))
  ];
  const matches = all.filter(p => {
    const title = (currentLang === 'zh' ? p.title_zh : p.title).toLowerCase();
    const excerpt = (currentLang === 'zh' ? p.excerpt_zh : p.excerpt).toLowerCase();
    const content = (currentLang === 'zh' ? (p.content_zh||'') : (p.content||'')).toLowerCase();
    return title.includes(query) || excerpt.includes(query) || content.includes(query);
  });

  if (matches.length === 0) {
    results.innerHTML = `<div class="search-no-result">${t('no_results')}</div>`;
    return;
  }

  results.innerHTML = matches.map(p => {
    const title = currentLang === 'zh' ? p.title_zh : p.title;
    const excerpt = currentLang === 'zh' ? p.excerpt_zh : p.excerpt;
    const tag = p.type === 'research' ? t('tag_research') : t('tag_blog');
    return `
      <div class="search-result-item" onclick="window.COSMOS.closeSearch(); window.COSMOS.openPost('${p.id}','${p.type}')">
        <div class="sr-tag">${tag}</div>
        <div class="sr-title">${title}</div>
        <div class="sr-excerpt">${excerpt}</div>
      </div>
    `;
  }).join('');
}

// ===== STARFIELD CANVAS =====
function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W=440,H=440,cx=220,cy=220;
    const isLight=()=>document.documentElement.getAttribute('data-theme')==='light';
    const bodies=[
      {a:80,b:30,period:88, phase:0.5,r:5, dark:'#9a9a9a',lite:'#aa5522'},
      {a:116,b:44,period:224,phase:2.1,r:7, dark:'#e8c87a',lite:'#e09020'},
      {a:155,b:58,period:365,phase:4.2,r:9, dark:'#4A90D9',lite:'#2266cc'},
      {a:192,b:72,period:687,phase:1.7,r:6, dark:'#CD5C5C',lite:'#cc3300'},
    ];
    const stars=Array.from({length:90},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+0.2,a:Math.random(),da:(Math.random()-0.5)*0.012}));
    let tick=0;
    function frame(){
      ctx.clearRect(0,0,W,H);
      const light=isLight();
      if(!light){
        stars.forEach(s=>{s.a+=s.da;if(s.a<0.07)s.da=Math.abs(s.da);if(s.a>0.9)s.da=-Math.abs(s.da);ctx.globalAlpha=s.a;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle='#c8d8ff';ctx.fill();});
        ctx.globalAlpha=1;
        const pg=ctx.createRadialGradient(cx-16,cy-16,2,cx,cy,52);
        pg.addColorStop(0,'#9966ff');pg.addColorStop(0.7,'#4422cc');pg.addColorStop(1,'#110844');
        ctx.beginPath();ctx.arc(cx,cy,52,0,Math.PI*2);ctx.fillStyle=pg;ctx.fill();
        ctx.beginPath();ctx.ellipse(cx,cy,78,18,0,0,Math.PI*2);ctx.strokeStyle='rgba(150,100,255,0.4)';ctx.lineWidth=6;ctx.stroke();
      } else {

        for(let i=0;i<16;i++){const a=i*Math.PI/8+(tick*0.003);const r2=55+Math.sin(tick*0.06+i*0.7)*6;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*40,cy+Math.sin(a)*40);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.strokeStyle='rgba(255,200,50,'+(0.35+0.2*Math.sin(tick*0.05+i))+')';ctx.lineWidth=1.8;ctx.stroke();}
        const sunG=ctx.createRadialGradient(cx-10,cy-10,2,cx,cy,38);
        sunG.addColorStop(0,'#ffffc0');sunG.addColorStop(0.4,'#ffe040');sunG.addColorStop(1,'#ff9900');
        ctx.beginPath();ctx.arc(cx,cy,38,0,Math.PI*2);ctx.fillStyle=sunG;ctx.fill();
      }
      bodies.forEach(b=>{
        const angle=(tick/b.period)*Math.PI*2+b.phase;
        const px=cx+Math.cos(angle)*b.a,py=cy+Math.sin(angle)*b.b;
        ctx.beginPath();ctx.ellipse(cx,cy,b.a,b.b,0,0,Math.PI*2);
        ctx.strokeStyle=light?'rgba(160,80,0,0.2)':'rgba(60,40,160,0.2)';ctx.lineWidth=0.7;ctx.stroke();
        const col=light?b.lite:b.dark;
        const glw=ctx.createRadialGradient(px,py,0,px,py,b.r*2.8);
        glw.addColorStop(0,col+'66');glw.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=glw;ctx.beginPath();ctx.arc(px,py,b.r*2.8,0,Math.PI*2);ctx.fill();
        const plg=ctx.createRadialGradient(px-b.r*0.35,py-b.r*0.35,b.r*0.1,px,py,b.r);
        plg.addColorStop(0,col+'ff');plg.addColorStop(1,col+'88');
        ctx.beginPath();ctx.arc(px,py,b.r,0,Math.PI*2);ctx.fillStyle=plg;ctx.fill();
      });
      tick++;requestAnimationFrame(frame);
    }
    frame();
  }

function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars = [], shootingStar = null;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Generate stars
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.5 + 0.2,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.01,
      color: ['#ffffff','#aaccff','#ffccaa','#ccffcc'][Math.floor(Math.random()*4)]
    });
  }

  function launchShootingStar() {
    shootingStar = {
      x: Math.random() * w,
      y: Math.random() * h * 0.5,
      len: 80 + Math.random() * 120,
      speed: 8 + Math.random() * 8,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      alpha: 1,
      done: false
    };
  }
  setInterval(launchShootingStar, 4000);

  function draw() {
    ctx.clearRect(0,0,w,h);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      stars.forEach(s => {
        s.a += s.da;
        if(s.a<0.02)s.da=Math.abs(s.da);
        if(s.a>0.15)s.da=-Math.abs(s.da);
        ctx.beginPath();
        ctx.arc(s.x*w, s.y*h, s.r*0.6, 0, Math.PI*2);
        ctx.fillStyle=`rgba(180,100,40,${s.a*0.25})`;
        ctx.fill();
      });
    } else {
      stars.forEach(s => {
        s.a += s.da;
        if (s.a < 0.1) s.da = Math.abs(s.da);
        if (s.a > 1) s.da = -Math.abs(s.da);
        ctx.beginPath();
        ctx.arc(s.x*w, s.y*h, s.r, 0, Math.PI*2);
        ctx.fillStyle = s.color.replace(')', `,${s.a})`).replace('rgb','rgba').replace('#', '').length > 10
          ? s.color : s.color + Math.round(s.a*255).toString(16).padStart(2,'0');
        ctx.globalAlpha = s.a;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      if (shootingStar && !shootingStar.done) {
        const ss = shootingStar;
        ctx.save();
        ctx.globalAlpha = ss.alpha;
        const grad = ctx.createLinearGradient(
          ss.x, ss.y,
          ss.x - Math.cos(ss.angle)*ss.len,
          ss.y - Math.sin(ss.angle)*ss.len
        );
        grad.addColorStop(0, 'rgba(255,255,255,0.9)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - Math.cos(ss.angle)*ss.len, ss.y - Math.sin(ss.angle)*ss.len);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.alpha -= 0.02;
        if (ss.alpha <= 0 || ss.x > w || ss.y > h) ss.done = true;
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

})();