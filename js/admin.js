// Gestion des onglets du Dashboard
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById(`${tabName}-tab`).classList.add('active');
  event.currentTarget.classList.add('active');
}

// Chargement des données pour l'administrateur
async function fetchAdminData() {
  // 1. Récupération des Utilisateurs (Email, Téléphone, Nom)
  const { data: users } = await supabaseClient.from('profiles').select('*');
  const usersTbody = document.getElementById('usersTableBody');
  if (users && usersTbody) {
    usersTbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.full_name}</td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${u.role}</td>
      </tr>
    `).join('');
  }

  // 2. Récupération des Stages
  const { data: stages } = await supabaseClient.from('internships').select('*');
  const stagesTbody = document.getElementById('stagesTableBody');
  if (stages && stagesTbody) {
    stagesTbody.innerHTML = stages.map(s => `
      <tr>
        <td>${s.company_name}</td>
        <td>${s.sector}</td>
        <td>${s.position_title}</td>
        <td>${s.duration_months} mois</td>
      </tr>
    `).join('');
  }

  // 3. Récupération des Emplois
  const { data: jobs } = await supabaseClient.from('jobs').select('*');
  const emploisTbody = document.getElementById('emploisTableBody');
  if (jobs && emploisTbody) {
    emploisTbody.innerHTML = jobs.map(j => `
      <tr>
        <td>${j.company_name}</td>
        <td>${j.sector}</td>
        <td>${j.position_title}</td>
        <td>${j.contract_type}</td>
      </tr>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', fetchAdminData);