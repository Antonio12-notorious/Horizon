#!/bin/bash
# Setup script para Backend MiniERP

set -e

echo "🚀 MiniERP Backend Setup"
echo "======================="
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Instalando dependências..."
npm install
echo "✅ Dependências instaladas"
echo ""

# Step 2: Setup .env
echo "⚙️  Step 2: Configurando variáveis de ambiente..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Arquivo .env criado (copiar de .env.example)"
    echo "   ⚠️  IMPORTANTE: Edite .env com seus valores!"
else
    echo "✅ Arquivo .env já existe"
fi
echo ""

# Step 3: Generate Prisma
echo "🔧 Step 3: Gerando tipos Prisma..."
npx prisma generate
echo "✅ Tipos Prisma gerados"
echo ""

# Step 4: Run migrations
echo "💾 Step 4: Executando migrations..."
npx prisma migrate dev --name init
echo "✅ Database migrations executadas"
echo ""

# Step 5: Build
echo "🏗️  Step 5: Compilando TypeScript..."
npm run build
echo "✅ Build concluído"
echo ""

echo "╔═══════════════════════════════════════╗"
echo "║  ✅ Setup Concluído com Sucesso!      ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "📝 Próximos passos:"
echo "   1. Edite .env com suas configurações"
echo "   2. Execute: npm run dev"
echo "   3. Acesse: http://localhost:3001"
echo ""
echo "📚 Documentação:"
echo "   - API_DOCS.md - Endpoints e exemplos"
echo "   - README.REFACTOR.md - Detalhes das mudanças"
echo "   - CHECKLIST_FINAL.md - Status do projeto"
echo ""
