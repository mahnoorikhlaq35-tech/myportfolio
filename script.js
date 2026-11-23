/* =========================================================
   IT321 Assignment 2 — script.js
   Student: Mahnoor Ikhlaq
   Features:
     1) Contact form validation (regex + e.preventDefault)
     2) Projects add/delete (array + splice + render)
     3) Search filter + "Showing X of Y" line
     4) localStorage persistence (JSON.stringify / JSON.parse)
     5) Fetch latest posts from JSONPlaceholder (async/await + try/catch)
   Plus (kept from Assignment 1): Skills list with localStorage
   ========================================================= */

/* ---------- Helper: escape HTML ---------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* =========================================================
   FEATURE 2 + 3 + 4: PROJECTS (add, delete, search, save)
   ========================================================= */

const STORAGE_KEY = 'it321_projects_mahnoor';

const defaultProjects = [
  {
    title: 'My Language Translator',
    description: 'AI-powered translator supporting 10+ languages with text-to-speech, voice input and download.'
  },
  {
    title: 'Cyberpunk Tic Tac Toe',
    description: 'A futuristic neon-themed Tic Tac Toe game built inside Microsoft Excel using formulas and VBA.'
  },
  {
    title: 'Personal Portfolio Website',
    description: 'Responsive portfolio built with HTML5, CSS3, Bootstrap 5 and JavaScript.'
  }
];

// Load saved projects, else use defaults
function loadProjects() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [...defaultProjects];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [...defaultProjects];
  } catch (err) {
    return [...defaultProjects];
  }
}

let projects = loadProjects();

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

/* ---------- DOM refs ---------- */
const projectsListEl   = document.getElementById('projectsList');
const searchInput      = document.getElementById('searchInput');
const searchInfoEl     = document.getElementById('searchInfo');
const addProjectBtn    = document.getElementById('addProjectBtn');
const projectTitleEl   = document.getElementById('projectTitle');
const projectDescEl    = document.getElementById('projectDescription');
const projectErrorEl   = document.getElementById('projectError');

/* ---------- render(): clears list and rebuilds ---------- */
function render() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(query)
  );

  projectsListEl.innerHTML = '';

  if (filtered.length === 0) {
    projectsListEl.innerHTML =
      '<div class="col-12"><p class="text-muted fst-italic">No projects found.</p></div>';
    searchInfoEl.textContent = '';
    return;
  }

  filtered.forEach((project) => {
    const realIndex = projects.indexOf(project);
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6';
    col.innerHTML = `
      <div class="project-card-js">
        <h5>${escapeHtml(project.title)}</h5>
        <p>${escapeHtml(project.description)}</p>
        <button class="btn btn-sm btn-outline-danger delete-btn"
                data-index="${realIndex}" type="button">Delete</button>
      </div>
    `;
    projectsListEl.appendChild(col);
  });

  searchInfoEl.textContent =
    `Showing ${filtered.length} of ${projects.length} projects`;
}

/* ---------- Add project ---------- */
addProjectBtn.addEventListener('click', () => {
  const title = projectTitleEl.value.trim();
  const desc  = projectDescEl.value.trim();

  if (!title || !desc) {
    projectErrorEl.textContent = 'Both title and description are required.';
    return;
  }

  projectErrorEl.textContent = '';
  projects.push({ title, description: desc });
  saveProjects();
  projectTitleEl.value = '';
  projectDescEl.value  = '';
  render();
});

/* ---------- Delete via event delegation ---------- */
projectsListEl.addEventListener('click', (e) => {
  if (!e.target.classList.contains('delete-btn')) return;
  const index = Number(e.target.dataset.index);
  projects.splice(index, 1);
  saveProjects();
  render();
});

/* ---------- Search while typing ---------- */
searchInput.addEventListener('input', render);

/* ---------- Initial render ---------- */
render();

/* =========================================================
   FEATURE 1: CONTACT FORM VALIDATION
   ========================================================= */

const contactForm   = document.getElementById('contactForm');
const fullNameEl    = document.getElementById('fullName');
const emailEl       = document.getElementById('email');
const mobileEl      = document.getElementById('mobile');
const messageEl     = document.getElementById('message');

const nameErrorEl    = document.getElementById('nameError');
const emailErrorEl   = document.getElementById('emailError');
const mobileErrorEl  = document.getElementById('mobileError');
const messageErrorEl = document.getElementById('messageError');
const formSuccessEl  = document.getElementById('formSuccess');

// Regex patterns (per assignment rules)
const nameRegex   = /^[A-Za-z ]{3,30}$/;         // letters & spaces, 3-30
const emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // basic email shape
const mobileRegex = /^03\d{2}-\d{7}$/;            // 0300-1234567 format

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Reset messages
  nameErrorEl.textContent = '';
  emailErrorEl.textContent = '';
  mobileErrorEl.textContent = '';
  messageErrorEl.textContent = '';
  formSuccessEl.textContent = '';

  let valid = true;

  // Full Name
  if (!nameRegex.test(fullNameEl.value.trim())) {
    nameErrorEl.textContent = 'Name must be 3-30 letters and spaces only.';
    valid = false;
  }

  // Email
  if (!emailRegex.test(emailEl.value.trim())) {
    emailErrorEl.textContent = 'Enter a valid email, e.g. ali@iiu.edu.pk';
    valid = false;
  }

  // Mobile
  if (!mobileRegex.test(mobileEl.value.trim())) {
    mobileErrorEl.textContent = 'Mobile must match 0300-1234567 format.';
    valid = false;
  }

  // Message
  if (messageEl.value.trim() === '') {
    messageErrorEl.textContent = 'Message cannot be empty.';
    valid = false;
  }

  if (!valid) return;

  // Success
  formSuccessEl.textContent =
    `Thank you, ${fullNameEl.value.trim()}! Your message has been sent.`;

  contactForm.reset();
});

/* =========================================================
   FEATURE 5: LATEST POSTS (fetch + async/await + try/catch)
   ========================================================= */

const postsListEl    = document.getElementById('postsList');
const postsLoadingEl = document.getElementById('postsLoading');
const postsErrorEl   = document.getElementById('postsError');

async function loadPosts() {
  postsLoadingEl.classList.remove('d-none');
  postsErrorEl.classList.add('d-none');
  postsErrorEl.textContent = '';

  try {
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/posts?_limit=6'
    );

    if (!response.ok) throw new Error('HTTP ' + response.status);

    const posts = await response.json();

    postsListEl.innerHTML = '';
    posts.forEach((post) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';
      col.innerHTML = `
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${escapeHtml(post.title)}</h5>
            <p class="card-text">${escapeHtml(post.body)}</p>
          </div>
        </div>
      `;
      postsListEl.appendChild(col);
    });
  } catch (err) {
    console.error(err);
    postsErrorEl.textContent = 'Could not load the posts.';
    postsErrorEl.classList.remove('d-none');
  } finally {
    postsLoadingEl.classList.add('d-none');
  }
}

loadPosts();

/* =========================================================
   KEPT FROM ASSIGNMENT 1: Skills list with localStorage
   ========================================================= */

const skillInput  = document.getElementById('skillInput');
const addSkillBtn = document.getElementById('addSkillBtn');
const skillsList  = document.getElementById('skillsList');

let skills = [];

function loadSkills() {
  const saved = localStorage.getItem('skills');
  if (saved) {
    try { skills = JSON.parse(saved); } catch (e) { skills = []; }
    renderSkills();
  }
}

function saveSkills() {
  localStorage.setItem('skills', JSON.stringify(skills));
}

function renderSkills() {
  skillsList.innerHTML = '';
  skills.forEach(function (skill, index) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = escapeHtml(skill) +
      ' <button class="btn btn-sm btn-danger remove-btn" data-index="' +
      index + '" type="button">Remove</button>';
    skillsList.appendChild(li);
  });

  document.querySelectorAll('.remove-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const i = parseInt(this.dataset.index, 10);
      skills.splice(i, 1);
      saveSkills();
      renderSkills();
    });
  });
}

addSkillBtn.addEventListener('click', function () {
  const value = skillInput.value.trim();
  if (value === '') return;
  skills.push(value);
  skillInput.value = '';
  saveSkills();
  renderSkills();
});

loadSkills();