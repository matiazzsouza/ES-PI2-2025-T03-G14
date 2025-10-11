// primeiro-login.js
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('primeiroLoginForm');
  const container = document.getElementById('instituicoesContainer');
  const addInstituicaoBtn = document.getElementById('addInstituicao');
  let instituicaoCount = 1;
  let cursoCount = 1;

  // Adicionar nova instituição
  addInstituicaoBtn.addEventListener('click', function() {
    addInstituicaoGroup();
  });

  // Adicionar grupo instituição inicial
  function addInstituicaoGroup() {
    const index = instituicaoCount++;
    const grupo = document.createElement('div');
    grupo.className = 'instituicao-group';
    grupo.setAttribute('data-index', index);
    
    grupo.innerHTML = `
      <div class="primeiro-login-section">
        <label>Instituição onde trabalha:</label>
        <input type="text" name="instituicoes[${index}][nome]" placeholder="Ex: PUC-Campinas" required>
      </div>

      <div class="primeiro-login-section">
        <label>Cursos que leciona nesta instituição:</label>
        <div class="cursos-list" data-instituicao="${index}">
          <div class="primeiro-login-input-group">
            <input type="text" name="instituicoes[${index}][cursos][0]" placeholder="Ex: Engenharia de Software" required>
            <button type="button" class="primeiro-login-remove-btn remove-curso">✖</button>
          </div>
        </div>
        <button type="button" class="primeiro-login-add-btn add-curso" data-instituicao="${index}">+ Adicionar curso</button>
      </div>
      
      <button type="button" class="remove-instituicao">Remover Instituição</button>
      <hr class="primeiro-login-divider">
    `;

    container.appendChild(grupo);
    cursoCount = 1;

    // Eventos para a nova instituição
    const removeBtn = grupo.querySelector('.remove-instituicao');
    removeBtn.addEventListener('click', function() {
      if (document.querySelectorAll('.instituicao-group').length > 1) {
        grupo.remove();
      } else {
        alert('É necessário ter pelo menos uma instituição.');
      }
    });

    const addCursoBtn = grupo.querySelector('.add-curso');
    addCursoBtn.addEventListener('click', function() {
      addCursoField(index);
    });

    // Evento para remover curso
    grupo.querySelector('.remove-curso').addEventListener('click', function() {
      const cursosList = grupo.querySelector('.cursos-list');
      if (cursosList.children.length > 1) {
        this.parentElement.remove();
      }
    });
  }

  // Adicionar campo de curso
  function addCursoField(instituicaoIndex) {
    const cursosList = document.querySelector(`.cursos-list[data-instituicao="${instituicaoIndex}"]`);
    const div = document.createElement('div');
    div.className = 'primeiro-login-input-group';
    
    div.innerHTML = `
      <input type="text" name="instituicoes[${instituicaoIndex}][cursos][${cursoCount++}]" placeholder="Ex: Engenharia de Software" required>
      <button type="button" class="primeiro-login-remove-btn remove-curso">✖</button>
    `;
    
    cursosList.appendChild(div);

    // Evento para remover curso
    div.querySelector('.remove-curso').addEventListener('click', function() {
      if (cursosList.children.length > 1) {
        div.remove();
      }
    });
  }

  // Validação do formulário
  form.addEventListener('submit', function(e) {
    let isValid = true;
    
    // Validar cada instituição
    const instituicoesGroups = document.querySelectorAll('.instituicao-group');
    
    instituicoesGroups.forEach(group => {
      const instituicaoInput = group.querySelector('input[name$="[nome]"]');
      const cursosInputs = group.querySelectorAll('input[name^="instituicoes"][name*="[cursos]"]');
      
      // Validar instituição
      if (!instituicaoInput.value.trim()) {
        isValid = false;
        instituicaoInput.style.borderColor = 'red';
      } else {
        instituicaoInput.style.borderColor = '';
      }
      
      // Validar cursos
      let hasValidCurso = false;
      cursosInputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = 'red';
        } else {
          input.style.borderColor = '';
          hasValidCurso = true;
        }
      });
      
      if (!hasValidCurso) {
        isValid = false;
        alert('Cada instituição deve ter pelo menos um curso válido.');
      }
    });
    
    if (!isValid) {

      
      e.preventDefault();
      alert('Por favor, preencha todos os campos obrigatórios.');
    }
  });

  // Delegação de eventos para cursos dinâmicos
  container.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-curso')) {
      const cursosList = e.target.closest('.cursos-list');
      if (cursosList.children.length > 1) {
        e.target.closest('.primeiro-login-input-group').remove();
      }
    }
    
    if (e.target.classList.contains('add-curso')) {
      const instituicaoIndex = e.target.getAttribute('data-instituicao');
      addCursoField(instituicaoIndex);
    }
  });
});