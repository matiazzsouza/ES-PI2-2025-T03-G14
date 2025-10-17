document.addEventListener('DOMContentLoaded', function() {
    const turmaModal = document.getElementById('turmaModal');
    const turmaForm = document.getElementById('turmaForm');

    // Função para abrir modal de edição de turma
    function openTurmaModal(disciplinaId, turmaId = null, turmaData = null) {
        const modalTitle = document.getElementById('modalTurmaTitle');
        
        document.getElementById('modalDisciplinaId').value = disciplinaId;
        document.getElementById('modalTurmaId').value = turmaId || '';
        
        if (turmaId && turmaData) {
            // Modo edição
            modalTitle.textContent = 'Editar Turma';
            document.getElementById('turmaNome').value = turmaData.nome || '';
            document.getElementById('turmaDiaSemana').value = turmaData.dia_semana || '';
            document.getElementById('turmaHorario').value = turmaData.horario || '';
            document.getElementById('turmaLocal').value = turmaData.local || '';
        }
        
        turmaModal.style.display = 'block';
    }

    // Função para buscar dados da turma
    async function buscarTurma(turmaId) {
        try {
            const response = await fetch(`/api/turmas/${turmaId}`);
            if (response.ok) {
                const data = await response.json();
                return data.turma;
            } else {
                throw new Error('Erro ao buscar turma');
            }
        } catch (error) {
            console.error('Erro ao buscar turma:', error);
            alert('Erro ao carregar dados da turma');
            return null;
        }
    }

    // Função para salvar/atualizar turma
    async function salvarTurma(turmaData) {
        try {
            const turmaId = document.getElementById('modalTurmaId').value;
            
            const url = `/api/turmas/${turmaId}`;
            const method = 'PUT';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(turmaData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Turma atualizada com sucesso!');
                turmaModal.style.display = 'none';
                location.reload();
            } else {
                throw new Error(result.error || 'Erro ao salvar turma');
            }
        } catch (error) {
            console.error('Erro ao salvar turma:', error);
            alert(error.message || 'Erro ao salvar turma');
        }
    }

    // Função para excluir turma com confirmação via backend
    async function excluirTurma(turmaId, turmaNome) {
        try {
            // 1ª chamada - Solicita exclusão (sem confirmação)
            const response = await fetch(`/api/turmas/${turmaId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            // 2ª - Se precisar confirmar
            if (data.requireConfirmation) {
                const confirmar = confirm(`Tem certeza que deseja excluir a turma "${data.turma.nome}"?`);
                
                if (confirmar) {
                    // 2ª chamada - Confirma exclusão
                    const confirmResponse = await fetch(`/api/turmas/${turmaId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ confirmacao: true })
                    });
                    
                    const result = await confirmResponse.json();
                    
                    if (result.success) {
                        alert(result.message);
                        location.reload();
                    }
                }
            } else if (data.success) {
                alert(data.message);
                location.reload();
            }
            
        } catch (error) {
            console.error('Erro ao excluir turma:', error);
            alert('Erro ao excluir turma');
        }
    }


    
    // Função para excluir disciplina
    async function excluirDisciplina(disciplinaId, disciplinaNome) {
        if (confirm(`Tem certeza que deseja excluir a disciplina "${disciplinaNome}" e todas as suas turmas?`)) {
            try {
                const response = await fetch(`/api/disciplinas/${disciplinaId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    alert('Disciplina excluída com sucesso!');
                    location.reload();
                } else {
                    alert('Erro ao excluir disciplina. Exclua todas as turmas primeiro para poder excluir esta disciplina.');
                }
            } catch (error) {
                console.error('Erro ao excluir disciplina:', error);
                alert('Erro ao excluir disciplina');
            }
        }
    }

    // Event listeners para botões de editar turma
    document.querySelectorAll('.btn-edit-turma').forEach(btn => {
        btn.addEventListener('click', async function() {
            const turmaId = this.getAttribute('data-turma-id');
            const disciplinaId = this.closest('.disciplina-card').getAttribute('data-disciplina-id');
            
            // Buscar dados da turma
            const turmaData = await buscarTurma(turmaId);
            if (turmaData) {
                openTurmaModal(disciplinaId, turmaId, turmaData);
            }
        });
    });

    // Event listeners para botões de excluir turma
    document.querySelectorAll('.btn-delete-turma').forEach(btn => {
        btn.addEventListener('click', function() {
            const turmaId = this.getAttribute('data-turma-id');
            const turmaNome = this.closest('.turma-item').querySelector('strong').textContent;
            excluirTurma(turmaId, turmaNome);
        });
    });

    // Event listeners para botões de excluir disciplina
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const disciplinaCard = this.closest('.disciplina-card');
            const disciplinaId = disciplinaCard.getAttribute('data-disciplina-id');
            const disciplinaNome = disciplinaCard.querySelector('h3').textContent;
            excluirDisciplina(disciplinaId, disciplinaNome);
        });
    });

    // Event listeners para botões de editar disciplina
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const disciplinaId = this.closest('.disciplina-card').getAttribute('data-disciplina-id');
            // Redirecionar para página de edição
            window.location.href = `/curso/${disciplinaId}/disciplinas/edit`;
        });
    });

    // Event listeners para botões de gerenciar alunos
    document.querySelectorAll('.btn-alunos').forEach(btn => {
        btn.addEventListener('click', function() {
            const turmaId = this.getAttribute('data-turma-id');
            // Redirecionar para página de gerenciamento de alunos
            window.location.href = `/turma/${turmaId}/alunos`;
        });
    });

    // Event listener para o formulário de turma
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

    // Fechar modal
    document.querySelector('.close-modal')?.addEventListener('click', function() {
        turmaModal.style.display = 'none';
    });
    
    document.getElementById('cancelEdit')?.addEventListener('click', function() {
        turmaModal.style.display = 'none';
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target === turmaModal) {
            turmaModal.style.display = 'none';
        }
    });




    
});