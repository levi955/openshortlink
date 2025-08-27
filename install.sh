#!/bin/bash
# Ultimate Mine Bot Installation Script

echo "🚀 Installing Ultimate Mine Bot..."
echo "=================================="

# Check if Python 3.8+ is installed
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python version: $python_version"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
python3 -m playwright install chromium

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env configuration file..."
    cp .env.example .env
    echo "✅ Created .env file - please customize it with your settings"
else
    echo "✅ .env file already exists"
fi

# Make scripts executable
chmod +x main.py
chmod +x test_bot.py

# Run tests
echo "🧪 Running tests..."
python3 test_bot.py

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Run: python3 main.py --help"
echo "  3. Start bot: python3 main.py"
echo ""
echo "⚠️  Remember: Only gamble what you can afford to lose!"