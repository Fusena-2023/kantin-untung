#!/bin/bash
# generate-jwt-secret.sh - Generate secure JWT secret

echo "🔐 JWT Secret Generator"
echo "======================="
echo ""
echo "Generating 32-character random string..."
echo ""

# Generate random 32 chars
JWT_SECRET=$(openssl rand -base64 32)

echo "Your JWT_SECRET:"
echo "================"
echo "$JWT_SECRET"
echo ""
echo "📋 Copy the above string and paste it in:"
echo "   Railway → Backend Service → Variables → JWT_SECRET"
echo ""
echo "⚠️  Keep this secret safe! Do not commit to GitHub."
