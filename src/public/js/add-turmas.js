// public/js/add-turmas.js
// Rewritten to reduce DOM parsing and reflows — uses DocumentFragment and element builders
document.addEventListener('DOMContentLoaded', function() {
    let turmaCount = document.querySelectorAll('.turma-form-group').length || 1;
    const turmasContainer = document.getElementById('turmas-container');
    const addTurmaBtn = document.getElementById('addTurmaBtn');

    function createTurmaElement(index) {
        // Build elements using DOM API to avoid HTML string parsing overhead
        const wrapper = document.createElement('div');
        wrapper.className = 'turma-form-group';
        wrapper.dataset.index = index;

        const header = document.createElement('div');
        header.className = 'turma-header';

        const h3 = document.createElement('h3');
        h3.textContent = `Turma ${index + 1}`;
        header.appendChild(h3);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove-turma';
        removeBtn.textContent = '×';
        header.appendChild(removeBtn);

        wrapper.appendChild(header);

        const row1 = document.createElement('div');
        row1.className = 'form-row';
        const fg1 = document.createElement('div');
        fg1.className = 'form-group';
        const labelNome = document.createElement('label');
        labelNome.setAttribute('for', `turmaNome_${index}`);
        labelNome.textContent = 'Nome da Turma *';
        const inputNome = document.createElement('input');
        inputNome.type = 'text';
        inputNome.id = `turmaNome_${index}`;
        inputNome.name = `turmas[${index}][nome]`;
        inputNome.required = true;
        inputNome.placeholder = 'Ex: Turma A, Noturno, Matutino';
        fg1.appendChild(labelNome);
        fg1.appendChild(inputNome);
        row1.appendChild(fg1);
        wrapper.appendChild(row1);

        const row2 = document.createElement('div');
        row2.className = 'form-row';

        const fg2 = document.createElement('div');
        fg2.className = 'form-group';
        const labelDia = document.createElement('label');
        labelDia.setAttribute('for', `turmaDiaSemana_${index}`);
        labelDia.textContent = 'Dia da Semana';
        const selectDia = document.createElement('select');
        selectDia.id = `turmaDiaSemana_${index}`;
        selectDia.name = `turmas[${index}][dia_semana]`;
        ['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'].forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val === '' ? 'Selecione o dia' : `${val}${val !== '' ? '' : ''}`;
            selectDia.appendChild(opt);
        });
        fg2.appendChild(labelDia);
        fg2.appendChild(selectDia);

        const fg3 = document.createElement('div');
        fg3.className = 'form-group';
        const labelHorario = document.createElement('label');
        labelHorario.setAttribute('for', `turmaHorario_${index}`);
        labelHorario.textContent = 'Horário';
        const inputHorario = document.createElement('input');
        inputHorario.type = 'time';
        inputHorario.id = `turmaHorario_${index}`;
        inputHorario.name = `turmas[${index}][horario]`;
        fg3.appendChild(labelHorario);
        fg3.appendChild(inputHorario);

        row2.appendChild(fg2);
        row2.appendChild(fg3);
        wrapper.appendChild(row2);

        const fg4 = document.createElement('div');
        fg4.className = 'form-group';
        const labelLocal = document.createElement('label');
        labelLocal.setAttribute('for', `turmaLocal_${index}`);
        labelLocal.textContent = 'Local';
        const inputLocal = document.createElement('input');
        inputLocal.type = 'text';
        inputLocal.id = `turmaLocal_${index}`;
        inputLocal.name = `turmas[${index}][local]`;
        inputLocal.placeholder = 'Ex: Sala 101, Laboratório 2';
        fg4.appendChild(labelLocal);
        fg4.appendChild(inputLocal);
        wrapper.appendChild(fg4);

        return wrapper;
    }

    addTurmaBtn.addEventListener('click', function() {
        // Minimiza reflows: criar fragmento e anexar de uma vez
        const idx = turmaCount; // próximo índice
        const frag = document.createDocumentFragment();
        const turmaEl = createTurmaElement(idx);
        frag.appendChild(turmaEl);
        turmasContainer.appendChild(frag);
        turmaCount++;

        // Mostrar botão de remover na primeira turma (se existirem 2+) de forma segura
        const firstRemove = document.querySelector('.turma-form-group:first-child .btn-remove-turma');
        if (firstRemove) firstRemove.style.display = turmaCount > 1 ? 'block' : 'none';
    });

    // Remover turma (delegação)
    turmasContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove-turma')) {
            const turmaGroup = e.target.closest('.turma-form-group');
            turmaGroup.remove();
            turmaCount = document.querySelectorAll('.turma-form-group').length || 1;

            // Reorganizar números e índices (atualizar names/ids)
            const allTurmas = document.querySelectorAll('.turma-form-group');
            allTurmas.forEach((turma, index) => {
                turma.dataset.index = index;
                const h3 = turma.querySelector('h3');
                if (h3) h3.textContent = `Turma ${index + 1}`;
                const inputs = turma.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    if (name) {
                        const newName = name.replace(/\[\d+\]/, `[${index}]`);
                        input.setAttribute('name', newName);
                    }
                    // Update id where applicable
                    if (input.id) {
                        const base = input.id.replace(/_\d+$/, '');
                        input.id = `${base}_${index}`;
                    }
                });
            });

            // Ajustar visibilidade do botão remover
            const remainingRemoves = document.querySelectorAll('.btn-remove-turma');
            if (remainingRemoves.length === 1) {
                remainingRemoves[0].style.display = 'none';
            }
        }
    });

    // Validação do formulário
    const turmasForm = document.getElementById('turmasForm');
    if (turmasForm) {
        turmasForm.addEventListener('submit', function(e) {
            const turmas = document.querySelectorAll('.turma-form-group');
            let isValid = true;
            turmas.forEach(turma => {
                const nomeInput = turma.querySelector('input[type="text"]');
                if (nomeInput && !nomeInput.value.trim()) {
                    isValid = false;
                    nomeInput.style.borderColor = '#dc2626';
                } else if (nomeInput) {
                    nomeInput.style.borderColor = '';
                }
            });

            if (!isValid) {
                e.preventDefault();
                alert('Por favor, preencha o nome de todas as turmas.');
            }
        });
    }
});