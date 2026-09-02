# Contributing to Home Assistant Notes

Thank you for your interest in contributing to Home Assistant Notes! This document provides guidelines and instructions for contributing.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your Home Assistant version
- Any relevant logs or screenshots

### Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature has already been requested
- Clearly describe the feature and its benefits
- Explain how it fits with the existing functionality

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature/fix: `git checkout -b feature/my-new-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear, descriptive messages
6. Push to your fork
7. Create a Pull Request

## Development Setup

### Prerequisites

- Home Assistant development environment
- Python 3.11 or later
- Basic knowledge of Home Assistant integrations

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/dimac-h/Home-Assistant-Notes.git
   cd Home-Assistant-Notes
   ```

2. Create a symbolic link in your Home Assistant config directory:
   ```bash
   ln -s $(pwd)/custom_components/better_notes ~/.homeassistant/custom_components/better_notes
   ```

3. Restart Home Assistant

4. Check logs for any errors:
   ```bash
   tail -f ~/.homeassistant/home-assistant.log | grep better_notes
   ```

### Testing

Before submitting a PR, please:
- Test the integration in a Home Assistant instance
- Verify all services work correctly
- Test the frontend panel and card
- Check for Python errors in the logs
- Ensure the code follows Home Assistant conventions

## Code Style

### Python

- Follow PEP 8
- Use type hints where appropriate
- Add docstrings to functions and classes
- Use meaningful variable names

### JavaScript

- Use modern ES6+ syntax
- Follow existing code style
- Comment complex logic
- Use semicolons consistently

### File Organization

```
custom_components/better_notes/
├── __init__.py          # Integration setup
├── const.py             # Constants only
├── storage.py           # Storage logic
├── config_flow.py       # Configuration
├── services.yaml        # Service definitions
├── www/                 # Frontend code
└── translations/        # UI translations
```

## Commit Messages

Use clear, descriptive commit messages:
- Use the imperative mood ("Add feature" not "Added feature")
- Keep the first line under 50 characters
- Add detailed description if needed

Good examples:
- `Add tag filtering to notes list`
- `Fix pinned notes sorting issue`
- `Update documentation for service calls`

## Documentation

When adding features:
- Update the README.md
- Add service documentation to services.yaml
- Include code examples where applicable
- Update translations if adding UI text

## Questions?

Feel free to open an issue for any questions about contributing!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
