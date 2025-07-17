// app.js

const SUPABASE_URL = 'https://ahfftuocpvrwdnfnaqyc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....CI6MjA2Nzg5ODgwMH0.S8k2R8tQgid38T-NDQz73WrSPIPZD9FNDYOpTffLQkQ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const PW_HASH = '358084aeeaad4408545533c2c3935f62d2943b587efe81cafc5fec90974052be';

  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon   = document.getElementById('theme-icon');
  function updateTheme() {
    if (document.documentElement.classList.toggle('dark')) themeIcon.textContent = '☀️';
    else themeIcon.textContent = '🌙';
  }
  themeToggle.onclick = updateTheme;

  const menuToggle = document.getElementById('menu-toggle');
  const sidebar    = document.getElementById('sidebar');
  const mainWrap   = document.getElementById('main-content');
  menuToggle.onclick = () => {
    sidebar.classList.toggle('open');
    mainWrap.classList.toggle('shifted');
  };

  // 참조 객체 수집
  const refs = {};
  document.querySelectorAll('[id]').forEach(el => refs[el.id] = el);

  let songs = [];
  let viewMode = 'songs';

  async function loadSongs() {
    const { data, error } = await supabaseClient
      .from('onusongdb')
      .select('*')
      .order('title', { ascending: true });
    if (error) {
      console.error('불러오기 실패:', error);
      return;
    }
    songs = data || [];
    render();
  }

  function render() {
    // 토글 옵션 활성화
    ['view-songs','view-categories','view-artists'].forEach(id => {
      refs[id].classList.toggle('active', id === `view-${viewMode}`);
      refs[id].classList.toggle('inactive', id !== `view-${viewMode}`);
    });
    // 그리드 지우기
    const grid = refs['song-grid'];
    grid.innerHTML = '';

    // 현재 보기 모드에 따른 렌더
    const filtered = songs; // 필터 로직 추가 가능
    filtered.forEach(s => {
      const tpl = document.getElementById('song-card-template').content.cloneNode(true);
      tpl.querySelector('[data-img]').src            = thumbnail(s.inst);
      tpl.querySelector('[data-title]').textContent   = s.title;
      tpl.querySelector('[data-artist]').textContent  = s.artist;
      tpl.querySelector('[data-note]').textContent    = s.notes || '';
      tpl.querySelector('[data-completed]').style.display = s.completed ? 'inline-flex' : 'none';
      tpl.querySelector('[data-recommend]').style.display = s.recommend ? 'inline-flex' : 'none';
      tpl.querySelector('[data-bomb]').style.display      = s.bomb ? 'inline-flex' : 'none';
      tpl.querySelector('.song-card').setAttribute('data-id', s.id);
      grid.appendChild(tpl);
    });

    refs['total-songs'].textContent = songs.length;
  }

  function thumbnail(inst) {
    if (!inst) return '';
    const id = inst.split('v=')[1];
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }

  // 추가/수정 폼 제출
  refs['add-song-form'].onsubmit = async e => {
    e.preventDefault();
    const form = new FormData(refs['add-song-form']);
    const payload = {
      id: form.get('id') || undefined,
      title: form.get('title'),
      artist: form.get('artist'),
      inst: form.get('inst'),
      notes: form.get('notes'),
      completed: form.get('completed') === 'on',
      recommend: form.get('recommend') === 'on',
      bomb: form.get('bomb') === 'on'
    };

    const { data, error } = await supabaseClient
      .from('onusongdb')
      .upsert([payload], { onConflict: ['id'] });

    if (error) {
      console.error('삽입/업데이트 실패:', error);
      alert(`오류: ${error.message}`);
    } else {
      refs['add-song-form'].reset();
      loadSongs();
    }
  };

  loadSongs();
});
