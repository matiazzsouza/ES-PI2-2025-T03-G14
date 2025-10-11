// public/js/add-turmas.js
document.addEventListener('DOMContentLoaded', function() {
    let turmaCount = 1;
    const turmasContainer = document.getElementById('turmas-container');
    const addTurmaBtn = document.getElementById('addTurmaBtn');

    // Adicionar nova turma
    addTurmaBtn.addEventListener('click', function() {
        turmaCount++;
        
        const newTurmaHTML = `
            <div class="turma-form-group" data-index="${turmaCount - 1}">
                <div class="turma-header">
                    <h3>Turma ${turmaCount}</h3>
                    <button type="button" class="btn-remove-turma">×</button>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="turmaNome_${turmaCount - 1}">Nome da Turma *</label>
                        <input type="text" id="turmaNome_${turmaCount - 1}" name="turmas[${turmaCount - 1}][nome]" required 
                               placeholder="Ex: Turma A, Noturno, Matutino">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="turmaDiaSemana_${turmaCount - 1}">Dia da Semana</label>
                        <select id="turmaDiaSemana_${turmaCount - 1}" name="turmas[${turmaCount - 1}][dia_semana]">
                            <option value="">Selecione o dia</option>
                            <option value="Segunda">Segunda-feira</option>
                            <option value="Terça">Terça-feira</option>
                            <option value="Quarta">Quarta-feira</option>
                            <option value="Quinta">Quinta-feira</option>
                            <option value="Sexta">Sexta-feira</option>
                            <option value="Sábado">Sábado</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="turmaHorario_${turmaCount - 1}">Horário</label>
                        <input type="time" id="turmaHorario_${turmaCount - 1}" name="turmas[${turmaCount - 1}][horario]">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="turmaLocal_${turmaCount - 1}">Local</label>
                    <input type="text" id="turmaLocal_${turmaCount - 1}" name="turmas[${turmaCount - 1}][local]" 
                           placeholder="Ex: Sala 101, Laboratório 2">
                </div>
            </div>
        `;
        
        turmasContainer.insertAdjacentHTML('beforeend', newTurmaHTML);
        
        // Mostrar botão de remover na primeira turma
        if (turmaCount === 2) {
            document.querySelector('.turma-form-group:first-child .btn-remove-turma').style.display = 'block';
        }
    });

    // Remover turma
    turmasContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove-turma')) {
            const turmaGroup = e.target.closest('.turma-form-group');
            turmaGroup.remove();
            turmaCount--;
            
            // Reorganizar números e índices
            const allTurmas = document.querySelectorAll('.turma-form-group');
            allTurmas.forEach((turma, index) => {
                turma.setAttribute('data-index', index);
                turma.querySelector('h3').textContent = `Turma ${index + 1}`;
                
                // Atualizar names dos inputs
                const inputs = turma.querySelectorAll('input, select');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    if (name) {
                        const newName = name.replace(/\[\d+\]/, `[${index}]`);
                        input.setAttribute('name', newName);
                        input.setAttribute('id', newName.replace(/\[/g, '_').replace(/\]/g, ''));
                    }
                });
            });
            
            // Esconder botão de remover se só tiver uma turma
            if (turmaCount === 1) {
                document.querySelector('.btn-remove-turma').style.display = 'none';
            }
        }
    });

    // Validação do formulário
    document.getElementById('turmasForm').addEventListener('submit', function(e) {
        const turmas = document.querySelectorAll('.turma-form-group');
        let isValid = true;
        
        turmas.forEach(turma => {
            const nomeInput = turma.querySelector('input[type="text"]');
            if (!nomeInput.value.trim()) {
                isValid = false;
                nomeInput.style.borderColor = '#dc2626';
            } else {
                nomeInput.style.borderColor = '';
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            alert('Por favor, preencha o nome de todas as turmas.');
        }
    });
});