# Script PowerShell para criar todas as tabelas do banco de dados NotaDez
# Equivalente ao create-tables.js

# Carregar variáveis de ambiente do arquivo .env
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Configurações do banco de dados
$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$dbPort = if ($env:DB_PORT) { [int]$env:DB_PORT } else { 3306 }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "notadez" }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$dbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" }

Write-Host "🔧 Criando tabelas no banco de dados..." -ForegroundColor Cyan
Write-Host "📋 Configuração:" -ForegroundColor Yellow
Write-Host "   Host: $dbHost" -ForegroundColor Gray
Write-Host "   Port: $dbPort" -ForegroundColor Gray
Write-Host "   Database: $dbName" -ForegroundColor Gray
Write-Host "   User: $dbUser" -ForegroundColor Gray
Write-Host ""

try {
    # Verificar se mysql.exe existe
    $mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    if (-not (Test-Path $mysqlPath)) {
        # Tentar outros caminhos comuns
        $possiblePaths = @(
            "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
            "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
            "C:\xampp\mysql\bin\mysql.exe",
            "C:\wamp64\bin\mysql\mysql8.0.xx\bin\mysql.exe"
        )
        
        $mysqlPath = $null
        foreach ($path in $possiblePaths) {
            if (Test-Path $path) {
                $mysqlPath = $path
                break
            }
        }
        
        if (-not $mysqlPath) {
            Write-Host "❌ MySQL não encontrado nos caminhos padrão." -ForegroundColor Red
            Write-Host "💡 Por favor, ajuste a variável `$mysqlPath no script com o caminho correto." -ForegroundColor Yellow
            exit 1
        }
    }

    Write-Host "✅ MySQL encontrado em: $mysqlPath" -ForegroundColor Green
    Write-Host ""

    # Criar arquivo SQL temporário
    $sqlFile = Join-Path $env:TEMP "create-tables-$(Get-Date -Format 'yyyyMMddHHmmss').sql"
        
        # Gerar SQL
        $sql = @"
USE $dbName;

-- Tabela users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  primeira_vez BOOLEAN DEFAULT TRUE,
  reset_token VARCHAR(255) NULL,
  reset_expires TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela instituicoes
CREATE TABLE IF NOT EXISTS instituicoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela cursos
CREATE TABLE IF NOT EXISTS cursos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  instituicao_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_instituicao_id (instituicao_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela disciplinas
CREATE TABLE IF NOT EXISTS disciplinas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  sigla VARCHAR(20),
  codigo VARCHAR(50),
  periodo INT,
  curso_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_curso_id (curso_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela turmas
CREATE TABLE IF NOT EXISTS turmas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  dia_semana VARCHAR(50),
  horario VARCHAR(50),
  local VARCHAR(255),
  disciplina_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_disciplina_id (disciplina_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela alunos
CREATE TABLE IF NOT EXISTS alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  RA VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_RA (RA)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela aluno_turma
CREATE TABLE IF NOT EXISTS aluno_turma (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  turma_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
  FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_aluno_turma (aluno_id, turma_id),
  INDEX idx_aluno_id (aluno_id),
  INDEX idx_turma_id (turma_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela componentes
CREATE TABLE IF NOT EXISTS componentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  turma_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo_media ENUM('aritmetica', 'ponderada') NOT NULL,
  peso DECIMAL(5,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
  INDEX idx_turma_id (turma_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela componentes_nota
CREATE TABLE IF NOT EXISTS componentes_nota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  turma_id INT NOT NULL,
  sigla VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
  INDEX idx_turma_id (turma_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela notas
CREATE TABLE IF NOT EXISTS notas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  componente_id INT NOT NULL,
  valor DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
  FOREIGN KEY (componente_id) REFERENCES componentes(id) ON DELETE CASCADE,
  INDEX idx_aluno_id (aluno_id),
  INDEX idx_componente_id (componente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"@

        $sql | Out-File -FilePath $sqlFile -Encoding UTF8
        
    Write-Host "📝 Executando SQL via mysql.exe..." -ForegroundColor Cyan
    Write-Host ""
    
    # Executar SQL usando Get-Content e pipe
    $sqlContent = Get-Content $sqlFile -Raw
    $arguments = "-u `"$dbUser`" -p`"$dbPassword`" -h `"$dbHost`" -P $dbPort `"$dbName`""
    
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $mysqlPath
    $processInfo.Arguments = $arguments
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardInput = $true
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.CreateNoWindow = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null
    $process.StandardInput.Write($sqlContent)
    $process.StandardInput.Close()
    $process.WaitForExit()
    
    $output = $process.StandardOutput.ReadToEnd()
    $errorOutput = $process.StandardError.ReadToEnd()
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Tabela users criada/verificada" -ForegroundColor Green
        Write-Host "✅ Tabela instituicoes criada" -ForegroundColor Green
        Write-Host "✅ Tabela cursos criada" -ForegroundColor Green
        Write-Host "✅ Tabela disciplinas criada" -ForegroundColor Green
        Write-Host "✅ Tabela turmas criada" -ForegroundColor Green
        Write-Host "✅ Tabela alunos criada" -ForegroundColor Green
        Write-Host "✅ Tabela aluno_turma criada" -ForegroundColor Green
        Write-Host "✅ Tabela componentes criada" -ForegroundColor Green
        Write-Host "✅ Tabela componentes_nota criada" -ForegroundColor Green
        Write-Host "✅ Tabela notas criada" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Todas as tabelas foram criadas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao criar tabelas. Código de saída: $($process.ExitCode)" -ForegroundColor Red
        if ($errorOutput) {
            Write-Host "Erro: $errorOutput" -ForegroundColor Red
        }
        Write-Host "💡 Verifique as credenciais do banco de dados no arquivo .env" -ForegroundColor Yellow
        exit 1
    }
    
    # Remover arquivo temporário
    Remove-Item $sqlFile -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Erro ao criar tabelas: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

