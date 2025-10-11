const disciplinasContainer = document.getElementById('disciplinasContainer');
const turmaModal = document.getElementById('turmaModal');
const disciplinaModal = document.getElementById('disciplinaModal');
const turmaForm = document.getElementById('turmaForm');
const disciplinaForm = document.getElementById('disciplinaForm');

// Dados das disciplinas (vindos do backend)
let disciplinas = [];

// Modal functions
function openTurmaModal(disciplinaId, disciplinaNome, turmaId = null) {
    document.getElementById('modalDisciplinaId').value = disciplinaId;
    document.getElementById('modalDisciplinaNome').textContent = disciplinaNome;
    document.getElementById('modalTurmaId').value = turmaId || '';
    
    if (turmaId) {
        document.getElementById('modalTurmaTitle').textContent = 'Editar Turma';
        // Preencher dados da turma existente
        const disciplina = disciplinas.find(d => d.id == disciplinaId);
        const turma = disciplina.turmas.find(t => t.id == turmaId);
        document.getElementById('turmaNome').value = turma.nome;
    } else {
        document.getElementById('modalTurmaTitle').textContent = 'Adicionar Turma';
        document.getElementById('turmaNome').value = '';
    }
    
    turmaModal.style.display = 'block';
}

function openDisciplinaModal(disciplinaId) {
    const disciplina = disciplinas.find(d => d.id == disciplinaId);
    
    document.getElementById('editDisciplinaId').value = disciplina.id;
    document.getElementById('editNome').value = disciplina.nome;
    document.getElementById('editSigla').value = disciplina.sigla || '';
    document.getElementById('editCodigo').value = disciplina.codigo || '';
    document.getElementById('editPeriodo').value = disciplina.periodo;
    document.getElementById('editCargaHoraria').value = disciplina.carga_horaria || '';
    
    disciplinaModal.style.display = 'block';
}

// Fechar modais
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        turmaModal.style.display = 'none';
        disciplinaModal.style.display = 'none';
    });
});

// Criar card de disciplina
function criarCardDisciplina(disciplina) {
    const card = document.createElement('div');
    card.classList.add('disciplina-card');
    card.setAttribute('data-disciplina-id', disciplina.id);

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');

    const titulo = document.createElement('h3');
    titulo.textContent = disciplina.nome;

    const cardActions = document.createElement('div');
    cardActions.classList.add('card-actions');

    const btnEdit = document.createElement('button');
    btnEdit.classList.add('btn-edit');
    btnEdit.innerHTML = '✏️';
    btnEdit.title = 'Editar Disciplina';

    const btnDelete = document.createElement('button');
    btnDelete.classList.add('btn-delete');
    btnDelete.innerHTML = '🗑️';
    btnDelete.title = 'Excluir Disciplina';

    const btnAddTurma = document.createElement('button');
    btnAddTurma.classList.add('btn-add-turma');
    btnAddTurma.innerHTML = '➕';
    btnAddTurma.title = 'Adicionar Turma';

    cardActions.appendChild(btnEdit);
    cardActions.appendChild(btnDelete);
    cardActions.appendChild(btnAddTurma);
    
    cardHeader.appendChild(titulo);
    cardHeader.appendChild(cardActions);
    card.appendChild(cardHeader);

    // Detalhes da disciplina
    const cardDetails = document.createElement('div');
    cardDetails.classList.add('card-details');
    
    if (disciplina.sigla) {
        const sigla = document.createElement('p');
        sigla.innerHTML = `<strong>Sigla:</strong> ${disciplina.sigla}`;
        cardDetails.appendChild(sigla);
    }
    
    if (disciplina.codigo) {
        const codigo = document.createElement('p');
        codigo.innerHTML = `<strong>Código:</strong> ${disciplina.codigo}`;
        cardDetails.appendChild(codigo);
    }
    
    const periodo = document.createElement('p');
    periodo.innerHTML = `<strong>Período:</strong> ${disciplina.periodo}º`;
    cardDetails.appendChild(periodo);
    
    if (disciplina.carga_horaria) {
        const cargaHoraria = document.createElement('p');
        cargaHoraria.innerHTML = `<strong>Carga Horária:</strong> ${disciplina.carga_horaria}h`;
        cardDetails.appendChild(cargaHoraria);
    }
    
    card.appendChild(cardDetails);

    // Seção de turmas
    const turmasSection = document.createElement('div');
    turmasSection.classList.add('turmas-section');
    
    const turmasTitle = document.createElement('h4');
    turmasTitle.innerHTML = '🏫 Turmas';
    turmasSection.appendChild(turmasTitle);
    
    const turmasList = document.createElement('ul');
    turmasList.classList.add('turmas-list');
    turmasSection.appendChild(turmasList);
    
    card.appendChild(turmasSection);

    // Event Listeners
    btnAddTurma.addEventListener('click', () => {
        openTurmaModal(disciplina.id, disciplina.nome);
    });

    btnEdit.addEventListener('click', () => {
        openDisciplinaModal(disciplina.id);
    });

    btnDelete.addEventListener('click', () => {
        if (confirm(`Tem certeza que deseja excluir a disciplina "${disciplina.nome}"?`)) {
            excluirDisciplina(disciplina.id);
        }
    });

    return card;
}

// Atualizar lista de turmas
function atualizarListaTurmas(ulElement, turmas, disciplinaId) {
    ulElement.innerHTML = '';
    
    if (turmas && turmas.length > 0) {
        turmas.forEach((turma) => {
            const li = document.createElement('li');
            li.classList.add('turma-item');
            
            const span = document.createElement('span');
            span.textContent = turma.nome;
            
            const turmaActions = document.createElement('div');
            turmaActions.classList.add('turma-actions');
            
            const btnEditTurma = document.createElement('button');
            btnEditTurma.classList.add('btn-edit-turma');
            btnEditTurma.innerHTML = '✏️';
            btnEditTurma.title = 'Editar Turma';
            
            const btnDeleteTurma = document.createElement('button');
            btnDeleteTurma.classList.add('btn-delete-turma');
            btnDeleteTurma.innerHTML = '🗑️';
            btnDeleteTurma.title = 'Excluir Turma';
            
            turmaActions.appendChild(btnEditTurma);
            turmaActions.appendChild(btnDeleteTurma);
            
            li.appendChild(span);
            li.appendChild(turmaActions);
            ulElement.appendChild(li);
            
            // Event listeners para ações da turma
            btnEditTurma.addEventListener('click', () => {
                openTurmaModal(disciplinaId, '', turma.id);
            });
            
            btnDeleteTurma.addEventListener('click', () => {
                if (confirm(`Tem certeza que deseja excluir a turma "${turma.nome}"?`)) {
                    excluirTurma(disciplinaId, turma.id);
                }
            });
        });
    } else {
        const emptyMsg = document.createElement('li');
        emptyMsg.classList.add('empty-message');
        emptyMsg.textContent = 'Nenhuma turma cadastrada';
        ulElement.appendChild(emptyMsg);
    }
}

// Atualizar display das disciplinas
function atualizarDisciplinas() {
    if (!disciplinasContainer) return;
    
    disciplinasContainer.innerHTML = '';
    
    if (disciplinas && disciplinas.length > 0) {
        disciplinas.forEach((disciplina) => {
            const card = criarCardDisciplina(disciplina);
            const turmasList = card.querySelector('.turmas-list');
            atualizarListaTurmas(turmasList, disciplina.turmas, disciplina.id);
            disciplinasContainer.appendChild(card);
        });
    } else {
        disciplinasContainer.innerHTML = `
            <div class="empty-state">
                <p>📭 Nenhuma disciplina cadastrada ainda.</p>
                <a href="/curso/${cursoId}/disciplinas/add" class="btn btn-primary">
                    ➕ Adicionar Primeira Disciplina
                </a>
            </div>
        `;
    }
}

// Funções para API (você vai implementar conforme seu backend)
async function salvarTurma(disciplinaId, turmaData) {
    try {
        const response = await fetch(`/api/disciplinas/${disciplinaId}/turmas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(turmaData)
        });
        
        if (response.ok) {
            const turmaSalva = await response.json();
            // Atualizar a disciplina localmente
            const disciplinaIndex = disciplinas.findIndex(d => d.id == disciplinaId);
            if (disciplinaIndex !== -1) {
                if (!disciplinas[disciplinaIndex].turmas) {
                    disciplinas[disciplinaIndex].turmas = [];
                }
                disciplinas[disciplinaIndex].turmas.push(turmaSalva);
                atualizarDisciplinas();
            }
            return turmaSalva;
        }
    } catch (error) {
        console.error('Erro ao salvar turma:', error);
        alert('Erro ao salvar turma');
    }
}

async function excluirDisciplina(disciplinaId) {
    try {
        const response = await fetch(`/api/disciplinas/${disciplinaId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            disciplinas = disciplinas.filter(d => d.id !== disciplinaId);
            atualizarDisciplinas();
        }
    } catch (error) {
        console.error('Erro ao excluir disciplina:', error);
        alert('Erro ao excluir disciplina');
    }
}

async function excluirTurma(disciplinaId, turmaId) {
    try {
        const response = await fetch(`/api/disciplinas/${disciplinaId}/turmas/${turmaId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const disciplinaIndex = disciplinas.findIndex(d => d.id == disciplinaId);
            if (disciplinaIndex !== -1) {
                disciplinas[disciplinaIndex].turmas = disciplinas[disciplinaIndex].turmas.filter(t => t.id !== turmaId);
                atualizarDisciplinas();
            }
        }
    } catch (error) {
        console.error('Erro ao excluir turma:', error);
        alert('Erro ao excluir turma');
    }
}

// Form submit handlers
if (turmaForm) {
    turmaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const disciplinaId = document.getElementById('modalDisciplinaId').value;
        const turmaId = document.getElementById('modalTurmaId').value;
        const turmaNome = document.getElementById('turmaNome').value.trim();
        
        if (!turmaNome) {
            alert('O nome da turma é obrigatório!');
            return;
        }
        
        const turmaData = {
            nome: turmaNome
        };
        
        await salvarTurma(disciplinaId, turmaData);
        turmaModal.style.display = 'none';
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Se houver disciplinas carregadas do backend, inicializar
    if (typeof window.disciplinasData !== 'undefined') {
        disciplinas = window.disciplinasData;
        atualizarDisciplinas();
    }
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === turmaModal) {
            turmaModal.style.display = 'none';
        }
        if (e.target === disciplinaModal) {
            disciplinaModal.style.display = 'none';
        }
    });
});