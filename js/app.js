function updateAuthNavigation(session) {
  const user = session?.user;
  const isAuthenticated = Boolean(user);

  document.querySelectorAll('[data-auth-required]').forEach((element) => {
    element.hidden = !isAuthenticated;
  });

  document.querySelectorAll('[data-auth-redirect]').forEach((link) => {
    link.href = isAuthenticated ? link.dataset.authRedirect : 'auth.html?mode=signup';
  });

  const authNotice = document.getElementById('authNotice');
  if (authNotice) authNotice.hidden = isAuthenticated;

  const authButtons = document.querySelector('.auth-buttons');
  if (!authButtons) return;

  if (!user) {
    authButtons.innerHTML = `
      <a href="auth.html?mode=login" class="btn btn-outline">Se connecter</a>
      <a href="auth.html?mode=signup" class="btn btn-primary">S'inscrire</a>
    `;
    return;
  }

  authButtons.innerHTML = `
    <div class="user-menu" data-user-id="${user.id}">
      <button type="button" class="user-menu-btn" aria-haspopup="true" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="8" r="4"></circle>
          <path d="M5 21a7 7 0 0 1 14 0"></path>
        </svg>
        <span class="user-menu-first-name"></span>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m7 10 5 5 5-5"></path>
        </svg>
      </button>
      <div class="user-dropdown-menu" role="menu">
        <div class="user-dropdown-details">
          <strong class="user-full-name"></strong>
          <span class="user-email"></span>
        </div>
        <div class="user-dropdown-divider"></div>
        <button type="button" class="user-logout-btn" role="menuitem">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M10 17l5-5-5-5"></path>
            <path d="M15 12H3"></path>
            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"></path>
          </svg>
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  `;

  const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mon profil';
  const userMenu = authButtons.querySelector('.user-menu');
  userMenu.querySelector('.user-full-name').textContent = fallbackName;
  userMenu.querySelector('.user-menu-first-name').textContent = fallbackName.split(/\s+/)[0];
  userMenu.querySelector('.user-email').textContent = user.email || '';

  window.setTimeout(async () => {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Impossible de charger le profil utilisateur :', error);
      return;
    }

    const activeMenu = document.querySelector('.user-menu');
    if (!activeMenu || activeMenu.dataset.userId !== user.id) return;

    const fullName = data?.full_name || fallbackName;
    activeMenu.querySelector('.user-full-name').textContent = fullName;
    activeMenu.querySelector('.user-menu-first-name').textContent = fullName.split(/\s+/)[0];
    activeMenu.querySelector('.user-email').textContent = data?.level || data?.status || data?.role || user.email || '';
  }, 0);
}

function isProtectedPage() {
  return ['stages.html', 'emplois.html'].includes(window.location.pathname.split('/').pop());
}

function guardProtectedPage(session) {
  if (!session && isProtectedPage()) {
    window.location.replace('auth.html?mode=signup');
  }
}

document.addEventListener('click', async (event) => {
  const profileButton = event.target.closest('.user-menu-btn');
  if (profileButton) {
    const userMenu = profileButton.closest('.user-menu');
    const isOpen = userMenu.classList.toggle('is-open');
    profileButton.setAttribute('aria-expanded', String(isOpen));
    return;
  }

  const logoutButton = event.target.closest('.user-logout-btn');
  if (logoutButton) {
    logoutButton.disabled = true;
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      logoutButton.disabled = false;
      alert('Erreur lors de la déconnexion : ' + error.message);
      return;
    }
    window.location.href = 'index.html';
    return;
  }

  document.querySelectorAll('.user-menu.is-open').forEach((userMenu) => {
    userMenu.classList.remove('is-open');
    userMenu.querySelector('.user-menu-btn')?.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  document.querySelectorAll('.user-menu.is-open').forEach((userMenu) => {
    userMenu.classList.remove('is-open');
    const profileButton = userMenu.querySelector('.user-menu-btn');
    profileButton?.setAttribute('aria-expanded', 'false');
    profileButton?.focus();
  });
});

supabaseClient.auth.onAuthStateChange((event, session) => {
  updateAuthNavigation(session);

  if (event === 'SIGNED_OUT') {
    window.location.href = 'index.html';
    return;
  }

  guardProtectedPage(session);
});

supabaseClient.auth.getSession().then(({ data, error }) => {
  if (error) console.error('Impossible de vérifier la session :', error);
  updateAuthNavigation(data?.session);
  guardProtectedPage(data?.session);
});

// Charger et envoyer des informations de stages
const stageForm = document.getElementById('stageForm');
if (stageForm) {
  stageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const company_name = document.getElementById('company_name').value;
    const region = document.getElementById('region').value;
    const city = document.getElementById('city').value;
    const sector = document.getElementById('sector').value;
    const position_title = document.getElementById('position_title').value;
    const duration_months = document.getElementById('duration_months').value;
    const description = document.getElementById('description').value;

    const { error } = await supabaseClient.from('internships').insert([{
      company_name, region, city, sector, position_title, duration_months, description
    }]);

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      alert("Stage enregistré avec succès !");
      stageForm.reset();
      loadStages();
    }
  });
}

// Fonction de chargement des stages
async function loadStages() {
  const container = document.getElementById('stagesList');
  if (!container) return;

  const { data, error } = await supabaseClient.from('internships').select('*');
  if (error) return console.error(error);

  container.innerHTML = data.map(item => `
    <div class="card">
      <span class="badge">Stage: ${item.duration_months} Mois</span>
      <h3>${item.position_title}</h3>
      <p><strong>Entreprise:</strong> ${item.company_name}</p>
      <p><strong>Région:</strong> ${item.region || 'Non renseignée'}</p>
      <p><strong>Ville:</strong> ${item.city || 'Non renseignée'}</p>
      <p><strong>Secteur:</strong> ${item.sector}</p>
      <p>${item.description || ''}</p>
    </div>
  `).join('');
}

// Charger et envoyer des informations d'emplois
const jobForm = document.getElementById('jobForm');
if (jobForm) {
  jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const company_name = document.getElementById('job_company').value;
    const region = document.getElementById('region').value;
    const city = document.getElementById('city').value;
    const sector = document.getElementById('job_sector').value;
    const position_title = document.getElementById('job_title').value;
    const contract_type = document.getElementById('contract_type').value;

    const { error } = await supabaseClient.from('jobs').insert([{
      company_name, region, city, sector, position_title, contract_type
    }]);

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      alert("Emploi publié avec succès !");
      jobForm.reset();
      loadJobs();
    }
  });
}

// Fonction de chargement des emplois
async function loadJobs() {
  const container = document.getElementById('jobsList');
  if (!container) return;

  const { data, error } = await supabaseClient.from('jobs').select('*');
  if (error) return console.error(error);

  container.innerHTML = data.map(item => `
    <div class="card job-card">
      <span class="badge" style="background:#FFE6E6; color:var(--secondary-color);">${item.contract_type}</span>
      <h3>${item.position_title}</h3>
      <p><strong>Entreprise:</strong> ${item.company_name}</p>
      <p><strong>Région:</strong> ${item.region || 'Non renseignée'}</p>
      <p><strong>Ville:</strong> ${item.city || 'Non renseignée'}</p>
      <p><strong>Secteur:</strong> ${item.sector}</p>
    </div>
  `).join('');
}

// Auto-exécution au chargement
document.addEventListener('DOMContentLoaded', () => {
  loadStages();
  loadJobs();
});