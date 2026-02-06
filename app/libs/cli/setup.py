from __future__ import annotations


"""Predator CLI Package Setup.

Install with: pip install -e ./libs/cli
Then use: predator --help
"""

from setuptools import setup


setup(
    name="predator-cli",
    version="22.0.0",
    description="Unified CLI for Predator Analytics Platform",
    author="Predator Team",
    author_email="team@predator.ai",
    py_modules=["predator_cli"],
    install_requires=[
        "click>=8.0.0",
        "httpx>=0.24.0",
        "rich>=13.0.0",
    ],
    entry_points={
        "console_scripts": [
            "predator=predator_cli:cli",
        ],
    },
    python_requires=">=3.10",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)
