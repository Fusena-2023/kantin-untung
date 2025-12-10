#!/bin/bash
# Script untuk setup Railway deployment
# Jalankan: chmod +x setup-railway.sh && ./setup-railway.sh

echo "🚀 Kantin Untung - Railway Setup Script"
echo "========================================"
echo ""
echo "Langkah-langkah:"
echo "1. Login ke Railway: https://railway.app"
echo "2. Create New Project → Provision PostgreSQL"
echo "3. Copy PostgreSQL connection string"
echo "4. Paste connection string di bawah:"
echo ""

read -p "Enter DATABASE_URL: " DATABASE_URL
read -p "Enter JWT_SECRET (min 32 chars): " JWT_SECRET
read -p "Enter FRONTEND_URL (dari Vercel): " FRONTEND_URL

echo ""
echo "📝 Environment variables untuk Railway:"
echo "PORT=3001"
echo "NODE_ENV=production"
echo "DATABASE_URL=$DATABASE_URL"
echo "JWT_SECRET=$JWT_SECRET"
echo "FRONTEND_URL=$FRONTEND_URL"
echo ""
echo "✅ Salin variables di atas ke Railway dashboard!"
