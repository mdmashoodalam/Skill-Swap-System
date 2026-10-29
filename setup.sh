#!/bin/bash
# Skill Swap Platform - Complete Setup Script
# This script automates the setup process

echo "🚀 Skill Swap Platform - Automated Setup"
echo "========================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install Java 21+"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v mvn &> /dev/null; then
    echo "⚠️  Maven not found. Please ensure Maven 3.8+ is installed"
    exit 1
fi

echo "✅ All prerequisites found"
echo ""

# Backend Setup
echo "🔧 Setting up Backend..."
cd backend
echo "   Installing backend dependencies..."
mvn clean install -q
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend installation failed"
    exit 1
fi
cd ..
echo ""

# Frontend Setup
echo "🎨 Setting up Frontend..."
cd frontend
echo "   Installing frontend dependencies..."
npm install --legacy-peer-deps -s
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend installation failed"
    exit 1
fi
cd ..
echo ""

echo "✨ Setup Complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Start MySQL database"
echo "   2. Create database: CREATE DATABASE skillswap;"
echo "   3. In Terminal 1: cd backend && mvn spring-boot:run"
echo "   4. In Terminal 2: cd frontend && npm run dev"
echo "   5. Open http://localhost:5173 in your browser"
echo ""
echo "📚 More info: See QUICK_START.md"
