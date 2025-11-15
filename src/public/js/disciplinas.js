document.addEventListener('DOMContentLoaded', function() {
    const turmaModal = document.getElementById('turmaModal');
    const turmaForm = document.getElementById('turmaForm');
    const disciplinaModal = document.getElementById('disciplinaModal');
    const disciplinaForm = document.getElementById('disciplinaForm');

    console.log('=== SISTEMA DE DISCIPLINAS INICIALIZADO ===');

    // -------------------- FUNÇÕES PRINCIPAIS --------------------------

    async function buscarDisciplina(disciplinaId) {
        try {
            const response = await fetch(`/api/disciplinas/${disciplinaId}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error(`Disciplina não encontrada`);
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const disciplina = await response.json();
            return disciplina;
        } catch (error) {
            console.error('❌ Erro ao buscar disciplina:', error);
            alert('Erro ao carregar disciplina: ' + error.message);
            return null;
        }
    }

    function openDisciplinaModal(disciplinaId, disciplinaData = null) {
        if (!disciplinaData) {
            alert('Dados da disciplina não disponíveis');
            return;
        }
        document.getElementById('modalDisciplinaEditId').value = disciplinaId;
        document.getElementById('disciplinaNome').value = disciplinaData.nome || '';
        document.getElementById('disciplinaSigla').value = disciplinaData.sigla || '';
        document.getElementById('disciplinaCodigo').value = disciplinaData.codigo || '';
        document.getElementById('disciplinaPeriodo').value = disciplinaData.periodo || '';
        disciplinaModal.style.display = 'block';
    }

    async function salvarDisciplina(disciplinaData) {
        try {
            const disciplinaId = document.getElementById('modalDisciplinaEditId').value;
            const response = await fetch(`/api/disciplinas/${disciplinaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(disciplinaData)
            });
            const result = await response.json();
            if (response.ok) {
                alert('✅ Disciplina atualizada com sucesso!');
                disciplinaModal.style.display = 'none';
                location.reload();
            } else {
                throw new Error(result.error || 'Erro ao salvar disciplina');
            }
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }

    function openTurmaModal(disciplinaId, turmaId = null, turmaData = null) {
        const modalTitle = document.getElementById('modalTurmaTitle');
        document.getElementById('modalDisciplinaId').value = disciplinaId;
        document.getElementById('modalTurmaId').value = turmaId || '';
        if (turmaId && turmaData) {
            modalTitle.textContent = 'Editar Turma';
            document.getElementById('turmaNome').value = turmaData.nome || '';
            document.getElementById('turmaDiaSemana').value = turmaData.dia_semana || '';
            document.getElementById('turmaHorario').value = turmaData.horario || '';
            document.getElementById('turmaLocal').value = turmaData.local || '';
        } else {
            modalTitle.textContent = 'Adicionar Turma';
            ['turmaNome', 'turmaDiaSemana', 'turmaHorario', 'turmaLocal'].forEach(id => {
                document.getElementById(id).value = '';
            });
        }
        turmaModal.style.display = 'block';
    }

    async function buscarTurma(turmaId) {
        try {
            const response = await fetch(`/api/turmas/${turmaId}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('Turma não encontrada');
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            alert('❌ Erro ao carregar turma: ' + error.message);
            return null;
        }
    }

    async function salvarTurma(turmaData) {
        try {
            const turmaId = document.getElementById('modalTurmaId').value;
            const disciplinaId = document.getElementById('modalDisciplinaId').value;
            let url, method;
            if (turmaId) {
                url = `/api/turmas/${turmaId}`;
                method = 'PUT';
            } else {
                url = `/api/disciplinas/${disciplinaId}/turmas`;
                method = 'POST';
            }
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(turmaData)
            });
            const result = await response.json();
            if (response.ok) {
                alert(turmaId ? '✅ Turma atualizada com sucesso!' : '✅ Turma criada com sucesso!');
                turmaModal.style.display = 'none';
                location.reload();
            } else {
                throw new Error(result.error || 'Erro ao salvar turma');
            }
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }

    async function excluirTurma(turmaId, turmaNome) {
        if (!confirm(`Tem certeza que deseja excluir a turma "${turmaNome}"?`)) return;
        try {
            const response = await fetch(`/api/turmas/${turmaId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message || 'Turma excluída com sucesso!');
                location.reload();
            } else if (data.requireConfirmation) {
                const confirmar = confirm(`Atenção: ${data.message}\n\nTem certeza que deseja excluir a turma "${data.turma.nome}"?`);
                if (confirmar) {
                    const confirmResponse = await fetch(`/api/turmas/${turmaId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ confirmacao: true })
                    });
                    const result = await confirmResponse.json();
                    if (result.success) {
                        alert(result.message);
                        location.reload();
                    } else {
                        throw new Error(result.error || 'Erro ao confirmar exclusão');
                    }
                }
            } else {
                throw new Error(data.error || data.message || 'Erro ao excluir turma');
            }
        } catch (error) {
            alert('Erro ao excluir turma: ' + error.message);
        }
    }

    // --------- EVENTOS ---------

    // Botão editar disciplina
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async function() {
            const disciplinaCard = this.closest('.disciplina-card');
            const disciplinaId = disciplinaCard.getAttribute('data-disciplina-id');
            const disciplinaNome = disciplinaCard.querySelector('h3').textContent;
            const disciplinaData = await buscarDisciplina(disciplinaId);
            if (disciplinaData) openDisciplinaModal(disciplinaId, disciplinaData);
        });
    });

    // Botão excluir disciplina (com confirmação backend)
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            const disciplinaCard = this.closest('.disciplina-card');
            const disciplinaId = disciplinaCard.getAttribute('data-disciplina-id');
            const disciplinaNome = disciplinaCard.querySelector('h3').textContent;

            // PRIMEIRA CHAMADA: pede confirmação ao backend
            let response = await fetch(`/api/disciplinas/${disciplinaId}`, { method: 'DELETE' });
            let data = await response.json();

            if (data.requireConfirmation) {
                const confirmar = confirm(data.message + `\n\nDisciplina: ${disciplinaNome}`);
                if (confirmar) {
                    // SEGUNDA CHAMADA: confirmação enviada
                    let confirmResponse = await fetch(`/api/disciplinas/${disciplinaId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ confirmacao: true })
                    });
                    let result = await confirmResponse.json();
                    if (result.success) {
                        alert(result.message);
                        location.reload();
                    } else {
                        alert(result.error || 'Erro ao excluir disciplina');
                    }
                }
            } else if (data.success) {
                alert(data.message || 'Disciplina excluída com sucesso!');
                location.reload();
            } else {
                alert(data.error || 'Erro ao excluir disciplina');
            }
        });
    });

    document.querySelectorAll('.btn-edit-turma').forEach(btn => {
        btn.addEventListener('click', async function() {
            const turmaId = this.getAttribute('data-turma-id');
            const disciplinaId = this.closest('.disciplina-card').getAttribute('data-disciplina-id');
            const turmaData = await buscarTurma(turmaId);
            if (turmaData) openTurmaModal(disciplinaId, turmaId, turmaData);
        });
    });

    document.querySelectorAll('.btn-delete-turma').forEach(btn => {
        btn.addEventListener('click', function() {
            const turmaId = this.getAttribute('data-turma-id');
            const turmaNome = this.closest('.turma-item').querySelector('strong').textContent;
            excluirTurma(turmaId, turmaNome);
        });
    });

    document.querySelectorAll('.btn-add-turma').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const disciplinaId = this.closest('.disciplina-card').getAttribute('data-disciplina-id');
            openTurmaModal(disciplinaId);
        });
    });

    document.querySelectorAll('.btn-alunos').forEach(btn => {
        btn.addEventListener('click', function() {
            const turmaId = this.getAttribute('data-turma-id');
            window.location.href = `/turma/${turmaId}/alunos`;
        });
    });

    if (turmaForm) {
        turmaForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const turmaData = {
                nome: formData.get('nome'),
                dia_semana: formData.get('dia_semana'),
                horario: formData.get('horario'),
                local: formData.get('local')
            };
            await salvarTurma(turmaData);
        });
    }

    if (disciplinaForm) {
        disciplinaForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const disciplinaData = {
                nome: formData.get('nome'),
                sigla: formData.get('sigla'),
                codigo: formData.get('codigo'),
                periodo: formData.get('periodo')
            };
            await salvarDisciplina(disciplinaData);
        });
    }

    document.querySelectorAll('.close-modal, #cancelEdit, #cancelDisciplinaEdit').forEach(btn => {
        btn.addEventListener('click', function() {
            turmaModal.style.display = 'none';
            disciplinaModal.style.display = 'none';
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target === turmaModal) turmaModal.style.display = 'none';
        if (e.target === disciplinaModal) disciplinaModal.style.display = 'none';
    });

    console.log('✅ Sistema de disciplinas carregado com sucesso');
});
