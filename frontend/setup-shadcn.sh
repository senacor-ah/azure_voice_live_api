#!/bin/bash

# Setup Script für shadcn/ui Komponenten

echo "🚀 Installing shadcn/ui components..."
echo ""

# Installiere alle benötigten Komponenten
npx shadcn@latest add button -y
npx shadcn@latest add card -y
npx shadcn@latest add badge -y
npx shadcn@latest add scroll-area -y
npx shadcn@latest add alert -y
npx shadcn@latest add separator -y

echo ""
echo "✅ All shadcn/ui components installed!"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run dev"

