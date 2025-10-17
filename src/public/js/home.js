document.addEventListener('DOMContentLoaded', function() {
    // ✅ VERIFICAR SE ESTAMOS NA PÁGINA HOME
    if (!document.querySelector('.home-main')) return;

    const instituicaoModal = document.getElementById('instituicaoModal');
    const cursoModal = document.getElementById('cursoModal');
    const addCursoModal = document.getElementById('addCursoModal');
    
    // ✅ EVENT DELEGATION - UM LISTENER SÓ PARA TODOS OS BOTÕES
    document.addEventListener('click', function(e) {
        // Editar Instituição
        if (e.target.closest('.btn-edit-instituicao')) {
            const btn = e.target.closest('.btn-edit-instituicao');
            const instituicaoId = btn.getAttribute('data-instituicao-id');
            const instituicaoNome = btn.closest('.instituicao-card').querySelector('h3').textContent;
            openInstituicaoModal(instituicaoId, instituicaoNome);
        }
        
        // Excluir Instituição
        if (e.target.closest('.btn-delete-instituicao')) {
            const btn = e.target.closest('.btn-delete-instituicao');
            const instituicaoId = btn.getAttribute('data-instituicao-id');
            const instituicaoNome = btn.closest('.instituicao-card').querySelector('h3').textContent;
            excluirInstituicao(instituicaoId, instituicaoNome);
        }
        
        // Editar Curso
        if (e.target.closest('.btn-edit-curso')) {
            const btn = e.target.closest('.btn-edit-curso');
            const cursoId = btn.getAttribute('data-curso-id');
            const cursoNome = btn.closest('.curso-item').querySelector('strong').textContent;
            openCursoModal(cursoId, cursoNome);
        }
        
        // Excluir Curso
        if (e.target.closest('.btn-delete-curso')) {
            const btn = e.target.closest('.btn-delete-curso');
            const cursoId = btn.getAttribute('data-curso-id');
            const cursoNome = btn.closest('.curso-item').querySelector('strong').textContent;
            excluirCurso(cursoId, cursoNome);
        }
        
        // Adicionar Curso
        if (e.target.closest('.btn-add-curso')) {
            const btn = e.target.closest('.btn-add-curso');
            const instituicaoId = btn.getAttribute('data-instituicao-id');
            const instituicaoNome = btn.closest('.instituicao-card').querySelector('h3').textContent;
            openAddCursoModal(instituicaoId, instituicaoNome);
        }
        
        // Fechar Modais
        if (e.target.classList.contains('close-modal')) {
            closeAllModals();
        }
    });

    // ✅ FUNÇÕES DOS MODAIS
    function openInstituicaoModal(instituicaoId, instituicaoNome) {
        document.getElementById('modalInstituicaoId').value = instituicaoId;
        document.getElementById('instituicaoNome').value = instituicaoNome || '';
        closeAllModals();
        instituicaoModal.style.display = 'block';
    }

    function openCursoModal(cursoId, cursoNome) {
        document.getElementById('modalCursoId').value = cursoId;
        document.getElementById('cursoNome').value = cursoNome || '';
        closeAllModals();
        cursoModal.style.display = 'block';
    }

    function openAddCursoModal(instituicaoId, instituicaoNome) {
        document.getElementById('modalInstituicaoIdCurso').value = instituicaoId;
        document.getElementById('novoCursoNome').value = '';
        closeAllModals();
        addCursoModal.style.display = 'block';
    }

    function closeAllModals() {
        instituicaoModal.style.display = 'none';
        cursoModal.style.display = 'none';
        addCursoModal.style.display = 'none';
    }

    // ✅ FUNÇÕES DE SALVAR
    async function salvarInstituicao(instituicaoData) {
        try {
            const instituicaoId = document.getElementById('modalInstituicaoId').value;
            
            const response = await fetch(`/api/instituicoes/${instituicaoId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(instituicaoData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Instituição atualizada com sucesso!');
                closeAllModals();
                location.reload();
            } else {
                throw new Error(result.error || 'Erro ao salvar instituição');
            }
        } catch (error) {
            console.error('Erro ao salvar instituição:', error);
            alert(error.message || 'Erro ao salvar instituição');
        }
    }

    async function salvarCurso(cursoData) {
        try {
            const cursoId = document.getElementById('modalCursoId').value;
            
            const response = await fetch(`/api/cursos/${cursoId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(cursoData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Curso atualizado com sucesso!');
                closeAllModals();
                location.reload();
            } else {
                throw new Error(result.error || 'Erro ao salvar curso');
            }
        } catch (error) {
            console.error('Erro ao salvar curso:', error);
            alert(error.message || 'Erro ao salvar curso');
        }
    }

    async function criarCurso(cursoData, instituicaoId) {
        try {
            const response = await fetch(`/api/instituicoes/${instituicaoId}/cursos`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(cursoData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Curso criado com sucesso!');
                closeAllModals();
                location.reload();
            } else {
                throw new Error(result.error || 'Erro ao criar curso');
            }
        } catch (error) {
            console.error('Erro ao criar curso:', error);
            alert(error.message || 'Erro ao criar curso');
        }
    }

    // ✅ FUNÇÕES DE EXCLUIR
    async function excluirInstituicao(instituicaoId, instituicaoNome) {
        try {
            const response = await fetch(`/api/instituicoes/${instituicaoId}`, {method: 'DELETE'});
            const data = await response.json();
            
            if (data.success === false && data.error) {
                alert(data.message || data.error);
                return;
            }
            
            if (data.requireConfirmation) {
                const confirmar = confirm(`Tem certeza que deseja excluir a instituição "${data.instituicao.nome}"?`);
                if (confirmar) {
                    const confirmResponse = await fetch(`/api/instituicoes/${instituicaoId}`, {
                        method: 'DELETE',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ confirmacao: true })
                    });
                    const result = await confirmResponse.json();
                    if (result.success) {
                        alert(result.message);
                        location.reload();
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao excluir instituição:', error);
            alert('Erro ao excluir instituição');
        }
    }

    async function excluirCurso(cursoId, cursoNome) {
        try {
            const response = await fetch(`/api/cursos/${cursoId}`, {method: 'DELETE'});
            const data = await response.json();
            
            if (data.success === false && data.error) {
                alert(data.message || data.error);
                return;
            }
            
            if (data.requireConfirmation) {
                const confirmar = confirm(`Tem certeza que deseja excluir o curso "${data.curso.nome}"?`);
                if (confirmar) {
                    const confirmResponse = await fetch(`/api/cursos/${cursoId}`, {
                        method: 'DELETE',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ confirmacao: true })
                    });
                    const result = await confirmResponse.json();
                    if (result.success) {
                        alert(result.message);
                        location.reload();
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao excluir curso:', error);
            alert('Erro ao excluir curso');
        }
    }

    // ✅ FORM SUBMITS
    document.getElementById('instituicaoForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        await salvarInstituicao({nome: formData.get('nome')});
    });

    document.getElementById('cursoForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        await salvarCurso({nome: formData.get('nome')});
    });

    document.getElementById('addCursoForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const instituicaoId = document.getElementById('modalInstituicaoIdCurso').value;
        const formData = new FormData(this);
        await criarCurso({nome: formData.get('nome')}, instituicaoId);
    });

    // ✅ BOTÕES CANCELAR
    document.getElementById('cancelEditInstituicao')?.addEventListener('click', closeAllModals);
    document.getElementById('cancelEditCurso')?.addEventListener('click', closeAllModals);
    document.getElementById('cancelAddCurso')?.addEventListener('click', closeAllModals);

    // ✅ FECHAR MODAL AO CLICAR FORA
    window.addEventListener('click', function(e) {
        if (e.target === instituicaoModal || e.target === cursoModal || e.target === addCursoModal) {
            closeAllModals();
        }
    });
});