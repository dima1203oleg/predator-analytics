from __future__ import annotations

from setuptools import find_packages, setup

setup(
    name="google_agentctl",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "typer[all]",
        "rich",
        "requests",
        "pyyaml"
    ],
    entry_points={
        "console_scripts": [
            "google-agentctl=google_agentctl.app:app",
        ],
    },
)
